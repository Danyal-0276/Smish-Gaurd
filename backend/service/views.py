from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import CursorPagination
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from .credentials import issue, revoke, rotate
from .inference import analyze
from .models import Feedback, Installation, Lesson
from .quotas import consume, peer
from .serializers import (
    AnalysisSerializer,
    FeedbackInput,
    FeedbackOutput,
    LessonOutput,
    RegistrationSerializer,
    StrictSerializer,
)


class ProtectedView(APIView):
    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        consume([("installation-api", str(request.user.pk), 90, 60)])


class Register(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        consume(
            [
                ("register-burst", peer(request), 5, 60),
                ("register-hour", peer(request), settings.REGISTER_PER_HOUR, 3600),
                ("register-global", "all", settings.REGISTER_GLOBAL_DAILY, 86400),
            ]
        )
        form = RegistrationSerializer(data=request.data)
        form.is_valid(raise_exception=True)
        with transaction.atomic():
            install = Installation.objects.create(
                app_version=form.validated_data["app_version"],
                consent_version=form.validated_data["consent_version"],
                cloud_consent_at=timezone.now(),
            )
            result = issue(install)
        return Response(result, status=201)


class Rotate(ProtectedView):
    def post(self, request):
        form = StrictSerializer(data=request.data)
        form.is_valid(raise_exception=True)
        return Response(rotate(request.user, request.auth))


class DeleteInstallation(ProtectedView):
    def delete(self, request):
        form = StrictSerializer(data=request.data)
        form.is_valid(raise_exception=True)
        with transaction.atomic():
            install = Installation.objects.select_for_update().get(pk=request.user.pk)
            revoke(install)
            Feedback.objects.filter(installation=install).delete()
        return Response(status=204)


class Analyze(ProtectedView):
    def post(self, request):
        form = AnalysisSerializer(data=request.data)
        form.is_valid(raise_exception=True)
        consume(
            [
                ("analysis-minute", str(request.user.pk), settings.ANALYSIS_PER_MINUTE, 60),
                ("analysis-day", str(request.user.pk), settings.ANALYSIS_PER_DAY, 86400),
                ("analysis-global", "all", settings.ANALYSIS_GLOBAL_DAILY, 86400),
            ]
        )
        return Response(analyze(form.validated_data["text"], request.request_id))


class Capabilities(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                "api_version": "v1",
                "consent_version": "2026-10-22",
                "max_characters": 5000,
                "max_body_bytes": 32768,
                "modes": ["backend_model"],
                "coverage": "English-oriented historical SMS benchmark; language is not automatically verified.",
                "stores_message_bodies": False,
                "automatic_sms": False,
                "whatsapp_access": False,
            }
        )


class Pages(CursorPagination):
    page_size = 20
    ordering = ("-created_at", "-id")


class FeedbackList(ProtectedView):
    def get(self, request):
        pages = Pages()
        records = pages.paginate_queryset(
            Feedback.objects.filter(installation=request.user), request, view=self
        )
        return pages.get_paginated_response(FeedbackOutput(records, many=True).data)

    def post(self, request):
        consume([("feedback-day", str(request.user.pk), 30, 86400)])
        form = FeedbackInput(data=request.data)
        form.is_valid(raise_exception=True)
        data = dict(form.validated_data)
        data.pop("feedback_consent")
        with transaction.atomic():
            # Serialize against reset/revocation as well as duplicate submissions.
            install = Installation.objects.select_for_update().get(pk=request.user.pk)
            if install.revoked_at:
                from rest_framework.exceptions import AuthenticationFailed

                raise AuthenticationFailed()
            row, created = Feedback.objects.get_or_create(
                installation=install, client_event_id=data.pop("client_event_id"), defaults=data
            )
            if not created and any(getattr(row, k) != v for k, v in data.items()):
                raise ValidationError("Event already exists with different metadata.")
        return Response(FeedbackOutput(row).data, status=201 if created else 200)


class FeedbackDelete(ProtectedView):
    def delete(self, request, identifier):
        get_object_or_404(Feedback, pk=identifier, installation=request.user).delete()
        return Response(status=204)


class LessonList(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        rows = LessonOutput(
            Lesson.objects.filter(published=True).order_by("slug")[:50], many=True
        ).data
        return Response({"results": rows})


class LessonDetail(LessonList):
    def get(self, request, slug):
        return Response(LessonOutput(get_object_or_404(Lesson, slug=slug, published=True)).data)
