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
from api.models import Task, Project
import re
from .serializers import ProjectSerializer

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
    project_id = request.GET.get("project_id", "")

    # 1. Base Filter: Always filter by project first
    tasks_list = Task.objects.filter(project_id=project_id)

    # 2. Assignee Permissions
    if not request.user.is_superuser:
        tasks_list = tasks_list.filter(assigned_to_user=request.user)
    else:
        if assignee == "unassigned":
            tasks_list = tasks_list.filter(assigned_to_user__isnull=True)
        elif assignee != "all":
            tasks_list = tasks_list.filter(assigned_to_user__username=assignee)

    # 3. Status and Search
    if status != "all":
        tasks_list = tasks_list.filter(status=status)
    if search_id:
        tasks_list = tasks_list.filter(id__icontains=search_id)

    # 4. Efficient Pagination
    paginator = Paginator(tasks_list.select_related('assigned_to_user'), per_page)
    
    try:
        tasks_page = paginator.page(page)
    except (PageNotAnInteger, EmptyPage):
        return JsonResponse({"tasks": [], "total_tasks": paginator.count}, status=200)

    # 5. Manual Serialization (To include Username)
    tasks_data = []
    for t in tasks_page:
        tasks_data.append({
            "id": str(t.id),
            "status": t.status,
            "history": t.history,
            "assigned_to_user": {
                "username": t.assigned_to_user.username 
            } if t.assigned_to_user else None,
        })

    return JsonResponse({
        "tasks": tasks_data, 
        "total_tasks": paginator.count
    }, status=200)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def TaskDetailsView(request, id: str):
    try:
        task = Task.objects.get(id=id)
        task_data = {
            "id": task.id,
            "project_id": task.project.id,
            "filename": task.filename,
            "status": task.status,
            "assigned_to_user": task.assigned_to_user.username if task.assigned_to_user else None,
            "history": task.history,
            # Add other fields as needed
        }
        return JsonResponse(task_data, status=200)
    except Task.DoesNotExist:
        return JsonResponse({"error": "Task not found"}, status=404)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def TaskCreateView(request):
    try:
        project_id = request.POST.get("project_id")
        document = request.FILES.get("document")

        if not document:
            return JsonResponse(
                {"error": "Document is required field"},
                status=400,
            )

        # Define the directory path for the task type
        task_directory = os.path.join(settings.MEDIA_ROOT, "documents")
        os.makedirs(task_directory, exist_ok=True)

        file_extension = os.path.splitext(document.name)[1]
        
        task = Task.objects.create(
            project_id=project_id,
            status="uploaded",
            history=[
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

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def ProjectCreateView(request):
    if not request.user.is_superuser:
        return JsonResponse({"error": "Forbidden"}, status=403)
    try:
        payload = json.loads(request.body or '{}')
        name = payload.get("name", "").strip()
        task_type = payload.get("task_type", "").strip()
        if not name or not task_type:
            return JsonResponse({"error": "Both name and task_type are required"}, status=400)
        if Project.objects.filter(name=name).exists():
            return JsonResponse({"error": "Project with this name already exists"}, status=400)
        project = Project.objects.create(name=name, task_type=task_type)
        return JsonResponse({"id": project.id, "name": project.name, "task_type": project.task_type}, status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def ProjectListView(request):
    projects = Project.objects.values("id", "name", "task_type")
    return JsonResponse(list(projects), safe=False)
        
@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def ProjectDetailsView(request, project_id: str):
    try:
        project = Project.objects.get(id=project_id)
    except Project.DoesNotExist:
        return JsonResponse({"error": "Project not found"}, status=404)

    if request.method == "PATCH":
        # partial=True allows us to update only the 'schema' without needing 'name'
        serializer = ProjectSerializer(project, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            # Return the updated data
            return JsonResponse(serializer.data, status=200)
        
        # If the JSON structure is malformed, DRF returns clear error messages
        return JsonResponse(serializer.errors, status=400)

    # Standard GET logic
    serializer = ProjectSerializer(project)
    return JsonResponse(serializer.data, status=200)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def TaskTypeChoicesView(request):
    return JsonResponse({
        "task_types": [
            {"id": k, "label": v}
            for k, v in Project.TASK_TYPE_CHOICES
        ]
    })
