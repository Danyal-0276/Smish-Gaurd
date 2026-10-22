from collections.abc import Mapping
from rest_framework import serializers
from .models import Feedback, Lesson, ModelRelease


class StrictSerializer(serializers.Serializer):
    def to_internal_value(self, data):
        if not isinstance(data, Mapping) or set(data) - set(self.fields):
            raise serializers.ValidationError("Unexpected request fields or structure.")
        return super().to_internal_value(data)


class RegistrationSerializer(StrictSerializer):
    app_version = serializers.RegexField(r"^[0-9A-Za-z._-]{1,30}$")
    consent_version = serializers.ChoiceField(choices=["2026-10-22"])
    cloud_analysis_consent = serializers.BooleanField()

    def validate_cloud_analysis_consent(self, value):
        if value is not True:
            raise serializers.ValidationError("Online analysis requires consent.")
        return value


class AnalysisSerializer(StrictSerializer):
    text = serializers.CharField(max_length=5000, trim_whitespace=False)
    cloud_analysis_consent = serializers.BooleanField()

    def validate_text(self, value):
        if not value.strip():
            raise serializers.ValidationError("Add a message.")
        return value

    validate_cloud_analysis_consent = RegistrationSerializer.validate_cloud_analysis_consent


class FeedbackInput(StrictSerializer):
    client_event_id = serializers.UUIDField()
    model_version = serializers.PrimaryKeyRelatedField(queryset=ModelRelease.objects.all(), source="model_release")
    risk = serializers.ChoiceField(choices=Feedback.RISKS)
    reason = serializers.ChoiceField(choices=Feedback.REASONS)
    feedback_consent = serializers.BooleanField()

    def validate_feedback_consent(self, value):
        if value is not True:
            raise serializers.ValidationError("Feedback requires separate consent.")
        return value


class FeedbackOutput(serializers.ModelSerializer):
    model_version = serializers.CharField(source="model_release_id")

    class Meta:
        model = Feedback
        fields = ["id", "client_event_id", "model_version", "risk", "reason", "status", "created_at"]


class LessonOutput(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ["slug", "title", "summary", "category", "duration", "sections", "question", "options", "correct_index", "explanation", "revision"]
