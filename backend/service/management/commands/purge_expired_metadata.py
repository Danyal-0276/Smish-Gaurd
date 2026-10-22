from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Exists, OuterRef, Q
from service.models import (
    AdminAuditEvent,
    Feedback,
    Installation,
    InstallationCredential,
    QuotaBucket,
)


class Command(BaseCommand):
    help = "Purge expired quota buckets, feedback older than 30 days, and revoked installations older than 30 days."

    def handle(self, *args, **kwargs):
        now = timezone.now()
        for model, filters in [
            (QuotaBucket, {"expires_at__lt": now}),
            (Feedback, {"created_at__lt": now - timedelta(days=30)}),
            (Installation, {"revoked_at__lt": now - timedelta(days=30)}),
        ]:
            count, _ = model.objects.filter(**filters).delete()
            self.stdout.write(f"{model.__name__}: removed {count} expired rows.")
        InstallationCredential.objects.filter(
            Q(revoked_at__lt=now - timedelta(days=30)) | Q(expires_at__lt=now - timedelta(days=30))
        ).delete()
        active = InstallationCredential.objects.filter(
            installation_id=OuterRef("pk"), revoked_at__isnull=True, expires_at__gt=now
        )
        Installation.objects.filter(created_at__lt=now - timedelta(days=120)).annotate(
            has_active=Exists(active)
        ).filter(has_active=False).delete()
        AdminAuditEvent.objects.filter(created_at__lt=now - timedelta(days=180)).delete()
