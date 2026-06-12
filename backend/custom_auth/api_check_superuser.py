from django.http import JsonResponse
from django.contrib.auth.models import User

def check_superuser(request):
    exists = User.objects.filter(is_superuser=True).exists()
    return JsonResponse({"superuser_exists": exists})
