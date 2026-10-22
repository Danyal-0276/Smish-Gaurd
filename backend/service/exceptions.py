from django.db import DatabaseError
from django.http import Http404
from django.core.exceptions import PermissionDenied
from rest_framework.exceptions import APIException, Throttled, ValidationError
from rest_framework.response import Response


def api_exception_handler(exc, context):
    request = context.get("request")
    request_id = str(getattr(request, "request_id", ""))
    if isinstance(exc, Http404):
        code, message, status = "not_found", "This resource is unavailable.", 404
    elif isinstance(exc, PermissionDenied):
        code, message, status = "forbidden", "This operation is not permitted.", 403
    elif isinstance(exc, ValidationError):
        code, message, status = (
            "validation_error",
            "Check the request fields and allowed values.",
            400,
        )
    elif isinstance(exc, Throttled):
        code, message, status = "rate_limited", "Too many requests. Try again later.", 429
    elif isinstance(exc, DatabaseError):
        code, message, status = (
            "service_unavailable",
            "The service is temporarily unavailable.",
            503,
        )
    elif isinstance(exc, APIException):
        status = exc.status_code
        messages = {
            401: ("unauthorized", "A valid installation credential is required."),
            403: ("forbidden", "This operation is not permitted."),
            404: ("not_found", "This resource is unavailable."),
            405: ("method_not_allowed", "This method is not supported."),
            415: ("unsupported_media_type", "Use application/json."),
            503: ("service_unavailable", "The service is temporarily unavailable."),
        }
        code, message = messages.get(
            status, ("invalid_request", "The request could not be processed.")
        )
    else:
        # No raw exception string, payload, SQL or traceback in response/logging.
        code, message, status = "internal_error", "The request could not be completed.", 500
    response = Response(
        {"error": {"code": code, "message": message, "request_id": request_id}}, status=status
    )
    if status == 401:
        response["WWW-Authenticate"] = "Bearer"
    if isinstance(exc, Throttled) and exc.wait:
        response["Retry-After"] = str(int(exc.wait))
    return response
