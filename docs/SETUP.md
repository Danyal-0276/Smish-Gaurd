# Local development setup

## Verified tools

On 22 October 2026: Node 24.18.0, npm 11.16.0, Java/Javac 17.0.17, PostgreSQL/psql 18.4, ADB 37, Android platforms 35/36/36.1 and build-tools 35/36 were initially installed. The native build additionally installed the required Android platform 37.0 and build-tools 37 using already-accepted SDK licenses. PostgreSQL is running and accepts TCP connections. ADB starts successfully outside the restricted execution sandbox. No Android device is attached and no Android virtual device is currently configured.

The system default Python is 3.14. The project backend and trained models deliberately use the same Python 3.12 runtime, with a dedicated `backend/.venv`. Backend packages include Django 5.2 LTS, DRF, psycopg, dotenv, CORS configuration, and the local model inference runtime. No global Python or Node installation was replaced.

## Frontend preview

From `mobile/`:

```powershell
npm ci
npm run web
```

The preview runs on the displayed localhost URL, normally port 8081. The frontend uses fictional samples and a local demo engine; PostgreSQL or Django does not need to run for this preview. First launch shows the animated identity and welcome flow. A prior preview session may retain onboarding/settings metadata in that browser.

Checks:

```powershell
npm run check
npm run lint
npx expo-doctor
npm run export:web
```

## Android development build

Connect an authorized Android phone with USB debugging, or configure an emulator in Android Studio. Check `adb devices`. From `mobile/`:

```powershell
powershell -File scripts/android.ps1
```

The script scopes a short temporary path to the process to avoid a Windows Java UNIX-domain socket path-length problem observed during Gradle startup. It does not change machine-wide environment settings. A checked-in Expo config plugin sets a 240-character CMake object path limit and explicitly selects Clang's C++ driver on Windows, where an 8.3 executable alias can hide the `++` suffix. The NDK retains its normal compiler/security flags. The script then runs Expo's local Android build/install workflow. Native folders are generated from `app.config.ts`; do not hand-edit them for product features. Future native SMS support should use an Expo module/config plugin and a new development build.

The standard equivalent is `npm run android`. A development APK needs Metro (`npm start`) for JavaScript. A separately signed/internal release build is required for a standalone customer APK; `eas.json` includes a preview APK profile but no remote build has been submitted.

## Backend foundation

`backend/.env` exists locally with a generated Django secret and blank database password. Do not paste credentials in chat or commit that file. Fill `POSTGRES_USER` and `POSTGRES_PASSWORD` for your local PostgreSQL installation.

From the repository root, once credentials are ready:

```powershell
.\backend\.venv\Scripts\python.exe backend/scripts/prepare_database.py
.\backend\.venv\Scripts\python.exe backend/manage.py migrate
.\backend\.venv\Scripts\python.exe backend/manage.py check
.\backend\.venv\Scripts\python.exe backend/manage.py runserver 127.0.0.1:8000
```

The bootstrap creates only the explicitly named `smishguard_` database when missing; it never drops/resets existing databases. Default development credentials may use the locally installed PostgreSQL administrator; create a dedicated least-privilege service role before real deployment. Migrations at this stage are Django's built-in admin/auth/session tables, not a business schema.

`GET /health/` reports the foundation status without querying private data. Staff admin is available at `/admin/` after deliberately creating a local superuser. No analysis, installation-authentication, history, feedback, or learning API is implemented. DRF defaults to authenticated access for future endpoints; CORS allows only explicit local preview origins.

The backend model package is installed and the path to the existing selected bundle is configured, but no inference endpoint is wired. The frontend does not call the backend.

## Recreate the backend on another machine

Use Python 3.12, create `backend/.venv`, install `backend/requirements.txt`, then install the local package with `python -m pip install ./ml` from the root. Copy `.env.example` to `.env`, set an independent secret/password, and run the commands above. Keep the selected trusted model bundle outside public media/static storage.

SQL/PostgreSQL tooling is installed; no additional database type is needed. iOS builds require macOS and are outside the confirmed Android target. Never treat this development configuration or demo frontend as production security software.
