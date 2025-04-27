from .views import TaskListView, TaskDetailsView, TaskCreateView, TaskUpdateView, TaskDeleteView
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('tasks/', TaskListView, name='task-list'),
    path('tasks/<str:id>/', TaskDetailsView, name='task-detail'),
    path('tasks/create', TaskCreateView, name='task-create'),
    path('tasks/update/<str:id>/', TaskUpdateView, name='task-update'),
    path('tasks/delete/<str:id>/', TaskDeleteView, name='task-delete'),
]