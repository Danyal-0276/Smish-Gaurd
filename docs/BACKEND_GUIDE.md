# SmishGuard backend and staff operations handoff

Implemented 22 October 2026. This guide describes the running code; BACKEND_ROADMAP.md retains the earlier design and future milestones. No mobile UI was launched during this implementation.

## What is implemented

- Django 5.2/DRF API with per-installation opaque bearer credentials, keyed verifiers, expiry, rotation and revocation; no phone-user accounts.
- Real local Python model inference through `/api/v1/analyses`; explicit unsupported input and service-error states, model/policy versions and observed indicators. No SMS body/history table and no URL fetching.
- Strict JSON schemas, 5,000-character/32 KiB input limits, bounded inference slots, controlled errors, private response caching policy and sanitized Django request logs.
- Shared atomic PostgreSQL quota counters, installation/IP/global limits, and bounded server threads/connections. This deliberately replaces the roadmap's initial Redis requirement for this first service: the counters use PostgreSQL transactions and row locks across workers, not a process-local fallback. Redis remains a possible measured-load optimization. Public deployment still requires an edge proxy and abuse controls; app quotas are not DDoS protection.
- Separate project database owner/migration credentials and restricted runtime credentials, plus an isolated test database. Runtime cannot create databases/roles or create objects in the project schema. Project role connection limits are 20 runtime/8 migration. Shared-cluster cross-database login restrictions still require a separately reviewed deployment boundary; grants inherited from PUBLIC elsewhere are not silently changed.
- Staff console: anonymous installation metadata, credential revocation, reviewed learning content, immutable deployed-model metadata, consented correction metadata, and staff audit events. It is an operations console, not a contact-management CRM or private-message viewer.
- Mobile: deliberate demo/online choice and consent; Keystore-backed, backend-origin-bound credential storage; real-result labels; unsupported/error handling; service reset; optional metadata-feedback sharing; explicit refresh of staff-published lessons; local metadata-only history, 200-record cap and 30-day expiry checked on load/new saves.

## Run on this laptop

From the project root in PowerShell:

```powershell
.\backend\.venv\Scripts\python.exe backend/serve.py
```

The supplied Waitress server binds only `127.0.0.1:8000`, loads/verifies the trusted model, checks database/model registration, caps request bodies/headers and connections, starts four WSGI threads, and limits simultaneous inference to two per process. It is compatible with Windows. Model numerical-library thread counts are bounded before loading.

Open `http://127.0.0.1:8000/admin/` yourself. The local staff username and generated password are in **`.setup/backend-admin-credentials.txt`**. This file is ignored by Git. Do not send that file to clients or commit it; create independent customer/deployment credentials. `create_local_admin` refuses to reset an existing password or overwrite the handoff.

Staff login uses Django sessions/CSRF, not installation tokens; login attempts have shared IP limits. Model/installation/audit fields are read-only; installations can be revoked by an authorized action. Lessons can be edited and published, with revision/audit updates. Feedback can be marked reviewed without triggering training or blacklisting. Staff permissions still determine each operator's access. The generated local operator is a development superuser; add restricted staff users/groups for other operators.

`GET /health/` is process liveness only. `manage.py check_readiness` is the private database/model readiness command. The supplied server checks readiness before listening. If the model or required database guards fail, do not interpret liveness as usable protection.

## Connect the Android phone through USB

Keep the backend terminal open. In a second terminal:

```powershell
cd "C:\Users\DONI BUTT\Documents\Capstone orject for client\mobile"
& "$env:ANDROID_HOME\platform-tools\adb.exe" devices
& "$env:ANDROID_HOME\platform-tools\adb.exe" reverse tcp:8000 tcp:8000
& "$env:ANDROID_HOME\platform-tools\adb.exe" reverse tcp:8081 tcp:8081
```

`mobile/.env` is configured locally with `EXPO_PUBLIC_API_URL=http://127.0.0.1:8000`; its example contains only the public API address. Expo public variables must never contain database passwords or private keys. Local loopback HTTP is permitted by the app only in development. Deployed app connections require HTTPS.

