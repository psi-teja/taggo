from .models import Annotation, Settings
from django.http import JsonResponse, HttpResponse, Http404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
import logging, boto3, json, io, random
from PIL import Image
from django.contrib.auth.models import User
import pytesseract
from .utils import get_current_time_ist

logger = logging.getLogger(__name__)

# Upload file to S3
s3 = boto3.client("s3")


@api_view(["GET"])
# @permission_classes([IsAuthenticated])
def get_document(request, id: str):
    try:
        s3_file_key = Annotation.objects.values("s3_file_key").get(id=id)["s3_file_key"]

        # Retrieve file content from S3
        s3_response = s3.get_object(Bucket=settings.S3_DOC_BUCKET, Key=s3_file_key)
        file_content = s3_response["Body"].read()

        if not s3_file_key.endswith(".pdf"):
            img = Image.open(io.BytesIO(file_content))
            pdf_bytes = io.BytesIO()
            img.save(pdf_bytes, format="PDF")
            pdf_bytes.seek(0)
            file_content = pdf_bytes.read()

        # Set headers for PDF content
        response = HttpResponse(file_content, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{id}.pdf"'
        return response

    except Exception as e:
        logger.error(f"Error retrieving document: {e}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_json(request, status: str, id: str):
    try:
        if status == "uploaded":
            status_in_db = Annotation.objects.get(id=id).status
            if status_in_db == "uploaded":
                return JsonResponse({"status": "success", "data": None}, safe=False)

            status = status_in_db

        elif status == "pre-labelled":
            bucket = settings.S3_PRE_LABEL_BUCKET

        elif status in ["in-labelling", "in-review", "accepted"]:
            bucket = settings.S3_LABELLING_BUCKET

        elif status == "completed":
            bucket = settings.S3_LABEL_BUCKET

        else:
            return JsonResponse(
                {"status": "error", "message": "Invalid status"}, status=400
            )

        s3_file_key = f"{id}.json"
        s3_response = s3.get_object(Bucket=bucket, Key=s3_file_key)
        json_content = s3_response["Body"].read().decode("utf-8")
        data = json.loads(json_content)

        return JsonResponse({"status": "success", "data": data}, safe=False)

    except Exception as e:
        logger.error(f"Error retrieving JSON document: {e}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def save(request, status: str, id: str):
    try:
        json_data = request.body.decode("utf-8")

        if status in ["in-labelling", "in-review", "accepted"]:
            bucket = settings.S3_LABELLING_BUCKET
        elif status == "completed":
            bucket = settings.S3_LABEL_BUCKET
        else:
            return JsonResponse(
                {"status": "error", "message": "Invalid status"}, status=400
            )

        s3_file_key = f"{id}.json"

        s3.put_object(Bucket=bucket, Key=s3_file_key, Body=json_data)

        return JsonResponse(
            {"status": "success", "message": f"{status} JSON data saved successfully"},
            safe=False,
        )

    except Exception as e:
        logger.error(f"Error saving JSON data: {e}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit(request, status: str, id: str):
    try:
        json_data = request.body.decode("utf-8")

        if status == "in-labelling":
            bucket = settings.S3_LABELLING_BUCKET
        else:
            return JsonResponse(
                {"status": "error", "message": "Invalid status"}, status=400
            )

        s3_file_key = f"{id}.json"

        s3.put_object(Bucket=bucket, Key=s3_file_key, Body=json_data)

        annotation = Annotation.objects.get(id=id)
        annotation.labelled_by = request.user
        ist_time = get_current_time_ist()
        annotation.history.append(f"{ist_time}: labelled by {request.user.username}")

        setting = Settings.objects.get(key="submit")

        if annotation.reviewed_by:
            annotation.status = "in-review"
            annotation.assigned_to_user = annotation.reviewed_by
        elif random.random() <= setting.value / 100:
            annotation.status = "in-review"
            reviewers = User.objects.filter(groups__name="reviewers")
            if reviewers.exists():
                annotation.assigned_to_user = reviewers.order_by("?").first()
                annotation.history.append(
                    f"{ist_time}: assigned to {annotation.assigned_to_user.username}"
                )
        else:
            annotation.status = "completed"
            s3.put_object(
                Bucket=settings.S3_LABEL_BUCKET, Key=s3_file_key, Body=json_data
            )
            annotation.assigned_to_user = None
            annotation.history.append(f"{ist_time}: moved to completed")

        annotation.save()

        return JsonResponse(
            {"status": "success", "message": f"{status} JSON data saved successfully"},
            safe=False,
        )

    except Exception as e:
        logger.error(f"Error saving JSON data: {e}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_ocr_text(request):
    try:
        if request.method == "POST" and "file" in request.FILES:
            uploaded_file = request.FILES["file"]

            # Use Pillow to open the uploaded image file
            image = Image.open(uploaded_file)

            # Apply OCR using pytesseract
            text = pytesseract.image_to_string(image)

            text = text.strip()

            # Return the extracted text as JSON response
            return JsonResponse({"text": text})

        return JsonResponse({"error": "POST method and file data required"}, status=400)
    except Exception as e:
        logger.error(f"Error processing OCR: {e}")
        return JsonResponse({"error": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reject(request, status: str, id: str):
    try:
        json_data = request.body.decode("utf-8")
        if status in ["in-review", "accepted"]:
            bucket = settings.S3_LABELLING_BUCKET
        else:
            return JsonResponse(
                {"status": "error", "message": "Cannot reject!"}, status=400
            )

        s3.put_object(Bucket=bucket, Key=f"{id}.json", Body=json_data)
        annotation = Annotation.objects.get(id=id)

        if annotation.reviewed_by:
            annotation.status = "in-review"
            annotation.assigned_to_user = annotation.reviewed_by
        elif annotation.labelled_by:
            annotation.status = "in-labelling"
            annotation.assigned_to_user = annotation.labelled_by
            annotation.reviewed_by = request.user
        else:
            return JsonResponse(
                {"status": "error", "message": "Cannot reject!"}, status=400
            )

        ist_time = get_current_time_ist()
        annotation.history.append(f"{ist_time}: rejected by {request.user.username}")
        annotation.history.append(
            f"{ist_time}: assigned to {annotation.assigned_to_user.username}"
        )
        annotation.save()
        return JsonResponse(
            {"status": "success", "message": "Annotation rejected"}, safe=False
        )

    except Exception as e:
        logger.error(f"Error rejecting annotation: {e}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def accept(request, status: str, id: str):
    try:
        json_data = request.body.decode("utf-8")
        if status != "in-review":
            return JsonResponse(
                {"status": "error", "message": "Cannot accept!"}, status=400
            )

        s3.put_object(
            Bucket=settings.S3_LABELLING_BUCKET, Key=f"{id}.json", Body=json_data
        )
        annotation = Annotation.objects.get(id=id)
        annotation.status = "accepted"
        ist_time = get_current_time_ist()
        annotation.history.append(f"{ist_time}: accepted by {request.user.username}")

        annotation.reviewed_by = request.user
        annotation.assigned_to_user = None

        setting = Settings.objects.get(key="accept")

        if random.random() <= setting.value / 100:
            superusers = User.objects.filter(is_superuser=True)
            if superusers.exists():
                annotation.assigned_to_user = superusers.order_by("?").first()

            annotation.history.append(
                f"{ist_time}: assigned to {annotation.assigned_to_user}"
            )
        else:
            annotation.status = "completed"
            annotation.assigned_to_user = None
            s3.put_object(
                Bucket=settings.S3_LABEL_BUCKET, Key=f"{id}.json", Body=json_data
            )
            annotation.history.append(f"{ist_time}: moved to completed")

        annotation.save()
        return JsonResponse(
            {"status": "success", "message": "Annotation accepted!"}, safe=False
        )

    except Exception as e:
        logger.error(f"Error accepting annotation: {e}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def move_to_completed(request, status: str, id: str):
    if not request.user.is_superuser:
        return JsonResponse(
            {
                "status": "error",
                "message": "You are not authorized to move to completed",
            },
            status=403,
        )

    try:
        json_data = request.body.decode("utf-8")
        if status != "accepted":
            return JsonResponse(
                {"status": "error", "message": "Cannot accept!"}, status=400
            )

        annotation = Annotation.objects.get(id=id)
        ist_time = get_current_time_ist()
        annotation.status = "completed"
        annotation.assigned_to_user = None
        s3.put_object(Bucket=settings.S3_LABEL_BUCKET, Key=f"{id}.json", Body=json_data)
        annotation.history.append(
            f"{ist_time}: moved to completed by {request.user.username}"
        )
        annotation.save()
        return JsonResponse(
            {"status": "success", "message": "Annotation accepted!"}, safe=False
        )

    except Exception as e:
        logger.error(f"Error rejecting annotation: {e}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_next(request, id: str):
    try:
        current_annotation = Annotation.objects.get(id=id)
        if request.user.is_superuser:
            next_annotation = (
                Annotation.objects.filter(
                    inserted_time__lt=current_annotation.inserted_time
                )
                .order_by("-inserted_time")
                .first()
            )
        else:
            next_annotation = (
                Annotation.objects.filter(
                    assigned_to_user=request.user,
                    inserted_time__lt=current_annotation.inserted_time,
                )
                .order_by("-inserted_time")
                .first()
            )

        if next_annotation:
            annotation_data = next_annotation.__dict__
            if next_annotation.assigned_to_user_id:
                try:
                    user = User.objects.get(id=next_annotation.assigned_to_user_id)
                    annotation_data["assigned_to_user"] = user.username
                except User.DoesNotExist:
                    annotation_data["assigned_to_user"] = None
            else:
                annotation_data["assigned_to_user"] = None
            del annotation_data["_state"]  # Remove the internal state field
            return JsonResponse(
                {"status": "success", "annotation": annotation_data}, safe=False
            )
        return JsonResponse(
            {"status": "success", "message": "No more documents to label"}, safe=False
        )

    except Annotation.DoesNotExist:
        return JsonResponse(
            {"status": "error", "message": "Annotation not found"}, status=404
        )

    except Exception as e:
        logger.error(f"Error retrieving next annotation: {e}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_prev(request, id: str):
    try:
        current_annotation = Annotation.objects.get(id=id)
        if request.user.is_superuser:
            prev_annotation = (
                Annotation.objects.filter(
                    inserted_time__gt=current_annotation.inserted_time
                )
                .order_by("inserted_time")
                .first()
            )
        else:
            prev_annotation = (
                Annotation.objects.filter(
                    assigned_to_user=request.user,
                    inserted_time__gt=current_annotation.inserted_time,
                )
                .order_by("inserted_time")
                .first()
            )

        if prev_annotation:
            annotation_data = prev_annotation.__dict__
            if prev_annotation.assigned_to_user_id:
                try:
                    user = User.objects.get(id=prev_annotation.assigned_to_user_id)
                    annotation_data["assigned_to_user"] = user.username
                except User.DoesNotExist:
                    annotation_data["assigned_to_user"] = None
            else:
                annotation_data["assigned_to_user"] = None
            del annotation_data["_state"]  # Remove the internal state field
            return JsonResponse(
                {"status": "success", "annotation": annotation_data}, safe=False
            )
        return JsonResponse(
            {"status": "success", "message": "No more documents to label"}, safe=False
        )

    except Annotation.DoesNotExist:
        return JsonResponse(
            {"status": "error", "message": "Annotation not found"}, status=404
        )
    except Exception as e:
        logger.error(f"Error retrieving previous annotation: {e}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)
