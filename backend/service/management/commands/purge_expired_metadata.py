from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from service.models import Feedback, Installation, QuotaBucket


class Command(BaseCommand):
    help = "Purge expired quota buckets, feedback older than 30 days, and revoked installations older than 30 days."

    def handle(self, *args, **kwargs):
        now = timezone.now()
        for model, filters in [(QuotaBucket, {"expires_at__lt": now}), (Feedback, {"created_at__lt": now - timedelta(days=30)}), (Installation, {"revoked_at__lt": now - timedelta(days=30)})]:
            count, _ = model.objects.filter(**filters).delete()
            self.stdout.write(f"{model.__name__}: removed {count} expired rows.")
