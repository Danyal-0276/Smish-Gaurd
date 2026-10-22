# SmishGuard backend workspace

Python 3.12 / Django 5.2 LTS foundation with Django REST Framework, PostgreSQL/psycopg, dotenv, explicit local CORS origins, and the local trained-model runtime. Business APIs and application data models are intentionally not implemented yet.

Source of scope and decisions: [project brief](../PROJECT_BRIEF.md).

The local `.env` includes a generated Django secret; fill PostgreSQL credentials there without committing it or sending secrets in chat. From the repository root:

```powershell
.\backend\.venv\Scripts\python.exe backend/scripts/prepare_database.py
.\backend\.venv\Scripts\python.exe backend/manage.py migrate
.\backend\.venv\Scripts\python.exe backend/manage.py runserver 127.0.0.1:8000
```

The setup script creates only the explicitly named project database when missing and never drops an existing database. `GET /health/` returns foundation status; `/admin/` requires separately created staff credentials. There is no SMS analysis/history/installation endpoint, and the mobile frontend does not call this backend yet.

Required security evidence includes two-installation authorization tests, filtering of list responses, ownership checks on create/detail/update/delete, credential revocation, and redaction of message content and tokens from logs.

Run `backend/manage.py check` and `backend/manage.py test config` using this environment. These foundation checks run without connecting to PostgreSQL. The real database connection and initial migrations require the filled `.env`; see [setup guide](../docs/SETUP.md). The model bundle path is configured, but inference is not wired into an endpoint.
