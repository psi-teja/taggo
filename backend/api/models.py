from django.db import models
from django.contrib.auth.models import User
import uuid
from django.utils import timezone
import pytz

class Task(models.Model):
    id = models.CharField(
        primary_key=True, max_length=100, editable=False, default=uuid.uuid4
    )
    TASK_TYPE_CHOICES = [
        ("invoice-annotation", "Invoice Annotation"),
        ("object-detection", "Object Detection"),
        ("document-classification", "Document Classification"),
        ("image-segmentation", "Image Segmentation"),
        ("text-translation", "Text Translation"),
    ]
    task_type = models.CharField(
        max_length=50, choices=TASK_TYPE_CHOICES
    )
    assigned_to_user = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL
    )
    history = models.JSONField(
        default=list,
        help_text="List of history records, each containing a timestamp and an action."
    )
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
        ("in-labelling", "In-Labelling"),
        ("in-review", "In-Review"),
        ("accepted", "Accepted"),
        ("completed", "Completed"),
    ]
    inserted_time = models.DateTimeField(auto_now_add=True)
    completed_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="uploaded")
    filename = models.CharField(max_length=255, null=True, blank=True)

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
        verbose_name = "Task"
        verbose_name_plural = "Tasks"
        db_table = "tasks"
        ordering = ["-inserted_time"]

    def __str__(self):
        return f"Task {self.id} - {self.task_type} - {self.status}"