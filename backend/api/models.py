import uuid
import pytz
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Project(models.Model):
    # Use UUIDField instead of CharField for better DB performance
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)

    TASK_TYPE_CHOICES = [
        ("invoice-annotation", "Invoice Annotation"),
        ("object-detection", "Object Detection"),
        ("document-classification", "Document Classification"),
        ("image-segmentation", "Image Segmentation"),
    ]
    task_type = models.CharField(max_length=50, choices=TASK_TYPE_CHOICES)
    
    # Stores the "Ontology" (e.g., classes like "Car", "Dog" or Invoice Fields)
    schema = models.JSONField(
        default=dict,
        help_text="Defines sections and fields for the task."
    )

    class Meta:
        db_table = "projects"

    def __str__(self):
        return f"{self.name} ({self.get_task_type_display()})"

class Task(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        Project, null=True, blank=True, on_delete=models.SET_NULL, related_name="tasks"
    )
    assigned_to_user = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="assigned_tasks"
    )
    
    # FR-10: Audit Trail - Automated via a helper method
    history = models.JSONField(default=list)
    
    status = models.CharField(
        max_length=50, 
        choices=[
            ("uploaded", "Uploaded"),
            ("in-labelling", "In-Labelling"),
            ("in-review", "In-Review"),
            ("accepted", "Accepted"),
            ("completed", "Completed"),
        ], 
        default="uploaded"
    )

    # Annotator/Reviewer metadata
    labelled_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="labelled_tasks")
    labelled_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="reviewed_tasks")
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    filename = models.CharField(max_length=255, null=True, blank=True)
    inserted_time = models.DateTimeField(auto_now_add=True)
    completed_time = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        ist = pytz.timezone("Asia/Kolkata")
        now = timezone.now().astimezone(ist)

        # Automatically update timestamps based on role activity
        if self.labelled_by and not self.labelled_at:
            self.labelled_at = now
        if self.reviewed_by and not self.reviewed_at:
            self.reviewed_at = now
        if self.status == "completed" and not self.completed_time:
            self.completed_time = now

        super().save(*args, **kwargs)

    class Meta:
        db_table = "tasks"
        ordering = ["-inserted_time"]

    def __str__(self):
        # Fixed: Accessed task_type via project relationship
        task_type = self.project.task_type if self.project else "Unassigned"
        return f"Task {str(self.id)[:8]} - {task_type} - {self.status}"