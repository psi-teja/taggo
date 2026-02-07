from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import MyTokenObtainPairView, change_password, UserDataView
from .api_check_superuser import check_superuser
from .api_create_superuser import create_superuser
from .api_verify_email import verify_email

urlpatterns = [
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),  # 🔥 Corrected this
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('change_password/', change_password, name='change_password'),
    path('user/', UserDataView.as_view(), name='user_data'),
    path('check-superuser/', check_superuser, name='check_superuser'),
    path('create-superuser/', create_superuser, name='create_superuser'),
    path('verify-email/', verify_email, name='verify_email'),
    ]