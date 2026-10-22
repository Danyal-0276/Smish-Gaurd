import hashlib
import hmac
import re
import secrets
import uuid
from datetime import timedelta
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed
from .models import Installation, InstallationCredential

TOKEN = re.compile(r"sg1\.([0-9a-f-]{36})\.([A-Za-z0-9_-]{43})\Z")


def verifier(secret):
    return hmac.new(settings.INSTALLATION_PEPPER.encode(), secret.encode(), hashlib.sha256).hexdigest()


def issue(installation):
    secret = secrets.token_urlsafe(32)
    row = InstallationCredential.objects.create(installation=installation, verifier=verifier(secret), expires_at=timezone.now() + timedelta(days=settings.CREDENTIAL_DAYS))
    return {"credential": f"sg1.{row.id}.{secret}", "expires_at": row.expires_at.isoformat(), "installation_id": str(installation.id)}


def revoke(installation):
    now = timezone.now()
    Installation.objects.filter(pk=installation.pk).update(revoked_at=now)
    InstallationCredential.objects.filter(installation=installation, revoked_at__isnull=True).update(revoked_at=now)


class InstallationAuthentication(BaseAuthentication):
    def authenticate_header(self, request):
        return "Bearer"

    def authenticate(self, request):
        header = get_authorization_header(request)
        if not header:
            return None
        if len(header) > 200:
            raise AuthenticationFailed("Invalid installation credential.")
        try:
            scheme, value = header.decode("ascii").split(" ", 1)
        except (ValueError, UnicodeError):
            raise AuthenticationFailed("Invalid installation credential.") from None
        match = TOKEN.fullmatch(value) if scheme.lower() == "bearer" else None
        if not match:
            raise AuthenticationFailed("Invalid installation credential.")
        try:
            identifier = uuid.UUID(match[1])
        except ValueError:
            raise AuthenticationFailed("Invalid installation credential.") from None
        row = InstallationCredential.objects.select_related("installation").filter(pk=identifier).first()
        expected = row.verifier if row else "0" * 64
        valid = hmac.compare_digest(expected, verifier(match[2]))
        if not row or not valid or row.revoked_at or row.installation.revoked_at or row.expires_at <= timezone.now() or row.key_version != 1:
            raise AuthenticationFailed("Invalid or expired installation credential.")
        return row.installation, row


@transaction.atomic
def rotate(installation, credential):
    locked = Installation.objects.select_for_update().get(pk=installation.pk)
    current = InstallationCredential.objects.get(pk=credential.pk)
    if locked.revoked_at or current.revoked_at or current.expires_at <= timezone.now():
        raise AuthenticationFailed("Invalid or expired installation credential.")
    InstallationCredential.objects.filter(installation=locked, revoked_at__isnull=True).update(revoked_at=timezone.now())
    return issue(locked)
