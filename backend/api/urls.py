from .views import TaskListView, TaskDetailsView, TaskCreateView, TaskUpdateView, TaskDeleteView, get_ocr_text
from .views import ProjectListView, ProjectCreateView, ProjectDetailsView, TaskTypeChoicesView
from .utils import ConvertToPdfView, save_json_data
from django.urls import path

urlpatterns = [
    path('tasks/', TaskListView, name='task-list'),
    path('tasks/<str:id>/', TaskDetailsView, name='task-detail'),
    path('tasks/create', TaskCreateView, name='task-create'),
    path('tasks/update/<str:id>/', TaskUpdateView, name='task-update'),
    path('tasks/delete/<str:id>/', TaskDeleteView, name='task-delete'),
    path('convert_to_pdf/<str:project_id>/<str:filename>/', ConvertToPdfView, name='convert-to-pdf'),
    path('save_json_data/', save_json_data, name='save-json-data'),
    path("get_ocr_text/", get_ocr_text, name="get ocr text"),
    path('projects/', ProjectListView, name='project-list'),  # Alias for tasks, can be extended later
    path('projects/create/', ProjectCreateView, name='project-create'),  # Placeholder for future project creation endpoint
    path('projects/<str:project_id>/', ProjectDetailsView, name='project-detail'),  # Alias for tasks, can be extended later
    path('task-types/', TaskTypeChoicesView, name='task-type-choices'),
]