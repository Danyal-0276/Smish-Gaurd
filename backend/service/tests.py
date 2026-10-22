import hashlib
import json
import logging
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.db import DatabaseError, close_old_connections
from django.test import SimpleTestCase, TestCase, TransactionTestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework.exceptions import Throttled
from .credentials import issue
from .logging import SafeRequestFilter
from .models import (
    Feedback,
    Installation,
    InstallationCredential,
    Lesson,
    ModelRelease,
    QuotaBucket,
)
from .quotas import consume


@override_settings(DEBUG=True, ALLOWED_HOSTS=["testserver"])
class ApiSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.a = Installation.objects.create(
            app_version="test", consent_version="2026-10-22", cloud_consent_at=timezone.now()
        )
        self.b = Installation.objects.create(
            app_version="test", consent_version="2026-10-22", cloud_consent_at=timezone.now()
        )
        self.token = issue(self.a)["credential"]
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + self.token)
        self.release = ModelRelease.objects.create(
            version="test-model", checksum="a" * 64, policy_version="test-policy"
        )

    def test_protected_scan_requires_installation(self):
        self.client.credentials()
        self.assertEqual(
            self.client.post("/api/v1/analyses", {"text": "hello"}, format="json").status_code, 401
        )

    def test_registration_requires_consent_and_rejects_owner_fields(self):
        payload = {
            "app_version": "1.0",
            "consent_version": "2026-10-22",
            "cloud_analysis_consent": True,
        }
        for change in [
            {"installation_id": str(self.b.pk)},
            {"cloud_analysis_consent": False},
            {"phone_number": "CANARY_PRIVATE_NUMBER"},
        ]:
            response = self.client.post(
                "/api/v1/installations", {**payload, **change}, format="json"
            )
            self.assertEqual(response.status_code, 400)
        response = self.client.post("/api/v1/installations", payload, format="json")
        self.assertEqual(response.status_code, 201)
        secret = response.json()["credential"].split(".")[-1]
        self.assertFalse(InstallationCredential.objects.filter(verifier=secret).exists())
        self.assertEqual(response["Cache-Control"], "no-store")

    def test_malformed_credentials_rejected(self):
        for header in ["Bearer bad", "Basic abc", "Bearer " + "x" * 300]:
            self.client.credentials(HTTP_AUTHORIZATION=header)
            self.assertEqual(
                self.client.post("/api/v1/analyses", {}, format="json").status_code, 401
            )

    def test_rotated_and_expired_credentials_rejected(self):
        rotated = self.client.post("/api/v1/installations/me/credentials/rotate", {}, format="json")
        self.assertEqual(rotated.status_code, 200)
        self.assertEqual(self.client.post("/api/v1/analyses", {}, format="json").status_code, 401)
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + rotated.json()["credential"])
        InstallationCredential.objects.filter(revoked_at__isnull=True, installation=self.a).update(
            expires_at=timezone.now() - timedelta(seconds=1)
        )
        self.assertEqual(self.client.post("/api/v1/analyses", {}, format="json").status_code, 401)

    def test_reset_revokes_credentials_and_only_deletes_own_feedback(self):
        own = Feedback.objects.create(
            installation=self.a,
            client_event_id=uuid.uuid4(),
            model_release=self.release,
            risk="low",
            reason="unclear",
        )
        other = Feedback.objects.create(
            installation=self.b,
            client_event_id=uuid.uuid4(),
            model_release=self.release,
            risk="low",
            reason="unclear",
        )
        self.assertEqual(self.client.delete("/api/v1/installations/me").status_code, 204)
        self.assertFalse(Feedback.objects.filter(pk=own.pk).exists())
        self.assertTrue(Feedback.objects.filter(pk=other.pk).exists())
        self.assertEqual(self.client.get("/api/v1/feedback/me").status_code, 401)

    def test_feedback_list_and_delete_isolation(self):
        other = Feedback.objects.create(
            installation=self.b,
            client_event_id=uuid.uuid4(),
            model_release=self.release,
            risk="high",
            reason="false_positive",
        )
        result = self.client.get("/api/v1/feedback/me")
        self.assertEqual(result.json()["results"], [])
        hidden = self.client.delete(f"/api/v1/feedback/me/{other.pk}")
        absent = self.client.delete(f"/api/v1/feedback/me/{uuid.uuid4()}")
        self.assertEqual(hidden.status_code, 404)
        self.assertEqual(hidden.json()["error"]["code"], absent.json()["error"]["code"])
        self.assertTrue(Feedback.objects.filter(pk=other.pk).exists())

    def test_feedback_unknown_fields_consent_and_idempotency(self):
        payload = {
            "client_event_id": str(uuid.uuid4()),
            "model_version": self.release.pk,
            "risk": "review",
            "reason": "unclear",
            "feedback_consent": True,
        }
        for addition in [
            {"text": "PRIVATE_CANARY"},
            {"installation": str(self.b.pk)},
            {"feedback_consent": False},
        ]:
            self.assertEqual(
                self.client.post(
                    "/api/v1/feedback/me", {**payload, **addition}, format="json"
                ).status_code,
                400,
            )
        first = self.client.post("/api/v1/feedback/me", payload, format="json")
        second = self.client.post("/api/v1/feedback/me", payload, format="json")
        self.assertEqual((first.status_code, second.status_code), (201, 200))
        self.assertEqual(Feedback.objects.get(pk=first.json()["id"]).installation, self.a)
        self.assertEqual(
            self.client.post(
                "/api/v1/feedback/me", {**payload, "risk": "high"}, format="json"
            ).status_code,
            400,
        )

    def test_payload_limits_and_wrong_types_fail_without_echo(self):
        for value in ["", "   ", "x" * 5001, [], {}, None]:
            response = self.client.post(
                "/api/v1/analyses", {"text": value, "cloud_analysis_consent": True}, format="json"
            )
            self.assertEqual(response.status_code, 400)
        self.assertEqual(
            self.client.post(
                "/api/v1/analyses", "x" * 32769, content_type="application/json"
            ).status_code,
            413,
        )
        self.assertEqual(
            self.client.post("/api/v1/analyses", "plain", content_type="text/plain").status_code,
            415,
        )
        canary = "PRIVATE_CANARY_OTP_123456"
        response = self.client.post(
            "/api/v1/analyses", {"text": canary, "cloud_analysis_consent": False}, format="json"
        )
        self.assertNotIn(canary, response.content.decode())

    def test_real_model_and_unsupported_text(self):
        response = self.client.post(
            "/api/v1/analyses",
            {
                "text": "Your book is ready for collection at the campus library.",
                "cloud_analysis_consent": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["mode"], "backend_model")
        self.assertIn(response.json()["risk"], ["low", "review", "high"])
        self.assertNotIn("text", response.json())
        unsupported = self.client.post(
            "/api/v1/analyses", {"text": "12345", "cloud_analysis_consent": True}, format="json"
        )
        self.assertEqual(unsupported.json()["status"], "unsupported")
        self.assertIsNone(unsupported.json()["risk"])

    def test_inference_failure_is_unavailable_not_low_risk(self):
        with patch(
            "service.inference.get_predictor", side_effect=RuntimeError("PRIVATE_MODEL_PATH")
        ):
            response = self.client.post(
                "/api/v1/analyses",
                {"text": "A sample message", "cloud_analysis_consent": True},
                format="json",
            )
        self.assertEqual(response.status_code, 503)
        self.assertNotIn("risk", response.json())
        self.assertNotIn("PRIVATE_MODEL_PATH", response.content.decode())

    def test_quota_failure_is_closed(self):
        with patch(
            "service.quotas.QuotaBucket.objects.get_or_create",
            side_effect=DatabaseError("PRIVATE_SQL"),
        ):
            response = self.client.get("/api/v1/capabilities")
        self.assertEqual(response.status_code, 503)
        self.assertNotIn("PRIVATE_SQL", response.content.decode())

    @override_settings(ANALYSIS_PER_MINUTE=1)
    def test_inference_quota_is_enforced_with_retry_after(self):
        payload = {"text": "12345", "cloud_analysis_consent": True}
        # Both admissions must be in the same fixed window, even when the
        # test suite happens to run across a real wall-clock minute boundary.
        with patch("service.quotas.timezone.now", return_value=timezone.now()):
            self.assertEqual(
                self.client.post("/api/v1/analyses", payload, format="json").status_code, 200
            )
            response = self.client.post("/api/v1/analyses", payload, format="json")
        self.assertEqual(response.status_code, 429)
        self.assertIn("Retry-After", response)

    def test_drafts_not_visible_and_public_fields_bounded(self):
        data = dict(
            title="Safe habits",
            summary="Summary",
            category="Safety",
            sections=[{"heading": "Pause", "body": "Verify."}],
            question="What next?",
            options=["Pause", "Click"],
            correct_index=0,
            explanation="Pause first.",
        )
        Lesson.objects.create(slug="draft", **data)
        Lesson.objects.create(slug="public", published=True, **data)
        self.assertEqual(self.client.get("/api/v1/lessons/draft").status_code, 404)
        rows = self.client.get("/api/v1/lessons").json()["results"]
        self.assertEqual([r["slug"] for r in rows], ["public"])
        self.assertNotIn("published", rows[0])

    def test_installation_token_does_not_authorize_staff_admin(self):
        self.assertEqual(self.client.get("/admin/service/installation/").status_code, 302)
        staff = get_user_model().objects.create_user(
            username="viewer", password="not-used-here", is_staff=True
        )
        self.client.force_login(staff)
        self.assertEqual(self.client.get("/admin/service/installation/").status_code, 403)

    def test_staff_dashboard_and_credential_admin_exclusion(self):
        staff = get_user_model().objects.create_superuser(
            username="operator", password="synthetic-test-only"
        )
        self.client.force_login(staff)
        result = self.client.get("/admin/")
        self.assertEqual(result.status_code, 200)
        self.assertContains(result, "A clearer view of the service")
        self.assertNotContains(result, self.token)
        self.assertEqual(self.client.get("/admin/service/installationcredential/").status_code, 404)

    def test_numeric_text_and_nonboolean_consent_are_rejected(self):
        for payload in [
            {"text": 12345, "cloud_analysis_consent": True},
            {"text": "A sample text", "cloud_analysis_consent": "true"},
        ]:
            self.assertEqual(
                self.client.post("/api/v1/analyses", payload, format="json").status_code, 400
            )

    def test_staff_login_rate_limit_and_csrf_boundary(self):
        from django.test import Client

        csrf = Client(enforce_csrf_checks=True)
        self.assertEqual(
            csrf.post(
                "/admin/login/", {"username": "synthetic", "password": "synthetic"}
            ).status_code,
            403,
        )
        for _ in range(4):
            csrf.post("/admin/login/", {})
        self.assertEqual(csrf.post("/admin/login/", {}).status_code, 429)

    @override_settings(DEBUG=False, SECURE_SSL_REDIRECT=False)
    def test_non_tls_api_rejected_in_deployment_mode(self):
        self.assertEqual(self.client.get("/api/v1/capabilities").status_code, 403)
        self.assertEqual(self.client.get("/api/v1/capabilities", secure=True).status_code, 200)

    def test_log_filter_removes_payload_and_traceback(self):
        record = logging.LogRecord(
            "django.request",
            logging.ERROR,
            "private-path",
            1,
            "PRIVATE_CANARY %s",
            ("RAW_TOKEN",),
            None,
        )
        SafeRequestFilter().filter(record)
        self.assertEqual(record.getMessage(), "HTTP request completed")
        self.assertIsNone(record.exc_info)

    def test_expired_metadata_cleanup_preserves_valid_installation(self):
        from django.core.management import call_command

        old = timezone.now() - timedelta(days=40)
        event = Feedback.objects.create(
            installation=self.a,
            client_event_id=uuid.uuid4(),
            model_release=self.release,
            risk="low",
            reason="unclear",
        )
        Feedback.objects.filter(pk=event.pk).update(created_at=old)
        QuotaBucket.objects.create(key="expired", count=1, expires_at=old)
        Installation.objects.filter(pk=self.a.pk).update(
            created_at=timezone.now() - timedelta(days=150)
        )
        import io

        call_command("purge_expired_metadata", stdout=io.StringIO())
        self.assertFalse(Feedback.objects.filter(pk=event.pk).exists())
        self.assertFalse(QuotaBucket.objects.filter(pk="expired").exists())
        self.assertTrue(Installation.objects.filter(pk=self.a.pk).exists())


class QuotaConcurrencyTests(TransactionTestCase):
    def test_shared_limit_has_exact_admissions_across_connections(self):
        def attempt(_):
            close_old_connections()
            try:
                consume([("concurrency-test", "same-installation", 3, 3600)])
                return True
            except Throttled:
                return False
            finally:
                close_old_connections()

        with patch("service.quotas.timezone.now", return_value=timezone.now()):
            with ThreadPoolExecutor(max_workers=4) as pool:
                admitted = list(pool.map(attempt, range(8)))
        self.assertEqual(sum(admitted), 3)
        self.assertEqual(QuotaBucket.objects.get().count, 3)

class ResultAdviceTests(SimpleTestCase):
    def test_advice_changes_with_model_risk(self):
        from .inference import analyze
        from unittest.mock import Mock

        expected = {
            "high_phishing_risk": ("high", "Do not open links"),
            "suspicious": ("review", "Pause before responding"),
            "low_detected_risk": ("low", "No strong phishing signal"),
        }
        for verdict, (risk, instruction) in expected.items():
            predictor = Mock()
            predictor.predict.return_value = {
                "status": "completed", "verdict": verdict,
                "model_version": "synthetic-unit-test", "language_coverage": "English",
                "policy_version": "1", "model_estimate": 0.5,
                "observed_indicators": [], "indicator_note": "Observed rules only",
            }
            with patch("service.inference.get_predictor", return_value=predictor):
                result = analyze("Synthetic unit-test input", uuid.uuid4())
            self.assertEqual(result["risk"], risk)
            self.assertIn(instruction, result["advice"])

    def test_automatic_sms_consent_version_is_accepted(self):
        from .serializers import RegistrationSerializer
        form = RegistrationSerializer(data={"app_version": "0.2.0", "consent_version": "2026-10-23", "cloud_analysis_consent": True})
        self.assertTrue(form.is_valid(), form.errors)
