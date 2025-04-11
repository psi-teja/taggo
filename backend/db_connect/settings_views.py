from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Settings

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_settings(request):
    if not request.user.is_superuser:
        return Response({"message": "You are not authorized to view settings"}, status=status.HTTP_403_FORBIDDEN)

    settings = [{"key": s.key, "value": s.value, "description": s.description} for s in Settings.objects.all()]
    return Response(settings)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_settings(request):
    if not request.user.is_superuser:
        return Response({"message": "You are not authorized to update settings"}, status=status.HTTP_403_FORBIDDEN)

    data = request.data
    Settings.objects.all().delete()
    for item in data:
        key = item.get("key", "")
        value = item.get("value", "")
        description = item.get("description", "")
        Settings.objects.create(key=key, value=value, description=description)
    return Response({"message": "Settings updated"}, status=status.HTTP_200_OK)
