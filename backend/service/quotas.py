"""Shared PostgreSQL quotas. Transactional row locks, never process-local counters."""
import hashlib
import hmac
from datetime import datetime, timedelta, timezone as dt_timezone
from django.conf import settings
from django.db import DatabaseError, transaction
from django.utils import timezone
from rest_framework.exceptions import APIException, Throttled
from .models import QuotaBucket


class ServiceUnavailable(APIException):
    status_code = 503
    default_detail = "The service is temporarily unavailable. Try again later."
    default_code = "service_unavailable"


def consume(specs):
    """specs = [(scope, principal, limit, window_seconds)]. Admit all or none."""
    now = timezone.now()
    rows = []
    for scope, principal, limit, seconds in specs:
        start = int(now.timestamp()) // seconds * seconds
        key = hmac.new(settings.QUOTA_PEPPER.encode(), f"{scope}:{principal}:{start}".encode(), hashlib.sha256).hexdigest()
        end = datetime.fromtimestamp(start + seconds, dt_timezone.utc)
        rows.append((key, limit, end))
    try:
        with transaction.atomic():
            locked = []
            for key, limit, end in sorted(rows):
                QuotaBucket.objects.get_or_create(key=key, defaults={"expires_at": end + timedelta(hours=1)})
                bucket = QuotaBucket.objects.select_for_update().get(pk=key)
                if bucket.count >= limit:
                    raise Throttled(wait=max(1, int((end - now).total_seconds()) + 1))
                locked.append(bucket)
            for bucket in locked:
                bucket.count += 1
                bucket.save(update_fields=["count"])
    except DatabaseError:
        raise ServiceUnavailable() from None


def peer(request):
    # Forwarding headers are ignored. Production proxy must set REMOTE_ADDR
    # through a deliberately reviewed server configuration, not a client header.
    return request.META.get("REMOTE_ADDR", "unknown")


def budget(request, scope, limit=60):
    consume([(scope, peer(request), limit, 60)])
