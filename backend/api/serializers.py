from rest_framework import serializers
from .models import Project

class ProjectSerializer(serializers.ModelSerializer):
    # This tells DRF exactly what fields to include in the JSON
    class Meta:
        model = Project
        fields = ["id", "name", "task_type", "schema"]
        # id and task_type are usually set at creation, so we make them read-only
        read_only_fields = ["id", "task_type"]
