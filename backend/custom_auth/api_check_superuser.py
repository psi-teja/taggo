from django.http import JsonResponse
from django.contrib.auth.models import User
from django.views.decorators.http import require_GET

def check_superuser(request):
    exists = User.objects.filter(is_superuser=True).exists()
    return JsonResponse({"superuser_exists": exists})
