from django.http import JsonResponse
from django.contrib.auth.models import User
from django.conf import settings
import logging
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
import json
import pytz
import os
from datetime import datetime
import pytesseract
from PIL import Image
from api.models import Task
import re
from django.db.models import Q
from .models import SectionSchema, FieldSchema

# Function to get the current time
def get_current_time_ist():
    ist = pytz.timezone("Asia/Kolkata")
    return datetime.now(ist).strftime(" %H:%M:%S %d-%m-%Y ")
    

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def TaskListView(request):
    assignee = request.GET.get("assignee", "all")
    status = request.GET.get("status", "all")
    per_page = int(request.GET.get("perPage", 10))
    page = int(request.GET.get("page", 1))
    search_id = request.GET.get("searchID", "")
    task_type = request.GET.get("task_type", "")

    if request.user.is_superuser:
        if assignee == "all":
            tasks_list = Task.objects.all()
        elif assignee == "unassigned":
            tasks_list = Task.objects.filter(assigned_to_user=None)
        else:
            tasks_list = Task.objects.filter(
                assigned_to_user__username=assignee
            )
    else:
        tasks_list = Task.objects.filter(assigned_to_user=request.user)

    if status != "all":
        tasks_list = tasks_list.filter(status=status)

    if search_id:
        tasks_list = tasks_list.filter(id__icontains=search_id)

    if task_type:
        tasks_list = tasks_list.filter(task_type=task_type)

    paginator = Paginator(tasks_list, per_page)

    try:
        tasks = paginator.page(page)
    except PageNotAnInteger:
        tasks = paginator.page(1)
    except EmptyPage:
        tasks = paginator.page(paginator.num_pages)

    data = []
    for task in tasks.object_list:
        task_data = {
            "id": task.id,
            "status": task.status,
            "task_type": task.task_type,
            "assigned_to_user": task.assigned_to_user.username
            if task.assigned_to_user
            else None,
            "history": task.history,
        }
        data.append(task_data)

    return JsonResponse(
        {
            "tasks": data,
            "page": tasks.number,
            "pages": paginator.num_pages,
            "total_tasks": paginator.count,
            "is_last_page": not tasks.has_next(),
        },
        safe=False,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def TaskDetailsView(request, id: str):
    try:
        task = Task.objects.get(id=id)
        task_data = {
            "id": task.id,
            "status": task.status,
            "task_type": task.task_type,
            "filename": task.filename,
            "assigned_to_user": task.assigned_to_user.username
            if task.assigned_to_user
            else None,
            "history": task.history,
        }
        return JsonResponse(task_data, status=200)
    except Task.DoesNotExist:
        return JsonResponse({"error": "Task not found"}, status=404)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def TaskCreateView(request):
    try:
        task_type = request.POST.get("task_type")
        document = request.FILES.get("document")

        print("task_type", task_type)
        print("document", document)

        if not task_type or not document:
            return JsonResponse(
                {"error": "task_type and document are required fields"},
                status=400,
            )

        # Define the directory path for the task type
        task_directory = os.path.join(settings.MEDIA_ROOT, task_type, "documents")
        os.makedirs(task_directory, exist_ok=True)

        file_extension = os.path.splitext(document.name)[1]
        
        task = Task.objects.create(
            task_type=task_type,
            history = [
                    {
                        "timestamp": get_current_time_ist(),
                        "action": f"file uploaded by {request.user.username}",
                    }
                ]
        )

        task.filename = f'{task.id}{file_extension}'
    
        # Save the uploaded file to the specified directory
        file_path = os.path.join(task_directory, f'{task.filename}')
        with open(file_path, "wb") as f:
            for chunk in document.chunks():
                f.write(chunk)

        task.save()


        return JsonResponse({"message": "Task created successfully"}, status=200)
    except Exception as e:
        logger.error(f"Error creating task: {e}")
        return JsonResponse({"error": str(e)}, status=500)

@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def TaskUpdateView(request, id: str):
    try:
        task = Task.objects.get(id=id)
        data = json.loads(request.body)

        if "assigned_to_user" in data:
            assigned_to_user = data["assigned_to_user"]
            try:
                user = User.objects.get(username=assigned_to_user)
                task.assigned_to_user = user
            except User.DoesNotExist:
                return JsonResponse(
                    {"error": "Assigned user does not exist"}, status=400
                )

        if "status" in data:
            task.status = data["status"]

        if "history" in data:
            task.history.append(data["history"])

        task.save()

        return JsonResponse({"message": "Task updated successfully"}, status=200)
    except Task.DoesNotExist:
        return JsonResponse({"error": "Task not found"}, status=404)
    except Exception as e:
        logger.error(f"Error updating task: {e}")
        return JsonResponse({"error": str(e)}, status=500)
    
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def TaskDeleteView(request, id: str):
    try:
        task = Task.objects.get(id=id)
        task.delete()
        return JsonResponse({"message": "Task deleted successfully"}, status=200)
    except Task.DoesNotExist:
        return JsonResponse({"error": "Task not found"}, status=404)
    except Exception as e:
        logger.error(f"Error deleting task: {e}")
        return JsonResponse({"error": str(e)}, status=500)
    
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

            text = re.sub(r'\n+', '\n', text)

            # Return the extracted text as JSON response
            return JsonResponse({"text": text})

        return JsonResponse({"error": "POST method and file data required"}, status=400)
    except Exception as e:
        logger.error(f"Error processing OCR: {e}")
        return JsonResponse({"error": str(e)}, status=500)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def schema_options(request):
    """Return a mapping of section name -> list of field names defined by admin.
    Optional query param: task_type to filter specific schemas, while also including global (null) ones.
    """
    task_type = request.GET.get("task_type")
    qs = SectionSchema.objects.all()
    if task_type:
        qs = qs.filter(Q(task_type__isnull=True) | Q(task_type=task_type))
    result = {}
    for sec in qs:
        field_names = list(sec.fields.order_by("name").values_list("name", flat=True))
        result[sec.name] = field_names
    return JsonResponse(result, safe=False)

# Admin-only schema management
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def schema_sections(request):
    # Admin-only for both listing and creating
    if not request.user.is_superuser:
        return JsonResponse({"error": "Forbidden"}, status=403)

    if request.method == "GET":
        task_type = request.GET.get("task_type")
        qs = SectionSchema.objects.all()
        if task_type:
            qs = qs.filter(Q(task_type__isnull=True) | Q(task_type=task_type))
        data = []
        for sec in qs.order_by("name"):
            data.append({
                "id": sec.id,
                "name": sec.name,
                "section_type": sec.section_type,
                "task_type": sec.task_type,
                "fields": list(sec.fields.order_by("name").values("id", "name"))
            })
        return JsonResponse({"sections": data}, status=200)

    # POST: create section
    try:
        payload = json.loads(request.body or '{}')
        name = payload.get("name", "").strip()
        section_type = payload.get("section_type", "general")
        task_type = payload.get("task_type")
        if not name or section_type not in ("general", "table"):
            return JsonResponse({"error": "Invalid name or section_type"}, status=400)
        sec = SectionSchema.objects.create(name=name, section_type=section_type, task_type=task_type)
        return JsonResponse({"id": sec.id, "name": sec.name, "section_type": sec.section_type, "task_type": sec.task_type}, status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def schema_section_delete(request, pk: int):
    if not request.user.is_superuser:
        return JsonResponse({"error": "Forbidden"}, status=403)
    try:
        SectionSchema.objects.get(pk=pk).delete()
        return JsonResponse({"message": "Deleted"}, status=200)
    except SectionSchema.DoesNotExist:
        return JsonResponse({"error": "Not found"}, status=404)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def schema_section_add_field(request, pk: int):
    if not request.user.is_superuser:
        return JsonResponse({"error": "Forbidden"}, status=403)
    try:
        sec = SectionSchema.objects.get(pk=pk)
        payload = json.loads(request.body or '{}')
        name = payload.get("name", "").strip()
        if not name:
            return JsonResponse({"error": "Field name required"}, status=400)
        field = FieldSchema.objects.create(section=sec, name=name)
        return JsonResponse({"id": field.id, "name": field.name}, status=201)
    except SectionSchema.DoesNotExist:
        return JsonResponse({"error": "Section not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def schema_field_delete(request, pk: int):
    if not request.user.is_superuser:
        return JsonResponse({"error": "Forbidden"}, status=403)
    try:
        FieldSchema.objects.get(pk=pk).delete()
        return JsonResponse({"message": "Deleted"}, status=200)
    except FieldSchema.DoesNotExist:
        return JsonResponse({"error": "Not found"}, status=404)