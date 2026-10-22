from django.core.management.base import BaseCommand, CommandError
from django.db import connection
from service.inference import get_predictor
from service.models import ModelRelease


class Command(BaseCommand):
    help = "Private process check for DB/model readiness; does not expose deployment details publicly."

    def handle(self, *args, **kwargs):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            predictor = get_predictor()
            if not ModelRelease.objects.filter(pk=predictor.metadata["model_version"], checksum=predictor.metadata["model_sha256"]).exists():
                raise ValueError()
        except Exception:
            raise CommandError("Readiness failed; check private configuration and trusted model registration.") from None
        self.stdout.write("Database and trusted model ready.")
