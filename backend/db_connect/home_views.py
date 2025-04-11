from .models import Annotation, Batch
from django.http import JsonResponse
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
import PyPDF2, pytz

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Upload file to S3
s3 = boto3.client("s3")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_annotations(
    request,
    assignee: str,
    status: str,
    perPage: int,
    page: int,
    searchID: str,
    batch: str,
):

    if request.user.is_superuser:
        if assignee == "all":
            annotations_list = Annotation.objects.all()
        elif assignee == "unassigned":
            annotations_list = Annotation.objects.filter(assigned_to_user=None)
        else:
            annotations_list = Annotation.objects.filter(
                assigned_to_user__username=assignee
            )
    else:
        annotations_list = Annotation.objects.filter(assigned_to_user=request.user)

    if status != "all":
        annotations_list = annotations_list.filter(status=status)

    if batch != "all":
        annotations_list = annotations_list.filter(batch__name=batch)

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

        if annotation.batch_id:
            try:
                batch = Batch.objects.get(id=annotation.batch_id)
                annotation_data["batch_name"] = batch.name
            except Batch.DoesNotExist:
                annotation_data["batch_name"] = None
        else:
            annotation_data["batch_name"] = None

        del annotation_data["_state"]  # Remove the internal state field
        data.append(annotation_data)

    return JsonResponse(
        {
            "annotations": data,
            "page": annotations.number,
            "pages": paginator.num_pages,
            "total_annotations": paginator.count,
            "is_last_page": not annotations.has_next(),
        },
        safe=False,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_document(request):
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
        batch_id = request.POST.get("batch_id")
        file_extension = uploaded_file.name.split(".")[-1].lower()

        try:
            with transaction.atomic():
                # Determine uploader
                uploader = (
                    request.user.username
                    if request.user.is_authenticated
                    else "Anonymous"
                )

                if file_extension.lower() == "pdf":

                    # Use UUID as the document ID
                    doc_id = str(uuid.uuid4())

                    # Create a new annotation record for each page in the PDF
                    pdf_reader = PyPDF2.PdfReader(uploaded_file)
                    num_pages = len(pdf_reader.pages)
                    for page in range(num_pages):
                        annotation = Annotation(
                            id=f"{doc_id}_{page+1}", status="uploaded"
                        )
                        ist_time = get_current_time_ist()
                        annotation.history = [f"{ist_time}: uploaded by {uploader}"]
                        annotation.save()

                        # Use UUID as the file key
                        s3_file_key = f"{annotation.id}.{file_extension}"

                        # Upload only the current page of the PDF
                        pdf_writer = PyPDF2.PdfWriter()

                        pdf_writer.add_page(pdf_reader.pages[page])

                        # Create a temporary in-memory file to hold the single page PDF
                        temp_pdf = io.BytesIO()
                        pdf_writer.write(temp_pdf)
                        temp_pdf.seek(0)

                        s3.upload_fileobj(temp_pdf, settings.S3_DOC_BUCKET, s3_file_key)

                        # Update annotation record
                        annotation.s3_file_key = s3_file_key
                        annotation.batch = Batch.objects.get(id=int(batch_id))
                        annotation.save()

                        # send message to SQS
                        sqs = boto3.client("sqs", region_name="ap-south-1")
                        # sqs = session.client("sqs")
                        sqs.send_message(
                            QueueUrl=settings.SQS_PRE_LABEL_QUEUE_URL,
                            MessageBody=json.dumps(
                                {
                                    "id": str(annotation.id),
                                    "s3_doc_bucket": settings.S3_DOC_BUCKET,
                                    "s3_file_key": s3_file_key,
                                    "s3_pre_label_bucket": settings.S3_PRE_LABEL_BUCKET,
                                    "s3_labelling_bucket": settings.S3_LABELLING_BUCKET,
                                    "database": settings.DATABASES["default"],
                                }
                            ),
                        )
                else:
                    # Create a new annotation record
                    annotation = Annotation(id=str(uuid.uuid4()), status="uploaded")
                    ist_time = get_current_time_ist()
                    annotation.history = [f"{ist_time}: uploaded by {uploader}"]
                    annotation.save()

                    # Use UUID as the file key
                    s3_file_key = f"{annotation.id}.{file_extension}"

                    s3.upload_fileobj(
                        uploaded_file, settings.S3_DOC_BUCKET, s3_file_key
                    )

                    # Update annotation record
                    annotation.s3_file_key = s3_file_key
                    annotation.batch = Batch.objects.get(id=int(batch_id))
                    annotation.save()

                    # send message to SQS
                    sqs = boto3.client("sqs", region_name="ap-south-1")
                    sqs.send_message(
                        QueueUrl=settings.SQS_PRE_LABEL_QUEUE_URL,
                        MessageBody=json.dumps(
                            {
                                "id": str(annotation.id),
                                "s3_doc_bucket": settings.S3_DOC_BUCKET,
                                "s3_file_key": s3_file_key,
                                "s3_pre_label_bucket": settings.S3_PRE_LABEL_BUCKET,
                                "s3_labelling_bucket": settings.S3_LABELLING_BUCKET,
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


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def assign_annotation(request):
    if request.method == "POST":
        try:
            annotation_id = request.data["id"]
            username = request.data["username"]
            assigned_by = request.user
            annotation = Annotation.objects.get(id=annotation_id)
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
def smart_assign(request):
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

        annotations = Annotation.objects.filter(status=status, assigned_to_user=None)

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
                annotation.status = "in-labelling"
                ist_time = get_current_time_ist()
                annotation.history.append(
                    f"{ist_time}: assigned to {username} by {request.user.username} (smart assign)"
                )
                modified_annotations.append(annotation)

            annotations_assigned += count

        # Perform bulk update if there are modified annotations
        if modified_annotations:
            Annotation.objects.bulk_update(
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
def get_smart_assign_data(request):
    all_groups = Group.objects.all().values("name", "user__username")
    groups_with_users = {}
    for group in all_groups:
        group_name = group["name"]
        user_name = group["user__username"]
        if group_name not in groups_with_users:
            groups_with_users[group_name] = []
        groups_with_users[group_name].append(user_name)

    annotation_status_counts = (
        Annotation.objects.values("status")
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
def get_annotations_count(request):
    try:
        total_count = Annotation.objects.count()
        inprogress_counts = (
            Annotation.objects.filter(
                status__in=[
                    "uploaded",
                    "pre-labelled",
                    "in-labelling",
                    "in-review",
                    "accepted",
                ]
            )
            .values("status")
            .annotate(count=Count("status"))
        )
        completed_count = Annotation.objects.filter(status="completed").count()

        # Initialize inprogress with all possible statuses
        inprogress = {
            status: 0
            for status in [
                "uploaded",
                "pre-labelled",
                "in-labelling",
                "in-review",
                "accepted",
            ]
        }
        for status in inprogress_counts:
            inprogress[status["status"]] = status["count"]

        return JsonResponse(
            {
                "total": total_count,
                "inprogress": inprogress,
                "completed": completed_count,
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
def get_groups_with_users(request):
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
@permission_classes([IsAuthenticated])
def dashboard_view(request):

    username = request.GET.get("username")

    # If a username is provided, fetch the user by the username
    if username:
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found."}, status=404)
    else:
        # Use the logged-in user if no username is provided
        user = request.user

    start_date = request.GET.get("start_date")
    end_date = request.GET.get("end_date")

    print(f"Start date: {start_date}, End date: {end_date}")
    print(f"Start date: {type(start_date)}, End date: {type(end_date)}")

    # Filter labelled files for the user (those labelled by the user)
    labelled_files = Annotation.objects.filter(
        labelled_by=user, labelled_at__gte=start_date, labelled_at__lte=end_date
    ).order_by("-labelled_at")

    print({"labelled_files": list(labelled_files.values())})

    # Filter reviewed files for the user (those reviewed by the user)
    reviewed_files = Annotation.objects.filter(
        reviewed_by=user, reviewed_at__gte=start_date, reviewed_at__lte=end_date
    ).order_by("-reviewed_at")
    print({"reviewed_files": list(reviewed_files.values())})

    # Pagination for labelled files
    labelled_paginator = Paginator(labelled_files, request.GET.get("perPage", 10))
    page_labelled = request.GET.get("page_labelled", 1)
    labelled_page = labelled_paginator.get_page(page_labelled)

    # Pagination for reviewed files
    reviewed_paginator = Paginator(reviewed_files, request.GET.get("perPage", 10))
    page_reviewed = request.GET.get("page_reviewed", 1)
    reviewed_page = reviewed_paginator.get_page(page_reviewed)

    def format_datetime(dt):
        if dt:
            return dt.astimezone(pytz.timezone("Asia/Kolkata")).strftime("%Y-%m-%d %H:%M:%S")
        return None

    labelled_data = []
    for annotation in labelled_page:

        labelled_data.append(
            {
                "ID": str(annotation.id),
                "Reviewed By": (
                    annotation.reviewed_by.username if annotation.reviewed_by else None
                ),
                "Assignee": (
                    annotation.assigned_to_user.username
                    if annotation.assigned_to_user
                    else None
                ),
                "Status": annotation.status,
                "Labelled At": format_datetime(annotation.labelled_at),
                "History": annotation.history,
            }
        )

    reviewed_data = []
    for annotation in reviewed_page:
        reviewed_data.append(
            {
                "ID": str(annotation.id),
                "Labelled By": (
                    annotation.labelled_by.username if annotation.labelled_by else None
                ),
                "Assignee": (
                    annotation.assigned_to_user.username
                    if annotation.assigned_to_user
                    else None
                ),
                "Status": annotation.status,
                "Labelled At": format_datetime(annotation.reviewed_at),
                "History": annotation.history,
            }
        )

    return JsonResponse(
        {
            "labelled_files": labelled_data,
            "reviewed_files": reviewed_data,
            "page_labelled": labelled_page.number,
            "pages_labelled": labelled_paginator.num_pages,
            "total_labelled": labelled_paginator.count,
            "is_last_page_labelled": not labelled_page.has_next(),
            "page_reviewed": reviewed_page.number,
            "pages_reviewed": reviewed_paginator.num_pages,
            "total_reviewed": reviewed_paginator.count,
            "is_last_page_reviewed": not reviewed_page.has_next(),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def pre_label(request):
    if not request.user.is_superuser:
        return JsonResponse(
            {"status": "error", "message": "Only superusers can pre-label documents"},
            status=403,
        )

    annotations = Annotation.objects.filter(status="uploaded")
    sqs = boto3.client("sqs", region_name="ap-south-1")

    for annotation in annotations:
        s3_file_key = annotation.s3_file_key
        message_body = json.dumps(
            {
                "id": str(annotation.id),
                "s3_doc_bucket": settings.S3_DOC_BUCKET,
                "s3_file_key": s3_file_key,
                "s3_pre_label_bucket": settings.S3_PRE_LABEL_BUCKET,
                "s3_labelling_bucket": settings.S3_LABELLING_BUCKET,
                "database": settings.DATABASES["default"],
            }
        )

        sqs.send_message(
            QueueUrl=settings.SQS_PRE_LABEL_QUEUE_URL,
            MessageBody=message_body,
        )

    return JsonResponse({"status": "success", "message": "Pre-labeling successful."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_batches(request):
    batches = Batch.objects.all().values("id", "name", "description")
    return JsonResponse(list(batches), safe=False)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_batch(request):
    try:
        if request.method == "POST":
            batch_name = request.data.get("name")
            batch_description = request.data.get("description")
            if not batch_name:
                return JsonResponse(
                    {"status": "error", "message": "Batch name is required."},
                    status=400,
                )
            if Batch.objects.filter(name=batch_name).exists():
                return JsonResponse(
                    {"status": "error", "message": "Batch name already exists."},
                    status=400,
                )
            batch = Batch(name=batch_name, description=batch_description)
            batch.save()
            return JsonResponse(
                {"status": "success", "message": "Batch created successfully."}
            )

        return JsonResponse(
            {"status": "error", "message": "Invalid request method"}, status=400
        )
    except Exception as e:
        logger.error(f"Error creating batch: {e}")
        return JsonResponse(
            {"status": "error", "message": "An unexpected error occurred."}, status=500
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def delete_annotations(request):
    if not request.user.is_superuser:
        return JsonResponse(
            {"status": "error", "message": "Only superusers can delete annotations"},
            status=403,
        )

    try:
        ids = request.data.get("ids", [])
        if not ids:
            return JsonResponse(
                {"status": "error", "message": "No annotation IDs provided"},
                status=400,
            )

        annotations = Annotation.objects.filter(id__in=ids)
        if not annotations.exists():
            return JsonResponse(
                {"status": "error", "message": "No matching annotations found"},
                status=404,
            )

        for annotation in annotations:
            if annotation.s3_file_key:
                s3.delete_object(
                    Bucket=settings.S3_DOC_BUCKET, Key=annotation.s3_file_key
                )
                s3.delete_object(
                    Bucket=settings.S3_PRE_LABEL_BUCKET, Key=annotation.s3_file_key
                )
                s3.delete_object(
                    Bucket=settings.S3_LABELLING_BUCKET, Key=annotation.s3_file_key
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
