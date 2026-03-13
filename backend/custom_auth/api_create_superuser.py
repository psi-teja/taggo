from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.conf import settings
from django.core import signing
import json

@csrf_exempt
def create_superuser(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST allowed"}, status=405)
    if User.objects.filter(is_superuser=True).exists():
        return JsonResponse({"error": "Superuser already exists"}, status=400)
    try:
        data = json.loads(request.body)
        username = data.get("username")
        password = data.get("password")
        email = data.get("email")
        if not username or not password or not email:
            return JsonResponse({"error": "Username, email and password required"}, status=400)
        user = User.objects.create_superuser(username=username, email=email, password=password)
        user.is_active = True
        user.save()
        return JsonResponse({"success": True, "message": "Superuser created successfully! Redirecting..."})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)
