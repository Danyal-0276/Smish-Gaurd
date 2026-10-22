# Local development setup

> **23 October 2026 update:** Android SMS inbox access, offline rules, encrypted pending checks, background model sync and private notifications are now implemented in source. The demo/online selector and sample data have been removed. Follow [the current SMS protection guide](SMS_PROTECTION.md); older implementation-status sections below are historical. Real-phone acceptance remains required.

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

The script scopes a short temporary path to the process to avoid a Windows Java UNIX-domain socket path-length problem observed during Gradle startup. It does not change machine-wide environment settings. A checked-in Expo config plugin sets a 240-character CMake object path limit, stages native builds under the ignored `.setup/cxx/` directory, and explicitly selects Clang's C++ driver on Windows, where an 8.3 executable alias can hide the `++` suffix. The NDK retains its normal compiler/security flags. The script then runs Expo's local Android build/install workflow. Native folders are generated from `app.config.ts`; do not hand-edit them for product features. Future native SMS support should use an Expo module/config plugin and a new development build.

The standard equivalent is `npm run android`. A development APK needs Metro (`npm start`) for JavaScript. A separately signed/internal release build is required for a standalone customer APK; `eas.json` includes a preview APK profile but no remote build has been submitted.

### Windows Ninja path-length fix

The SDK's CMake 3.22.1 includes Ninja 1.10.2. It failed while building `react_codegen_rngesturehandler_codegen` with `Filename longer than 260 characters`, despite Windows long-path support already being enabled. The Android helper now provisions official Ninja 1.13.2 under `.setup/tools/`, verifies pinned archive and executable SHA-256 hashes, and the Expo config plugin selects it through `CMAKE_MAKE_PROGRAM`. The installed Android SDK is not modified. This follows the [Reanimated Windows guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/building-on-windows/), which recommends Ninja 1.12 or newer. Run `scripts/setup-ninja.ps1` before direct Gradle builds; `scripts/android.ps1` does this automatically. No dependency downgrade or global cache deletion is needed.

## Backend and staff console

The protected API, restricted PostgreSQL roles, trusted local model and staff console are implemented. The actual runtime role is `smishguard_app`; administrator and migration credentials are stored in separate ignored files. Current run, migration, phone and deployment instructions are in [BACKEND_GUIDE.md](BACKEND_GUIDE.md); [CLIENT_UPDATE.md](CLIENT_UPDATE.md) is the client-facing progress summary.

From the repository root:

```powershell
.\backend\.venv\Scripts\python.exe backend/serve.py
```

Staff console: `http://127.0.0.1:8000/admin/`. Local staff credentials are in the ignored `.setup/backend-admin-credentials.txt`; do not paste or commit them. For a phone, reverse USB ports 8000 and 8081, restart Metro after setting the public API URL, and rebuild once for the SecureStore native module. See the backend guide for exact commands.

Tests now use a dedicated PostgreSQL test database; do not run migrations with the restricted runtime role. Existing/incoming SMS and WhatsApp screening remain future work. No public hosting or app-store release was performed.
