from django.http import JsonResponse
from django.contrib.auth.models import User
from django.core import signing
from .models import UserProfile

def verify_email(request):
    token = request.GET.get('token')
    if not token:
        return JsonResponse({'error': 'Missing token'}, status=400)
    try:
        data = signing.loads(token, max_age=60*60*24)  # 1 day expiry
        user_id = data.get('user_id')
        user = User.objects.get(id=user_id)
        user.profile.is_verified = True
        user.profile.save()
        return JsonResponse({'success': True, 'message': 'Email verified. You can now log in.'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
