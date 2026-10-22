import secrets
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Create a local staff account; save credentials in ignored .setup without printing them."

    def handle(self, *args, **kwargs):
        if not settings.DEBUG:
            raise CommandError("Use createsuperuser interactively for deployment; this helper is local-only.")
        username = "smishguard_admin"
        if get_user_model().objects.filter(username=username).exists():
            self.stdout.write("Local administrator already exists; password was not changed.")
            return
        output = settings.BASE_DIR.parent / ".setup/backend-admin-credentials.txt"
        if output.exists():
            raise CommandError("A credential handoff already exists; refusing to overwrite it.")
        password = secrets.token_urlsafe(24)
        output.parent.mkdir(exist_ok=True)
        # Create the private file first so a failed/interrupted account creation
        # does not leave an inaccessible account with a lost generated password.
        with output.open("x", encoding="utf-8") as file:
            file.write(f"Local development staff only\nURL: http://127.0.0.1:8000/admin/\nUsername: {username}\nPassword: {password}\n")
        get_user_model().objects.create_superuser(username=username, password=password)
        self.stdout.write("Local staff account created. Credentials saved in .setup/backend-admin-credentials.txt (ignored by Git); not displayed.")
