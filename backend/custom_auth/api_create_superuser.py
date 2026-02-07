from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.core.mail import send_mail
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
        # Generate verification token
        token = signing.dumps({"user_id": user.id})
        verify_url = f"{request.scheme}://{request.get_host()}/api/verify-email/?token={token}"
        # Send verification email
        send_mail(
            subject="Verify your superuser account",
            message=f"Click the link to verify your account: {verify_url}",
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@taggo.com'),
            recipient_list=[email],
            fail_silently=False,
        )
        return JsonResponse({"success": True, "message": "Verification email sent. Please check your inbox."})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)
