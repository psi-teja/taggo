from django.db import models
import uuid
from django.contrib.auth.models import User
from django.utils import timezone
import pytz
from django.core.validators import MinValueValidator, MaxValueValidator


# Create your models here.
class Annotation(models.Model):
    id = models.CharField(
        primary_key=True, max_length=100, default=uuid.uuid4, editable=False
    )
    batch = models.ForeignKey("Batch", on_delete=models.SET_NULL, null=True)
    assigned_to_user = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL
    )
    history = models.JSONField(default=list)
    labelled_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="labelled_by",
    )
    labelled_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="reviewed_by",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    STATUS_CHOICES = [
        ("uploaded", "Uploaded"),
        ("pre-labelled", "Pre-labelled"),
        ("in-labelling", "In-Labelling"),
        ("in-review", "In-Review"),
        ("accepted", "Accepted"),
        ("completed", "Completed"),
    ]
    inserted_time = models.DateTimeField(auto_now_add=True)
    completed_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="uploaded")
    s3_file_key = models.CharField(max_length=255)
    s3_pre_label_key = models.CharField(max_length=255, null=True, blank=True)
    s3_label_key = models.CharField(max_length=255, null=True, blank=True)

    def save(self, *args, **kwargs):
        ist = pytz.timezone("Asia/Kolkata")
        if self.labelled_by and not self.labelled_at:
            self.labelled_at = timezone.now().astimezone(ist)
        if self.reviewed_by and not self.reviewed_at:
            self.reviewed_at = timezone.now().astimezone(ist)
        if self.status == "completed" and not self.completed_time:
            self.completed_time = timezone.now().astimezone(ist)
        super().save(*args, **kwargs)

    class Meta:
        db_table = "annotations"
        verbose_name = "Annotation"
        verbose_name_plural = "Annotations"
        ordering = ["-inserted_time"]

    def __str__(self):
        return f"Annotation {self.id} - {self.status}"


class Settings(models.Model):
    key = models.CharField(primary_key=True, max_length=255, unique=True)
    value = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    description = models.TextField(blank=True, null=True)  # New field for descriptions

    class Meta:
        db_table = "settings"
        verbose_name = "Setting"
        verbose_name_plural = "Settings"
        ordering = ["key"]

    def __str__(self):
        return f"{self.key}: {self.value}"


class Batch(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="batches_created",
    )

    class Meta:
        db_table = "batches"
        verbose_name = "Batch"
        verbose_name_plural = "Batches"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class Segregation(models.Model):
    id = models.CharField(
        primary_key=True, max_length=100, default=uuid.uuid4, editable=False
    )
    assigned_to_user = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL
    )
    inserted_time = models.DateTimeField(auto_now_add=True)
    history = models.JSONField(default=list)
    labelled_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="seg_labelled_by",
    )
    labelled_at = models.DateTimeField(null=True, blank=True)
    STATUS_CHOICES = [
        ("uploaded", "Uploaded"),
        ("in-progress", "In-progress"),
        ("segregated", "Segregated"),
        ("skipped", "Skipped"),
    ]
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="uploaded")
    invoice_type = models.CharField(max_length=255, null=True, blank=True)
    invoice_subtype = models.CharField(max_length=255, null=True, blank=True)

    s3_file_key = models.CharField(max_length=255)
    s3_segregated_key = models.CharField(max_length=255, null=True, blank=True)

    def save(self, *args, **kwargs):
        ist = pytz.timezone("Asia/Kolkata")
        if self.labelled_by and not self.labelled_at:
            self.labelled_at = timezone.now().astimezone(ist)
        super().save(*args, **kwargs)

    class Meta:
        db_table = "segregations"
        verbose_name = "Segregation"
        verbose_name_plural = "Segregations"
        ordering = ["-inserted_time"]

    def __str__(self):
        return f"Segregation {self.id} - {self.status}"


class InvoiceType(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "invoice_types"
        verbose_name = "Invoice Type"
        verbose_name_plural = "Invoice Types"
        ordering = ["name"]

    def __str__(self):
        return self.name


class InvoiceSubtype(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    invoice_type = models.ForeignKey(
        InvoiceType, related_name="subtypes", on_delete=models.CASCADE
    )

    class Meta:
        db_table = "invoice_subtypes"
        verbose_name = "Invoice Subtype"
        verbose_name_plural = "Invoice Subtypes"
        ordering = ["name"]
        unique_together = (
            "name",
            "invoice_type",
        )  # Ensure subtype names are unique within a type

    def __str__(self):
        return f"{self.invoice_type.name} - {self.name}"
