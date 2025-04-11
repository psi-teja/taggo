from .models import Segregation, InvoiceType, InvoiceSubtype
from django.http import JsonResponse, HttpResponse
from django.contrib.auth.models import User
from django.conf import settings
import logging
from django.db import transaction
import boto3
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
import json
from django.contrib.auth.models import Group
from rest_framework import status
from django.db.models import Count, Q
from .utils import get_current_time_ist
from django.utils import timezone
import uuid
import io
import PyPDF2
from PIL import Image

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import os

s3 = boto3.client("s3")
# Upload file to S3


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_segregations(
    request,
    assignee: str,
    status: str,
    perPage: int,
    page: int,
    searchID: str,
):

    if request.user.is_superuser:
        if assignee == "all":
            annotations_list = Segregation.objects.all().exclude(status="skipped")
        elif assignee == "unassigned":
            annotations_list = Segregation.objects.filter(
                assigned_to_user=None
            ).exclude(status="skipped")
        else:
            annotations_list = Segregation.objects.filter(
                assigned_to_user__username=assignee
            ).exclude(status="skipped")
    else:
        annotations_list = Segregation.objects.filter(
            assigned_to_user=request.user
        ).exclude(status="skipped")

    if status != "all":
        annotations_list = annotations_list.filter(status=status)

    if searchID != "null":
        annotations_list = annotations_list.filter(id__icontains=searchID)

    paginator = Paginator(
        annotations_list, perPage
    )  # Use perPage for annotations per page

    try:
        annotations = paginator.page(page)
    except PageNotAnInteger:
        annotations = paginator.page(1)
    except EmptyPage:
        annotations = paginator.page(paginator.num_pages)

    data = []
    for annotation in annotations.object_list:
        annotation_data = annotation.__dict__
        if annotation.assigned_to_user_id:
            try:
                user = User.objects.get(id=annotation.assigned_to_user_id)
                annotation_data["assigned_to_user"] = user.username
            except User.DoesNotExist:
                annotation_data["assigned_to_user"] = None
        else:
            annotation_data["assigned_to_user"] = None

        del annotation_data["_state"]  # Remove the internal state field
        data.append(annotation_data)

    return JsonResponse(
        {
            "segregations": data,
            "page": annotations.number,
            "pages": paginator.num_pages,
            "total_segregations": paginator.count,
            "is_last_page": not annotations.has_next(),
        },
        safe=False,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_document_seg(request):
    if request.method == "POST":

        if not request.user.is_superuser:
            return JsonResponse(
                {"status": "error", "message": "Only superusers can upload documents"},
                status=403,
            )

        if "document" not in request.FILES:
            return JsonResponse(
                {"status": "error", "message": "No file uploaded"}, status=400
            )

        uploaded_file = request.FILES["document"]
        file_extension = uploaded_file.name.split(".")[-1].lower()

        try:
            with transaction.atomic():
                # Determine uploader
                uploader = (
                    request.user.username
                    if request.user.is_authenticated
                    else "Anonymous"
                )
                # Create a new annotation record
                annotation = Segregation(id=str(uuid.uuid4()), status="uploaded")
                ist_time = get_current_time_ist()
                annotation.history = [f"{ist_time}: uploaded by {uploader}"]
                annotation.save()

                # Use UUID as the file key
                s3_file_key = f"{annotation.id}.{file_extension}"
                s3.upload_fileobj(
                    uploaded_file, settings.S3_DOC_BUCKET_SEG, s3_file_key
                )

                # Update annotation record
                annotation.s3_file_key = s3_file_key
                annotation.save()

                # send message to SQS
                sqs = boto3.client("sqs", region_name="ap-south-1")
                sqs.send_message(
                    QueueUrl=settings.SQS_SEGREGATION_QUEUE_URL,
                    MessageBody=json.dumps(
                        {
                            "id": str(annotation.id),
                            "s3_doc_bucket": settings.S3_DOC_BUCKET_SEG,
                            "s3_file_key": s3_file_key,
                            "database": settings.DATABASES["default"],
                        }
                    ),
                )

                logger.info(
                    f"File '{uploaded_file.name}' uploaded successfully by '{uploader}'"
                )

                return JsonResponse(
                    {
                        "status": "success",
                        "message": f"File '{uploaded_file.name}' uploaded successfully.",
                        "file_path": s3_file_key,
                    }
                )

        except Exception as e:
            logger.error(
                f"Error uploading document '{uploaded_file.name}' by '{uploader}': {e}"
            )
            return JsonResponse({"status": "error", "message": str(e)}, status=500)


# @api_view(["POST"])
# @permission_classes([IsAuthenticated])
# def upload_document_seg(request):
#     if request.method == "POST":
#         if not request.user.is_superuser:
#             return JsonResponse(
#                 {"status": "error", "message": "Only superusers can upload documents"},
#                 status=403,
#             )
#         if "document" not in request.FILES:
#             return JsonResponse(
#                 {"status": "error", "message": "No file uploaded"}, status=400
#             )
#         uploaded_file = request.FILES["document"]
#         file_extension = uploaded_file.name.split(".")[-1].lower()
#         try:
#             with transaction.atomic():
#                 # Determine uploader
#                 uploader = (
#                     request.user.username
#                     if request.user.is_authenticated
#                     else "Anonymous"
#                 )
#                 if file_extension.lower() == "pdf":
#                     # Use UUID as the document ID
#                     doc_id = str(uuid.uuid4())
#                     # Create a new annotation record for each page in the PDF
#                     pdf_reader = PyPDF2.PdfReader(uploaded_file)
#                     num_pages = len(pdf_reader.pages)
#                     for page in range(num_pages):
#                         annotation = Segregation(
#                             id=f"{doc_id}_{page+1}", status="uploaded"
#                         )
#                         ist_time = get_current_time_ist()
#                         annotation.history = [f"{ist_time}: uploaded by {uploader}"]
#                         annotation.save()
#                         # Use UUID as the file key
#                         s3_file_key = f"{annotation.id}.{file_extension}"
#                         # Upload only the current page of the PDF
#                         pdf_writer = PyPDF2.PdfWriter()
#                         pdf_writer.add_page(pdf_reader.pages[page])
#                         # Create a temporary in-memory file to hold the single page PDF
#                         temp_pdf = io.BytesIO()
#                         pdf_writer.write(temp_pdf)
#                         temp_pdf.seek(0)
#                         s3.upload_fileobj(
#                             temp_pdf, settings.S3_DOC_BUCKET_SEG, s3_file_key
#                         )
#                         # Update annotation record
#                         annotation.s3_file_key = s3_file_key
#                         annotation.save()
#                         sqs = boto3.client("sqs", region_name="ap-south-1")
#                         # send message to SQS
#                         sqs.send_message(
#                             QueueUrl=settings.SQS_SEGREGATION_QUEUE_URL,
#                             MessageBody=json.dumps(
#                                 {
#                                     "id": str(annotation.id),
#                                     "s3_doc_bucket": settings.S3_DOC_BUCKET_SEG,
#                                     "s3_file_key": s3_file_key,
#                                     "database": settings.DATABASES["default"],
#                                 }
#                             ),
#                         )
#                 else:
#                     # Create a new annotation record
#                     annotation = Segregation(id=str(uuid.uuid4()), status="uploaded")
#                     ist_time = get_current_time_ist()
#                     annotation.history = [f"{ist_time}: uploaded by {uploader}"]
#                     annotation.save()
#                     # Use UUID as the file key
#                     s3_file_key = f"{annotation.id}.{file_extension}"
#                     s3.upload_fileobj(
#                         uploaded_file, settings.S3_DOC_BUCKET_SEG, s3_file_key
#                     )
#                     # Update annotation record
#                     annotation.s3_file_key = s3_file_key
#                     annotation.save()
#                     # send message to SQS
#                     sqs = boto3.client("sqs", region_name="ap-south-1")
#                     sqs.send_message(
#                         QueueUrl=settings.SQS_SEGREGATION_QUEUE_URL,
#                         MessageBody=json.dumps(
#                             {
#                                 "id": str(annotation.id),
#                                 "s3_doc_bucket": settings.S3_DOC_BUCKET_SEG,
#                                 "s3_file_key": s3_file_key,
#                                 "database": settings.DATABASES["default"],
#                             }
#                         ),
#                     )
#                 logger.info(
#                     f"File '{uploaded_file.name}' uploaded successfully by '{uploader}'"
#                 )
#                 return JsonResponse(
#                     {
#                         "status": "success",
#                         "message": f"File '{uploaded_file.name}' uploaded successfully.",
#                         "file_path": s3_file_key,
#                     }
#                 )
#         except Exception as e:
#             logger.error(
#                 f"Error uploading document '{uploaded_file.name}' by '{uploader}': {e}"
#             )
#             return JsonResponse({"status": "error", "message": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def assign_segregation(request):
    if request.method == "POST":
        try:
            annotation_id = request.data["id"]
            username = request.data["username"]
            assigned_by = request.user
            annotation = Segregation.objects.get(id=annotation_id)
            if username == None:
                assign_to_user = None
                history_message = f"unassigned by {assigned_by.username}"
            else:
                assign_to_user = User.objects.get(username=username)
                assigned_to_username = assign_to_user.username
                history_message = (
                    f"assigned to {assigned_to_username} by {assigned_by.username}"
                )

            annotation.assigned_to_user = assign_to_user
            ist_time = get_current_time_ist()

            annotation.history.append(f"{ist_time}: {history_message}")
            annotation.save()

            return JsonResponse(
                {
                    "status": "success",
                    "message": f"Annotation {annotation_id} assigned to user {username}",
                },
                safe=False,
            )

        except Exception as e:
            logger.error(f"Error assigning annotation: {e}")
            return JsonResponse({"status": "error", "message": str(e)}, status=500)

    return JsonResponse(
        {"status": "error", "message": "Invalid request method"}, status=400
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def smart_assign_seg(request):
    try:
        # Extract request data
        status = request.data["status"]
        user_group = request.data["userGroup"]
        total_count = request.data["totalCount"]
        user_file_distribution = request.data["userFileDistribution"]

        if not request.user.is_superuser:
            return JsonResponse(
                {
                    "status": "error",
                    "message": "Only superusers can access this endpoint",
                },
                status=403,
            )

        annotations = Segregation.objects.filter(status=status, assigned_to_user=None)

        users = User.objects.filter(groups__name=user_group).values("id", "username")
        user_count = len(users)
        if user_count == 0:
            return JsonResponse(
                {"status": "error", "message": "No users found in the specified group"},
                status=404,
            )

        total_assigned_count = sum(user["files"] for user in user_file_distribution)
        if total_assigned_count != total_count:
            return JsonResponse(
                {
                    "status": "error",
                    "message": "The total count of annotations to be assigned must equal the available annotations",
                },
                status=400,
            )

        annotations_assigned = 0
        modified_annotations = []

        for user_percentage in user_file_distribution:
            username = user_percentage["userId"]
            count = user_percentage["files"]

            try:
                user = User.objects.get(username=username)
                user_id = user.id
            except User.DoesNotExist:
                return JsonResponse(
                    {"status": "error", "message": f"User '{username}' not found."},
                    status=404,
                )

            assigned_annotations = annotations[
                annotations_assigned : annotations_assigned + count
            ]

            for annotation in assigned_annotations:
                annotation.assigned_to_user_id = user_id
                annotation.status = "in-progress"
                ist_time = get_current_time_ist()
                annotation.history.append(
                    f"{ist_time}: assigned to {username} by {request.user.username} (smart assign)"
                )
                modified_annotations.append(annotation)

            annotations_assigned += count

        # Perform bulk update if there are modified annotations
        if modified_annotations:
            Segregation.objects.bulk_update(
                modified_annotations,
                fields=["assigned_to_user_id", "status", "history"],
            )

        return JsonResponse(
            {
                "status": "success",
                "message": f"{annotations_assigned} annotations assigned successfully",
            },
            safe=False,
        )

    except Exception as e:
        logger.error(f"Error assigning annotations: {e}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_smart_assign_data_seg(request):
    all_groups = Group.objects.all().values("name", "user__username")
    groups_with_users = {}
    for group in all_groups:
        group_name = group["name"]
        if group_name == "labellers":
            user_name = group["user__username"]
            if group_name not in groups_with_users:
                groups_with_users[group_name] = []
            groups_with_users[group_name].append(user_name)

    annotation_status_counts = (
        Segregation.objects.values("status")
        .annotate(
            total_count=Count("status"),
            unassigned_count=Count("status", filter=Q(assigned_to_user=None)),
        )
        .order_by("status")
    )
    status_counts = {
        item["status"]: {
            "total_count": item["total_count"],
            "unassigned_count": item["unassigned_count"],
        }
        for item in annotation_status_counts
    }

    return JsonResponse(
        {"groups": groups_with_users, "status": status_counts},
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_segregated_count(request):
    try:
        total_count = Segregation.objects.count()
        inprogress_counts = (
            Segregation.objects.filter(
                status__in=["uploaded", "in-progress", "segregated"]
            )
            .values("status")
            .annotate(count=Count("status"))
        )

        # Initialize inprogress with all possible statuses
        inprogress = {
            status: 0
            for status in [
                "uploaded",
                "in-progress",
                "segregated",
            ]
        }
        for status in inprogress_counts:
            inprogress[status["status"]] = status["count"]

        return JsonResponse(
            {
                "total": total_count,
                "inprogress": inprogress,
            },
            status=200,
        )

    except Exception as e:
        logger.error(f"Error retrieving annotation counts: {e}")
        return JsonResponse(
            {"status": "error", "message": "An unexpected error occurred."}, status=500
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_groups_with_users_seg(request):
    if not request.user.is_superuser:
        return JsonResponse(
            {"status": "error", "message": "Only superusers can access this endpoint"},
            status=403,
        )

    all_groups = Group.objects.all().values("name", "user__username")
    groups_with_users = {}
    for group in all_groups:
        group_name = group["name"]
        user_name = group["user__username"]
        if group_name not in groups_with_users:
            groups_with_users[group_name] = []
        groups_with_users[group_name].append(user_name)

    superusers = User.objects.filter(is_superuser=True).values_list(
        "username", flat=True
    )
    groups_with_users["superusers"] = list(superusers)

    return JsonResponse(groups_with_users, status=200)


@api_view(["GET"])
# @permission_classes([IsAuthenticated])
def get_document_seg(request, id: str):
    try:
        s3_file_key = Segregation.objects.values("s3_file_key").get(id=id)[
            "s3_file_key"
        ]
        print("s3_file_key", s3_file_key)
        # Retrieve file content from S3
        s3_response = s3.get_object(Bucket=settings.S3_DOC_BUCKET_SEG, Key=s3_file_key)
        file_content = s3_response["Body"].read()

        print("file received from s3")
        if not s3_file_key.endswith(".pdf"):
            img = Image.open(io.BytesIO(file_content))
            pdf_bytes = io.BytesIO()
            img.save(pdf_bytes, format="PDF")
            pdf_bytes.seek(0)
            file_content = pdf_bytes.read()

        print("conversion to bytes")
        # Set headers for PDF content
        response = HttpResponse(file_content, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{id}.pdf"'

        print("response", response)
        return response

    except Exception as e:
        logger.error(f"Error retrieving document: {e}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


# changesssssssssssssssssssssssssssssssssssssssssssssss
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_segregated_s3(request):
    if "document" not in request.FILES:
        return JsonResponse(
            {"status": "error", "message": "No file uploaded"}, status=400
        )

    uploaded_file = request.FILES["document"]
    file_extension = uploaded_file.name.split(".")[-1].lower()
    segregation_type = request.POST.get("invoice_types", {})
    id = request.POST.get("id", "null")

    try:
        invoice_types = json.loads(segregation_type)
        if not invoice_types:
            return JsonResponse(
                {"status": "error", "message": "Invalid invoice_type data"}, status=400
            )

        invoice_type = list(invoice_types.keys())[0]  # Get the first key (invoice type)
        invoice_subtype = invoice_types[invoice_type]  # Get the list of subtypes

        # Construct s3_file_key based on invoice_type and invoice_subtype
        if invoice_type == "Others":
            s3_file_key = f"{invoice_type}/{id}.{file_extension}"
        else:
            # Join subtypes with underscores (if any)
            subtype_path = "_".join(invoice_subtype) if invoice_subtype else "Others"
            s3_file_key = f"{invoice_type}/{subtype_path}/{id}.{file_extension}"
        s3.upload_fileobj(uploaded_file, settings.S3_SEGREGATED_BUCKET, s3_file_key)

        annotation = Segregation.objects.get(id=id)
        if invoice_type == "Others":
            annotation.invoice_type = invoice_type
        else:
            annotation.invoice_type = invoice_type
            annotation.invoice_subtype = "_".join(invoice_subtype)
        print(invoice_type, invoice_subtype)
        annotation.status = "segregated"
        annotation.s3_segregated_key = s3_file_key
        annotation.save()
        annotation.labelled_by = request.user
        annotation.assigned_to_user = None
        ist_time = get_current_time_ist()
        annotation.history.append(f"{ist_time}: segregated by {request.user.username}")
        annotation.history.append(f"{ist_time}: moved to completed")
        annotation.save()

        return JsonResponse(
            {"status": "success", "message": f"{status} Document saved successfully"},
            safe=False,
        )

    except Exception as e:
        logger.error(f"Error saving Document data: {e}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_next_seg(request, id: str):
    try:
        current_annotation = Segregation.objects.get(id=id)
        if request.user.is_superuser:
            next_annotation = (
                Segregation.objects.filter(
                    inserted_time__lt=current_annotation.inserted_time
                )
                .exclude(status="skipped")
                .order_by("-inserted_time")
                .first()
            )
        else:
            next_annotation = (
                Segregation.objects.filter(
                    assigned_to_user=request.user,
                    inserted_time__lt=current_annotation.inserted_time,
                )
                .exclude(status="skipped")
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

    except Segregation.DoesNotExist:
        return JsonResponse(
            {"status": "error", "message": "Annotation not found"}, status=404
        )

    except Exception as e:
        logger.error(f"Error retrieving next annotation: {e}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_prev_seg(request, id: str):
    try:
        current_annotation = Segregation.objects.get(id=id)
        if request.user.is_superuser:
            prev_annotation = (
                Segregation.objects.filter(
                    inserted_time__gt=current_annotation.inserted_time
                )
                .exclude(status="skipped")
                .order_by("inserted_time")
                .first()
            )
        else:
            prev_annotation = (
                Segregation.objects.filter(
                    assigned_to_user=request.user,
                    inserted_time__gt=current_annotation.inserted_time,
                )
                .exclude(status="skipped")
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

    except Segregation.DoesNotExist:
        return JsonResponse(
            {"status": "error", "message": "Annotation not found"}, status=404
        )
    except Exception as e:
        logger.error(f"Error retrieving previous annotation: {e}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_invoice_types(request):
    try:
        invoice_types_list = InvoiceType.objects.all()
        invoice_subtypes_list = InvoiceSubtype.objects.all()
        invoice_types = {}
        for invoice_type in invoice_types_list:
            invoice_types[invoice_type.name] = [
                subtype.name
                for subtype in invoice_subtypes_list
                if subtype.invoice_type_id == invoice_type.id
            ]
        return JsonResponse(
            {
                "invoice_types": invoice_types,
            },
            safe=False,
        )
    except Exception as e:
        logger.error(f"Error retrieving invoice types: {e}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def put_invoice_types(request):
    try:
        data = json.loads(request.body)
        invoice_types = data.get("invoice_types", {})

        for invoice_type, subtypes in invoice_types.items():
            invoice_type_obj, created = InvoiceType.objects.get_or_create(
                name=invoice_type
            )
            if created:
                for subtype in subtypes:
                    InvoiceSubtype.objects.get_or_create(
                        name=subtype, invoice_type=invoice_type_obj
                    )
            else:
                # If the type already exists, add only new subtypes
                existing_subtypes = set(
                    InvoiceSubtype.objects.filter(
                        invoice_type=invoice_type_obj
                    ).values_list("name", flat=True)
                )
                for subtype in subtypes:
                    if subtype not in existing_subtypes:
                        InvoiceSubtype.objects.get_or_create(
                            name=subtype, invoice_type=invoice_type_obj
                        )

        return JsonResponse(
            {
                "status": "success",
                "message": "Invoice types and subtypes updated successfully.",
            },
            status=200,
        )
    except Exception as e:
        logger.error(f"Error updating invoice types: {e}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def delete_segregations(request):
    if not request.user.is_superuser:
        return JsonResponse(
            {"status": "error", "message": "Only superusers can delete segregations"},
            status=403,
        )

    try:
        ids = request.data.get("ids", [])
        if not ids:
            return JsonResponse(
                {"status": "error", "message": "No annotation IDs provided"},
                status=400,
            )

        annotations = Segregation.objects.filter(id__in=ids)
        if not annotations.exists():
            return JsonResponse(
                {"status": "error", "message": "No matching annotations found"},
                status=404,
            )

        for annotation in annotations:
            if annotation.status == "uploaded" or annotation.status == "in-progress":
                if annotation.s3_file_key:
                    s3.delete_object(
                        Bucket=settings.S3_DOC_BUCKET_SEG, Key=annotation.s3_file_key
                    )
                else:
                    if annotation.s3_file_key and annotation.s3_segregated_key:
                        s3.delete_object(
                            Bucket=settings.S3_DOC_BUCKET_SEG,
                            Key=annotation.s3_file_key,
                        )
                        s3.delete_object(
                            Bucket=settings.S3_SEGREGATED_BUCKET,
                            Key=annotation.s3_segregated_key,
                        )

        annotations.delete()
        return JsonResponse(
            {
                "status": "success",
                "message": "Annotations and related S3 objects deleted successfully",
            },
            status=200,
        )

    except Exception as e:
        logger.error(f"Error deleting annotations: {e}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def skip_segregation(request):
    id = request.data.get("doc_id")

    try:
        annotation = Segregation.objects.get(id=id)
        annotation.status = "skipped"
        annotation.save()
        ist_time = get_current_time_ist()
        annotation.history.append(f"{ist_time}: skipped by {request.user.username}")
        annotation.save()

        return JsonResponse(
            {"status": "success", "message": f"{status} Document skipped successfully"},
            safe=False,
        )

    except Exception as e:
        logger.error(f"Error skipping Document data: {e}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)
