from .views import TaskListView, TaskDetailsView, TaskCreateView, TaskUpdateView, TaskDeleteView
from django.urls import path

urlpatterns = [
    path('tasks/', TaskListView, name='task-list'),
    path('tasks/<str:pk>/', TaskDetailsView, name='task-detail'),
    path('tasks/create', TaskCreateView, name='task-create'),
    path('tasks/update/<str:pk>/', TaskUpdateView, name='task-update'),
    path('tasks/delete/<str:pk>/', TaskDeleteView, name='task-delete'),
]