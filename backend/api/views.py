from django.http import JsonResponse
from django.contrib.auth.models import User
from django.conf import settings
import logging
from django.db import transaction
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
import json
from django.contrib.auth.models import Group
from rest_framework import status
from django.db.models import Count, Q
import uuid
import pytz
import os
from datetime import datetime

from api.models import Task

# Function to get the current time in IST
def get_current_time_ist():
    ist = pytz.timezone("Asia/Kolkata")
    return datetime.now(ist).strftime("%Y-%m-%d %H:%M:%S")

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
            "task_type": task.task_type.task_type if task.task_type else None,
            "assigned_to_user": task.assigned_to_user.username
            if task.assigned_to_user
            else None,
            "history": task.history,
            "document": task.document.url if task.document else None,
            "json": task.json if task.json else None,
        }
        return JsonResponse(task_data, status=200)
    except Task.DoesNotExist:
        return JsonResponse({"error": "Task not found"}, status=404)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def TaskCreateView(request):
    try:
        data = json.loads(request.body)
        task_type = data.get("task_type")
        document = request.FILES.get("document")

        if not task_type or not document:
            return JsonResponse(
                {"error": "task_type, document, and json are required fields"},
                status=400,
            )

        task_type_instance, _ = Task.objects.get_or_create(
            task_type=task_type
        )

        # Define the directory path for the task type
        task_directory = os.path.join(settings.MEDIA_ROOT, task_type, "documents")
        os.makedirs(task_directory, exist_ok=True)

        # Save the uploaded file to the specified directory
        file_path = os.path.join(task_directory, document.name)
        with open(file_path, "wb") as f:
            for chunk in document.chunks():
                f.write(chunk)

        task = Task(
            task_id=str(uuid.uuid4()),
            task_type=task_type_instance,
            filename=document.name,
        )
        task.save()

        return JsonResponse({"message": "Task created successfully"}, status=201)
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
    
