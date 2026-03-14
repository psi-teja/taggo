import os
from PIL import Image
import io
from django.http import HttpResponse, JsonResponse
from django.conf import settings
import json
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import Task


def ConvertToPdfView(request, project_id, filename):
    """
    Converts a file to PDF format.
    Currently supports only images (e.g., jpg, png).
    """
    file_path = os.path.join(settings.MEDIA_ROOT, project_id, "documents", filename)

    try:
        if not filename.lower().endswith(".pdf"):
            image = Image.open(file_path)
            pdf_bytes = io.BytesIO()
            image.convert('RGB').save(pdf_bytes, format="PDF")
            pdf_bytes.seek(0)
            file_content = pdf_bytes.read()
        else:
            with open(file_path, "rb") as f:
                file_content = f.read()

        response = HttpResponse(file_content, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{os.path.splitext(filename)[0]}.pdf"'
        return response

    except Exception as e:
        print(f"Error converting file to PDF: {e}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@api_view(["POST"])
@permission_classes([IsAuthenticated])   
def save_json_data(request):
    """
    Saves JSON data to a file.
    Expects JSON body with 'taskId' and 'jsonData'.
    """
    try:
        data = request.data
        task_id = data.get("taskId")
        project_id = data.get("projectId")  # Optional, can be used for organizing files by project
        json_data = data.get("jsonData")

        # Removed 'task_type' check since it's not sent by your frontend function
        if not task_id or json_data is None:
            return JsonResponse({
                "status": "error", 
                "message": "Missing taskId or jsonData"
            }, status=400)

        # Ensure the directory exists
        folder_path = os.path.join(settings.MEDIA_ROOT, f"{project_id}", "annotations")
        os.makedirs(folder_path, exist_ok=True)

        # Sanitize filename and create full path
        file_name = f"{task_id}.json"
        file_path = os.path.join(folder_path, file_name)

        # Writing the file
        with open(file_path, "w") as f:
            json.dump(json_data, f, indent=4)

        task = Task.objects.get(id=task_id)
        task.status = 'labelled'
        task.save()

        return JsonResponse({
            "status": "success",
            "message": f"Data saved to {file_name}"
        }, status=200)

    except Exception as e:
        # It's good practice to log the actual error for debugging
        print(f"Error saving JSON data: {str(e)}")
        return JsonResponse({"status": "error", "message": "Internal server error"}, status=500)