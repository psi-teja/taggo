import os
from PIL import Image
import io
from django.http import HttpResponse, JsonResponse
from django.conf import settings
import json
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated


def ConvertToPdfView(request, filename):
    """
    Converts a file to PDF format.
    Currently supports only images (e.g., jpg, png).
    """
    file_path = os.path.join(settings.MEDIA_ROOT, "documents", filename)

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
    Expects JSON body with 'taskId', 'taskType', and 'jsonData'.
    """
    try:
        data = request.data
        task_type = data.get("taskType")
        task_id = data.get("taskId")
        json_data = data.get("jsonData")

        if not all([task_type, task_id, json_data]):
            return JsonResponse({"status": "error", "message": "Missing required fields"}, status=400)

        file_path = os.path.join(settings.MEDIA_ROOT, task_type, "annotations", f'{task_id}.json')
        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        with open(file_path, "w") as f:
            json.dump(json_data, f)

        return JsonResponse({"status": "success", "message": "Data saved successfully"}, status=200)
    except Exception as e:
        print(f"Error saving JSON data: {e}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)