from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User  # Assuming you are using the default User model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import serializers
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import check_password
from rest_framework.decorators import api_view
from rest_framework_simplejwt.tokens import OutstandingToken, BlacklistedToken

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    try:
        user = request.user
        data = request.data
        old_password = data.get("old_password")
        new_password = data.get("new_password")

        if old_password is None or new_password is None:
            return Response({"error": "Old password and new password are required"}, status=status.HTTP_400_BAD_REQUEST)

        if not check_password(old_password, user.password):
            return Response({"error": "Old password is incorrect"}, status=status.HTTP_400_BAD_REQUEST)

        # Update the password
        user.set_password(new_password)
        user.save()

        return Response({"message": "Password changed successfully. You have been logged out of all devices. Please log in again."}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# Serializer for User Data
class UserSerializer(serializers.ModelSerializer):
    groups = serializers.StringRelatedField(many=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'date_joined', 'groups']


@permission_classes([IsAuthenticated])
class UserDataView(APIView):
    def get(self, request):
        user_data = UserSerializer(request.user).data
        user_data = {
            "username": request.user.username,
            "email": request.user.email,
            "first_name": request.user.first_name,
            "last_name": request.user.last_name,
            "date_joined": request.user.date_joined,
            "is_superuser": request.user.is_superuser,
        }
        user_groups = request.user.groups.values_list('name', flat=True)
        user_data["groups"] = list(user_groups)
        return Response(user_data, status=status.HTTP_200_OK)
    

