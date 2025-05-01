import os
from PIL import Image
import io
from django.http import HttpResponse, JsonResponse
from django.conf import settings

def ConvertToPdfView(request, task_type, filename):
    """
    Converts a file to PDF format.
    Currently supports only images (e.g., jpg, png).
    """
    file_path = os.path.join(settings.MEDIA_ROOT, task_type, "documents", filename)

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
    