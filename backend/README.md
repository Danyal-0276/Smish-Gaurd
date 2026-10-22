# SmishGuard backend

Python 3.12, Django/DRF, PostgreSQL and the local evaluated model. Implemented: installation credentials/rotation/revocation, strict transient analysis, shared atomic quotas, published lessons, owner-scoped consented feedback and an audited staff console. No server SMS inbox or mobile-user accounts.

Run from the repository root:

```powershell
.\backend\.venv\Scripts\python.exe backend/serve.py
```

Staff console: `http://127.0.0.1:8000/admin/`. Local credentials are saved privately in `.setup/backend-admin-credentials.txt`, ignored by Git. Runtime uses `smishguard_app`; schema migrations use a separate role. No password is embedded in the mobile app.

Use [BACKEND_GUIDE.md](../docs/BACKEND_GUIDE.md) for setup, role files, migration/test commands, USB integration, retention and production boundaries. [openapi.json](openapi.json) documents the API. [CLIENT_UPDATE.md](../docs/CLIENT_UPDATE.md) describes what can be shown to the client.

Database-backed tests: set `SG_DATABASE_MODE=test`, run `backend/manage.py test config service --keepdb --noinput` with this venv, then remove the override. The test database is separate. `scripts/verify_runtime.py` verifies actual runtime grants and rolls back synthetic data; `manage.py check_readiness` checks database/model readiness.

The staff console is not a contact CRM or a message viewer. Native SMS/WhatsApp features, a phone rebuild test, public TLS deployment and production capacity validation remain separate work.
