from .views import TaskListView, TaskDetailsView, TaskCreateView, TaskUpdateView, TaskDeleteView, get_ocr_text, schema_options, schema_sections, schema_section_delete, schema_section_add_field, schema_field_delete
from .utils import ConvertToPdfView, save_json_data
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path('tasks/', TaskListView, name='task-list'),
    path('tasks/<str:id>/', TaskDetailsView, name='task-detail'),
    path('tasks/create', TaskCreateView, name='task-create'),
    path('tasks/update/<str:id>/', TaskUpdateView, name='task-update'),
    path('tasks/delete/<str:id>/', TaskDeleteView, name='task-delete'),
    path('convert_to_pdf/<str:task_type>/<str:filename>/', ConvertToPdfView, name='convert-to-pdf'),
    path('save_json_data/', save_json_data, name='save-json-data'),
    path("get_ocr_text/", get_ocr_text, name="get ocr text"),
    # Schema (read for UI)
    path('schema/options', schema_options, name='schema-options'),
    # Admin schema management
    path('schema/sections', schema_sections, name='schema-sections'),           # GET list, POST create
    path('schema/sections/<int:pk>', schema_section_delete, name='schema-section-delete'),
    path('schema/sections/<int:pk>/fields', schema_section_add_field, name='schema-section-add-field'),
    path('schema/fields/<int:pk>', schema_field_delete, name='schema-field-delete'),
]