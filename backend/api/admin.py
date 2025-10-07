from django.contrib import admin
from .models import SectionSchema, FieldSchema

class FieldSchemaInline(admin.TabularInline):
    model = FieldSchema
    extra = 1

@admin.register(SectionSchema)
class SectionSchemaAdmin(admin.ModelAdmin):
    list_display = ("name", "section_type", "task_type")
    list_filter = ("section_type", "task_type")
    search_fields = ("name",)
    inlines = [FieldSchemaInline]
