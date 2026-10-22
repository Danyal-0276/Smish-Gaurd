"""Operational metadata only: no message bodies, senders, URLs or usable tokens."""
import uuid
from django.conf import settings
from django.db import models


class Installation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    app_version = models.CharField(max_length=30)
    consent_version = models.CharField(max_length=30)
    cloud_consent_at = models.DateTimeField()

    @property
    def is_authenticated(self):
        return self.revoked_at is None

    @property
    def is_staff(self):
        return False

    def __str__(self):
        return str(self.id)


class InstallationCredential(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    installation = models.ForeignKey(Installation, on_delete=models.CASCADE, related_name="credentials")
    verifier = models.CharField(max_length=64, editable=False)
    key_version = models.PositiveSmallIntegerField(default=1, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(db_index=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return str(self.id)


class QuotaBucket(models.Model):
    key = models.CharField(max_length=64, primary_key=True)
    count = models.PositiveIntegerField(default=0)
    expires_at = models.DateTimeField(db_index=True)


class ModelRelease(models.Model):
    version = models.CharField(max_length=100, primary_key=True)
    checksum = models.CharField(max_length=64)
    policy_version = models.CharField(max_length=100)
    metrics = models.JSONField(default=dict)
    registered_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.version


class Lesson(models.Model):
    slug = models.SlugField(primary_key=True, max_length=60)
    title = models.CharField(max_length=120)
    summary = models.CharField(max_length=300)
    category = models.CharField(max_length=60)
    duration = models.PositiveSmallIntegerField(default=2)
    sections = models.JSONField(default=list)
    question = models.CharField(max_length=500)
    options = models.JSONField(default=list)
    correct_index = models.PositiveSmallIntegerField()
    explanation = models.TextField(max_length=2000)
    revision = models.PositiveIntegerField(default=1)
    published = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        from django.core.exceptions import ValidationError
        if not isinstance(self.sections, list) or not 1 <= len(self.sections) <= 20:
            raise ValidationError({"sections": "Use 1–20 reviewed sections."})
        for item in self.sections:
            if not isinstance(item, dict) or set(item) != {"heading", "body"} or any(not isinstance(v, str) or not v.strip() or len(v) > 2000 for v in item.values()):
                raise ValidationError({"sections": "Each section needs bounded heading/body strings."})
        if not isinstance(self.options, list) or not 2 <= len(self.options) <= 6 or any(not isinstance(v, str) or not v.strip() or len(v) > 500 for v in self.options):
            raise ValidationError({"options": "Use 2–6 bounded answer strings."})
        if self.correct_index >= len(self.options):
            raise ValidationError({"correct_index": "Choose an existing answer."})

    def __str__(self):
        return self.title


class Feedback(models.Model):
    RISKS = [(v, v) for v in ("low", "review", "high")]
    REASONS = [(v, v) for v in ("false_positive", "false_negative", "unclear")]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    installation = models.ForeignKey(Installation, on_delete=models.CASCADE)
    client_event_id = models.UUIDField()
    model_release = models.ForeignKey(ModelRelease, on_delete=models.PROTECT)
    risk = models.CharField(max_length=10, choices=RISKS)
    reason = models.CharField(max_length=20, choices=REASONS)
    status = models.CharField(max_length=20, choices=[("new", "New"), ("reviewed", "Reviewed")], default="new")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["installation", "client_event_id"], name="feedback_owner_event_unique")]
        indexes = [models.Index(fields=["installation", "-created_at", "id"])]


class AdminAuditEvent(models.Model):
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=50)
    object_reference = models.CharField(max_length=120)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
