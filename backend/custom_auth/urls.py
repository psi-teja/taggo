from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import MyTokenObtainPairView, change_password, UserDataView

urlpatterns = [
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),  # 🔥 Corrected this
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('change_password/', change_password, name='change_password'),
    path('user/', UserDataView.as_view(), name='user_data'),
]
