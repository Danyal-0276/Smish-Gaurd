"""Verify actual runtime grants and the client/CRM flow without launching a UI.

All synthetic DB changes are rolled back. The saved report contains no secrets.
"""

import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
import django

django.setup()
from django.db import connection, transaction
from django.test import Client, override_settings
from dotenv import dotenv_values
from rest_framework.test import APIClient
from service.models import Installation, InstallationCredential

report = {}
with connection.cursor() as cursor:
    cursor.execute(
        "SELECT current_user, rolsuper, rolcreatedb, rolcreaterole, has_schema_privilege(current_user, 'public', 'CREATE') FROM pg_roles WHERE rolname=current_user"
    )
    role, superuser, create_db, create_role, create_schema = cursor.fetchone()
report["runtime_role"] = role
report["runtime_is_restricted"] = not any([superuser, create_db, create_role, create_schema])
assert report["runtime_is_restricted"] and role == "smishguard_app"

with override_settings(ALLOWED_HOSTS=["testserver"], DEBUG=True), transaction.atomic():
    client = APIClient()
    registration = client.post(
        "/api/v1/installations",
        {
            "app_version": "runtime-check",
            "consent_version": "2026-10-22",
            "cloud_analysis_consent": True,
        },
        format="json",
    )
    assert registration.status_code == 201
    issued = registration.json()
    token = issued["credential"]
    row = InstallationCredential.objects.get(installation_id=issued["installation_id"])
    assert row.verifier != token.split(".")[-1]
    client.credentials(HTTP_AUTHORIZATION="Bearer " + token)
    result = client.post(
        "/api/v1/analyses",
        {
            "text": "Your book is ready for collection at the campus library.",
            "cloud_analysis_consent": True,
        },
        format="json",
    )
    assert result.status_code == 200 and result.json()["mode"] == "backend_model"
    report["actual_runtime_api_registration_and_inference"] = "passed"
    report["model_version"] = result.json()["model_version"]
    report["raw_text_in_analysis_response"] = "text" in result.json()
    assert not report["raw_text_in_analysis_response"]
    assert client.delete("/api/v1/installations/me").status_code == 204
    assert client.get("/api/v1/feedback/me").status_code == 401
    report["revocation"] = "passed"
    private = ROOT.parent / ".setup/backend-admin-credentials.txt"
    values = dict(line.split(": ", 1) for line in private.read_text().splitlines() if ": " in line)
    staff = Client()
    assert staff.login(username=values["Username"], password=values["Password"])
    for path in [
        "/admin/",
        "/admin/service/installation/",
        "/admin/service/lesson/",
        "/admin/service/modelrelease/",
        "/admin/service/feedback/",
        "/admin/service/adminauditevent/",
    ]:
        assert staff.get(path).status_code == 200
    report["staff_login_and_all_operations_pages"] = "passed"
    transaction.set_rollback(True)
report["synthetic_database_changes"] = "rolled back"
report["mobile_device_check"] = "pending rebuild with expo-secure-store; no app UI launched"
output = ROOT.parent / "docs/setup/backend-verification.json"
output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(json.dumps(report, indent=2))
