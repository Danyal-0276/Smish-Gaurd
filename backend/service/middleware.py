import io
import logging
import uuid
from django.conf import settings
from django.http import JsonResponse
from django.core.exceptions import RequestDataTooBig
from rest_framework.exceptions import Throttled
from .quotas import budget, ServiceUnavailable


class SafeRequestFilter(logging.Filter):
    def filter(self, record):
        # Django development access/error logs can otherwise echo URLs or exceptions.
        record.msg = "HTTP request completed"
        record.args = ()
        record.exc_info = None
        record.exc_text = None
        record.stack_info = None
        return True


class ApiBoundaryMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.request_id = uuid.uuid4()
        api = request.path.startswith("/api/")

        def error(code, message, status, wait=None):
            result = JsonResponse({"error": {"code": code, "message": message, "request_id": str(request.request_id)}}, status=status)
            if wait:
                result["Retry-After"] = str(int(wait))
            result["Cache-Control"] = "no-store"
            result["X-Request-ID"] = str(request.request_id)
            return result

        if api:
            if not settings.DEBUG and not request.is_secure():
                return error("https_required", "Use HTTPS for this service.", 403)
            try:
                if int(request.META.get("CONTENT_LENGTH") or 0) > 32768:
                    return error("payload_too_large", "Request exceeds the size limit.", 413)
                body = request.read(32769)
                if len(body) > 32768:
                    return error("payload_too_large", "Request exceeds the size limit.", 413)
                request._body = body
                request._stream = io.BytesIO(body)
            except (ValueError, RequestDataTooBig):
                return error("invalid_request", "Invalid request body.", 400)
            if body and request.content_type != "application/json":
                return error("unsupported_media_type", "Use application/json.", 415)
            try:
                budget(request, "edge-app", settings.API_IP_PER_MINUTE)
            except Throttled as exc:
                return error("rate_limited", "Too many requests. Try again later.", 429, exc.wait)
            except ServiceUnavailable:
                return error("service_unavailable", "The service is temporarily unavailable.", 503)
        response = self.get_response(request)
        response["X-Request-ID"] = str(request.request_id)
        if api:
            response["Cache-Control"] = "no-store"
        return response
