from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path('', include('db_connect.urls')),
    path('', include('custom_auth.urls'))
]