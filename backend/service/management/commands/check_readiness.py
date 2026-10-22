from django.core.management.base import BaseCommand, CommandError
from django.db import connection
from service.inference import get_predictor
from service.models import ModelRelease


class Command(BaseCommand):
    help = (
        "Private process check for DB/model readiness; does not expose deployment details publicly."
    )

    def handle(self, *args, **kwargs):
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT rolsuper, rolcreatedb, rolcreaterole, has_schema_privilege(current_user, 'public', 'CREATE'), has_database_privilege(current_user, current_database(), 'CREATE') FROM pg_roles WHERE rolname=current_user"
                )
                if any(cursor.fetchone()):
                    raise ValueError(
                        "The serving role must not have administrative/schema creation privileges."
                    )
            predictor = get_predictor()
            if not ModelRelease.objects.filter(
                pk=predictor.metadata["model_version"], checksum=predictor.metadata["model_sha256"]
            ).exists():
                raise ValueError()
        except Exception:
            raise CommandError(
                "Readiness failed; check private configuration and trusted model registration."
            ) from None
        self.stdout.write("Database and trusted model ready.")
