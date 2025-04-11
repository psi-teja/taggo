from django.contrib import admin
from . import models


# Register your models here.
@admin.register(models.Annotation)
class AnnotationAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "batch",
        "assigned_to_user",
        "history",
        "labelled_by",
        "labelled_at",
        "reviewed_by",
        "reviewed_at",
        "inserted_time",
        "completed_time",
        "status",
        "s3_file_key",
        "s3_pre_label_key",
        "s3_label_key",
    ]
    list_per_page = 10


@admin.register(models.Settings)
class SettingsAdmin(admin.ModelAdmin):
    list_display = ["key", "value", "description"]
    list_per_page = 10


@admin.register(models.Batch)
class BatchAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "description", "created_at", "created_by"]
    list_per_page = 10


@admin.register(models.Segregation)
class SegregationAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "assigned_to_user",
        "history",
        "labelled_by",
        "labelled_at",
        "inserted_time",
        "status",
        "s3_file_key",
        "s3_segregated_key",
        "invoice_type",
        "invoice_subtype",
    ]
    list_per_page = 10


@admin.register(models.InvoiceType)
class InvoiceTypeAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "description",
    ]
    list_per_page = 10


@admin.register(models.InvoiceSubtype)
class InvoiceSubtypeAdmin(admin.ModelAdmin):
    list_display = ["name", "description", "invoice_type"]
    list_per_page = 10