**Rebuild once:** expo-secure-store is a new native dependency. The old installed app cannot use its Keystore module. With Metro stopped, regenerate native configuration:

```powershell
npx expo prebuild --platform android --no-install
powershell -ExecutionPolicy Bypass -File .\scripts\android.ps1 --device --no-bundler
```

In another terminal in `mobile/`, start `npm start -- --localhost`. After installing, open Check, select **Online model**, read/accept the consent sheet and deliberately check a synthetic text. Opening the app does not itself upload SMS or register an installation. The web preview intentionally does not store installation secrets or run online inference; demo checks and public lesson refresh remain available there.

Phone verification is still pending: check secure-store availability after rebuild, consent, backend timeout/error display, online result/version, metadata after restart, optional feedback, published-lesson refresh and reset. No full APK/device test is implied by TypeScript/API tests.

## Demonstrate the small staff console

1. Log into `/admin/` using the local handoff file.
2. Perform one consented online check from the rebuilt phone; its anonymous installation appears in the console. No message body appears there.
3. Mark a model result as wrong locally. Optionally select a reason and explicitly share correction metadata; only then does a staff feedback record appear.
4. Review that record and mark it reviewed. No retraining is automatic.
5. Edit/publish a lesson. In the app, tap **Refresh published lessons** to load the staff-edited version for that session. Bundled lessons remain the startup/offline fallback; no network refresh is automatic.
6. Revoke the installation. Its next protected request is denied; the phone does not silently replay the message. A deliberate later check may register a new installation.

## API and contracts

The machine-readable contract is `backend/openapi.json`, generated by `backend/scripts/build_openapi.py` without loading secrets. No trailing slash is used on the versioned API paths.

- Public `POST /api/v1/installations`: app version, consent version and explicit JSON consent boolean; returns one-time credential/expiry/installation label. Bootstrap cannot select another owner's ID.
- Authenticated `POST /api/v1/installations/me/credentials/rotate`, JSON `{}`: revoke old credentials and issue a replacement. If the response is lost, re-register rather than persisting usable tokens server-side for replay.
- Authenticated `DELETE /api/v1/installations/me`: revoke service access and delete eligible owned feedback; app-local history is separate.
- Authenticated `POST /api/v1/analyses`: `{text, cloud_analysis_consent:true}`; transient model output only, never an echo of the text. An HTTP 200 abstention has `status=unsupported` and no risk verdict. Errors/abstentions never become “low risk.”
- Public `GET /api/v1/capabilities`: bounded compatibility/mode/coverage limits.
- Public `GET /api/v1/lessons` (at most 50 published lessons), `GET /api/v1/lessons/{slug}`: reviewed content only. No cursor pagination is implemented for lessons in this first small content set.
- Authenticated `GET /api/v1/feedback/me`: own records only, cursor pages of 20.
- Authenticated `POST /api/v1/feedback/me`: explicit feedback consent, event UUID, registered model version, risk and bounded reason enum. Same owner/event/payload is idempotent; a conflicting replay is rejected.
- Authenticated `DELETE /api/v1/feedback/me/{uuid}`: ownership-scoped deletion; another owner's ID and an absent ID return the same error class.

Application quotas use fixed time windows and PostgreSQL row locks with an all-or-none transaction. Defaults: analyses 30/minute and 300/day per installation, 5,000/day globally; registration 5/minute and 20/hour per IP and 1,000/day globally; general API 120/minute per peer; staff login 5/minute and 20/hour per IP. These are service policy defaults, not measured capacity or guaranteed resistance to a hostile flood. Requests near window boundaries can consume adjacent-window allowances. Database failures deny guarded work with 503; quota rejections use 429/Retry-After. Forwarded headers are ignored by Django's limiter; any trusted proxy normalization must happen at the reviewed WSGI boundary.

## Private local configuration and migrations

- `backend/.env`: ordinary runtime role `smishguard_app`, independent application/credential/quota keys and local settings.
- `backend/.env.migrations`: `smishguard_migrator` and project database; used only for schema changes.
- `backend/.env.test`: isolated `smishguard_test` database, migration-owner privileges for the test runner.
- `backend/.env.provisioning`: preserved administrator connection, used only by deliberate provisioning. It is not loaded by the web application.

