from django.http import JsonResponse, HttpResponse
from django.contrib.auth.models import User
from django.conf import settings
import logging
import zipfile
import io
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import parser_classes
import json
import pytz
import os
from datetime import datetime
import pytesseract
from PIL import Image
from api.models import Task, Project
import re
from .serializers import ProjectSerializer
from django.db.models import Q

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
            "type": task.project.task_type,
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
        task_directory = os.path.join(settings.MEDIA_ROOT, project_id, "documents")
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
        # In DRF, uploaded files are in request.FILES
        uploaded_file = request.FILES.get("file") 
        
        if uploaded_file:
            image = Image.open(uploaded_file)
            text = pytesseract.image_to_string(image)
            text = text.strip()
            return JsonResponse({"text": text})
        return JsonResponse({"error": "File data required"}, status=400)
    except Exception as e:
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
        serializer = ProjectSerializer(project, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Save schema to file if 'schema' is updated
            schema = serializer.validated_data.get("schema")
            if schema is not None:
                folder_path = os.path.join(settings.MEDIA_ROOT, f"{project_id}")
                os.makedirs(folder_path, exist_ok=True)
                schema_path = os.path.join(folder_path, "schema.json")
                with open(schema_path, "w") as f:
                    json.dump(schema, f, indent=2)
            return JsonResponse(serializer.data, status=200)
        return JsonResponse(serializer.errors, status=400)

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

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_next_task(request, project_id: str):
    try:
        # Find the first available (unassigned and not "completed") task in the project
        next_task = Task.objects.filter(
            status = "uploaded",  # Only consider tasks that are uploaded
            project_id=project_id,
            assigned_to_user__isnull=True,
        ).order_by('id').first()

        if next_task:
            return JsonResponse({"next_task_id": next_task.id})
        else:
            return JsonResponse({"next_task_id": None}, status=404)
            
    except Exception as e:
        logger.error(f"Error fetching next task: {e}")
        return JsonResponse({"error": str(e)}, status=500)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def ExportProjectView(request, project_id: str):
    """
    Export documents and annotations for a project as a ZIP file.
    Optionally filter by status using ?status=labelled (default exports all).
    Annotations are transformed so that field/column UUIDs are replaced with
    human-readable names from the project schema.
    """
    try:
        project = Project.objects.get(id=project_id)
    except Project.DoesNotExist:
        return JsonResponse({"error": "Project not found"}, status=404)

    status_filter = request.GET.get("status", "all")
    project_dir = os.path.join(settings.MEDIA_ROOT, str(project_id))
    documents_dir = os.path.join(project_dir, "documents")
    annotations_dir = os.path.join(project_dir, "annotations")

    # Get tasks for the project, optionally filtered by status
    tasks = Task.objects.filter(project_id=project_id)
    if status_filter != "all":
        tasks = tasks.filter(status=status_filter)

    task_ids = set(str(t.id) for t in tasks)

    # Build a UUID → human-readable-name lookup from the schema
    schema = project.schema or {}
    id_to_name = _build_id_to_name_map(schema)

    # Build a table-id → tableName lookup for renaming table keys
    table_id_to_name = {}
    for table in schema.get("tables", []):
        if table.get("id") and table.get("tableName"):
            table_id_to_name[table["id"]] = table["tableName"]

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        # Add schema.json if it exists on disk
        schema_path = os.path.join(project_dir, "schema.json")
        if os.path.exists(schema_path):
            zf.write(schema_path, "schema.json")

        # Add matching documents
        if os.path.isdir(documents_dir):
            for fname in os.listdir(documents_dir):
                file_stem = os.path.splitext(fname)[0]
                if file_stem in task_ids:
                    zf.write(os.path.join(documents_dir, fname), f"documents/{fname}")

        # Add matching annotations (with IDs replaced by names)
        if os.path.isdir(annotations_dir):
            for fname in os.listdir(annotations_dir):
                file_stem = os.path.splitext(fname)[0]
                if file_stem in task_ids:
                    file_path = os.path.join(annotations_dir, fname)
                    try:
                        with open(file_path, "r") as f:
                            annotation = json.load(f)
                        transformed = _transform_annotation(
                            annotation, project.task_type, id_to_name
                        )
                        zf.writestr(
                            f"annotations/{fname}",
                            json.dumps(transformed, indent=2, ensure_ascii=False),
                        )
                    except (json.JSONDecodeError, Exception):
                        # If transformation fails, include the original file as-is
                        zf.write(file_path, f"annotations/{fname}")

    buffer.seek(0)

    response = HttpResponse(buffer.read(), content_type="application/zip")
    response["Content-Disposition"] = f'attachment; filename="{project.name}_export.zip"'
    return response


def _build_id_to_name_map(schema: dict) -> dict:
    """
    Walk through any schema shape and build a flat {uuid: name} mapping.
    Handles:
      - document-parsing:      schema.fields[].{id,name}  +  schema.tables[].columns[].{id,name}
      - object-detection:      schema.labels[].{id,name}
      - document-classification: schema.classes[].{id,name}
    """
    id_map = {}

    # fields (document-parsing)
    for field in schema.get("fields", []):
        if field.get("id") and field.get("name"):
            id_map[field["id"]] = field["name"]

    # tables → columns (document-parsing)
    for table in schema.get("tables", []):
        if table.get("id") and table.get("tableName"):
            id_map[table["id"]] = table["tableName"]
        for col in table.get("columns", []):
            if col.get("id") and col.get("name"):
                id_map[col["id"]] = col["name"]

    # labels (object-detection / image-segmentation)
    for label in schema.get("labels", []):
        if label.get("id") and label.get("name"):
            id_map[label["id"]] = label["name"]

    # classes (document-classification)
    for cls in schema.get("classes", []):
        if cls.get("id") and cls.get("name"):
            id_map[cls["id"]] = cls["name"]

    return id_map


def _transform_annotation(annotation, task_type: str, id_to_name: dict):
    """
    Replace field/column UUIDs with human-readable names in the annotation.
    Each task_type has a different annotation structure.
    """

    if task_type == "document-parsing":
        return _transform_document_parsing(annotation, id_to_name)
    elif task_type == "object-detection" or task_type == "image-segmentation":
        return _transform_object_detection(annotation, id_to_name)
    elif task_type == "document-classification":
        return _transform_document_classification(annotation, id_to_name)
    else:
        return annotation


def _transform_document_parsing(annotation: dict, id_to_name: dict) -> dict:
    """
    document-parsing annotations have:
      - "Singular": list of fields with "Name" = UUID
      - "<tableName>": { "columns": [...], "rows": [...] }
    Replace the "Name" UUID with the human-readable name.
    """
    if not isinstance(annotation, dict):
        return annotation

    result = {}

    for key, value in annotation.items():
        if key == "Singular":
            # Replace Name UUIDs in singular fields
            transformed_fields = []
            for field in value:
                field_copy = dict(field)
                field_uuid = field_copy.get("Name", "")
                field_copy["Name"] = id_to_name.get(field_uuid, field_uuid)
                transformed_fields.append(field_copy)
            result["Singular"] = transformed_fields

        elif key == "Meta":
            # Pass through metadata as-is
            result["Meta"] = value

        elif isinstance(value, dict) and "columns" in value:
            # This is a table section — replace Name UUIDs in columns
            table_data = dict(value)
            transformed_cols = []
            for col in table_data.get("columns", []):
                col_copy = dict(col)
                col_uuid = col_copy.get("Name", "")
                col_copy["Name"] = id_to_name.get(col_uuid, col_uuid)
                transformed_cols.append(col_copy)
            table_data["columns"] = transformed_cols
            result[key] = table_data

        else:
            result[key] = value

    return result


def _transform_object_detection(annotation, id_to_name: dict):
    """
    object-detection annotations are a list of objects with "label" as a string.
    Labels are already human-readable, but if they happen to be UUIDs, replace them.
    """
    if not isinstance(annotation, list):
        return annotation

    result = []
    for obj in annotation:
        obj_copy = dict(obj)
        label = obj_copy.get("label", "")
        obj_copy["label"] = id_to_name.get(label, label)
        result.append(obj_copy)
    return result


def _transform_document_classification(annotation: dict, id_to_name: dict) -> dict:
    """
    document-classification annotations have { "classification": "<class_name_or_id>" }.
    Replace the value if it's a UUID.
    """
    if not isinstance(annotation, dict):
        return annotation

    result = dict(annotation)
    cls_value = result.get("classification", "")
    result["classification"] = id_to_name.get(cls_value, cls_value)
    return result