These are all ignored. The role names are not secrets; passwords and pepper values are. `provision_local.py` is repeatable with saved credentials, never resets existing-role passwords, never drops data, refuses to adopt a differently owned project database, and does not edit shared-server `pg_hba.conf` or global bindings.

For new migrations from the repository root:

```powershell
$env:SG_DATABASE_MODE="migrate"
.\backend\.venv\Scripts\python.exe backend/manage.py migrate --noinput
Remove-Item Env:SG_DATABASE_MODE
```

Do not run ordinary web requests with migration credentials. The earlier `prepare_database.py` is a historical bootstrap utility; the restricted runtime role intentionally cannot create databases. Use `provision_local.py` for the current setup.

## Recreate on another machine

Install Python 3.12 and PostgreSQL; create a normal Python 3.12 virtual environment, install `backend/requirements.txt`, and install the local `ml/` package. The selected trusted model bundle is intentionally Git-ignored: obtain the separately supplied bundle or reproduce the documented training workflow. Arbitrary downloaded joblib files are unsafe.

Copy `.env.example` to `.env`, enter a local PostgreSQL provisioning connection privately, then run `python backend/scripts/provision_local.py`. It generates independent secrets and saves the separate local role files. Run migrations in migration mode, then use runtime mode for `seed_project`, `create_local_admin` and `check_readiness`. Finally run `backend/serve.py`. The seed command does not overwrite existing staff-edited lessons or existing release metadata.

`backend/requirements-dev.txt` adds the formatter only; it is not needed to serve requests. The prepared environment on this laptop uses the bundled Python 3.12 runtime; a fresh normal venv includes pip.

## Retention and maintenance

The supplied `serve.py` runs cleanup on startup and hourly while running, using a PostgreSQL advisory lock to avoid overlapping replica jobs. It removes expired quota buckets, feedback older than 30 days, revoked installations older than 30 days, old expired/revoked credentials, inactive installations older than 120 days with no valid credential, and staff audit events older than 180 days. If the server is stopped, deletion resumes when it starts. Keep backups/security retention documented separately. The cleanup command can also be run explicitly:

```powershell
.\backend\.venv\Scripts\python.exe backend/manage.py purge_expired_metadata
```

Other WSGI entrypoints must schedule that command themselves; the hourly thread belongs to the supplied launcher, not Django AppConfig. Cleanup failures emit a generic operational error without payloads and must be monitored. Django's separate expired-session cleanup can use its standard `clearsessions` command.

## Verification and production boundary

Run isolated tests with `$env:SG_DATABASE_MODE="test"`, `python backend/manage.py test config service --keepdb --noinput`, then remove the environment override. Never point tests at the runtime database. `verify_runtime.py` separately checks actual runtime privileges, API/model flow and staff pages, rolling back synthetic changes; its sanitized report is `docs/setup/backend-verification.json`.

Before public deployment: provide real TLS termination, DEBUG=False and explicit hosts/origins; keep the backend/database private; configure an exact trusted proxy if required; review staff MFA/access restrictions; run deployment/dependency checks; measure cold/warm latency, memory, database connection budgets and overload behavior; configure backups and confirm restoration. The local university build has not undergone public penetration testing or a production load benchmark.

The supplied server accepts an optional `SG_TRUSTED_PROXY` literal IP, never `*`; Waitress then normalizes only the explicitly allowed forwarded client-IP/protocol headers from that peer. The proxy must overwrite client-supplied headers and be the only permitted production ingress. Do not expose the raw backend or reuse USB debugging as a production access path. CORS and a hidden API URL are not authentication.

Incoming/existing SMS access, WhatsApp notification screening, default-SMS blocking/quarantine, phone-number reputation, and off-device hosting remain future milestones. The benchmark model's 88.68% held-out phishing recall does not support a claim of perfect protection or validated WhatsApp/Urdu/Arabic performance.
