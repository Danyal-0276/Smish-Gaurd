# SmishGuard SMS protection — 23 October 2026

This is the current Android implementation and supersedes the older demo/online-mode descriptions. The app now uses real received SMS, local offline rules and a durable queue for backend model checks. No sample messages or mode selector are shipped. Device acceptance checks below remain necessary; a successful build does not prove Android granted SMS access.

## Run the updated build over USB

Use one Metro server. The Windows `start:usb` helper binds IPv4 loopback and advertises `127.0.0.1:8081`; it prevents a second server on the same port and avoids stale tunnel URLs in lazy bundle requests. If the development client remembers an old Wi-Fi/tunnel URL, run `npm run open:usb` from `mobile/` with Metro running. This explicitly opens the app at `http://127.0.0.1:8081` using the SDK development-client link; it does not grant permissions.

Restart the backend after updating these files. The supplied Waitress server does not hot reload:

```powershell
# Project root, terminal 1. Stop the old backend with Ctrl+C first.
.\backend\.venv\Scripts\python.exe backend/serve.py
```

```powershell
# Terminal 2
cd mobile
npm run start:usb -- --clear
```

```powershell
# Terminal 3, project root, phone connected with USB debugging enabled
adb reverse tcp:8000 tcp:8000
adb reverse tcp:8081 tcp:8081
adb install -r .\mobile\android\app\build\outputs\apk\debug\app-debug.apk
```

The last command installs the already-built development APK without granting permissions or opening it. Open SmishGuard yourself, select Get started, read the setup disclosure and select Allow SMS & start protection. Android then requests SMS access and notifications. The automatic model reports setting controls consent for queued text uploads; it is not a demo/model selector. Existing installations migrate away from sample history and repeat onboarding.

To rebuild from source instead of installing the existing APK:

```powershell
cd mobile
npx expo prebuild --platform android --no-install
powershell -ExecutionPolicy Bypass -File .\scripts\android.ps1 --device --no-bundler
```

The source build command also installs/opens the development client. Metro must be running. Generated native files remain ignored; the local Expo module and config plugins are authoritative. An old APK, browser preview or Expo Go cannot run the SMS module.

`mobile/.env` currently points to `http://127.0.0.1:8000`. Internet connectivity alone cannot reach this laptop’s loopback backend without USB forwarding. Production needs a reachable HTTPS backend URL and an APK configured for it. No public deployment has been performed.

## User experience

1. Explain SMS reading and automatic model analysis before asking for Android permissions. Denial does not crash the app; settings and setup remain accessible. Contacts and SIM identifiers are not requested; optional own-number permission is separate in My profile.
2. Import the newest 200 received inbox messages. Conversations group by sender, while assessments belong to individual messages. Load older messages in pages of 200, up to the 5,000-message local cap. Sender grouping is not number-reputation checking.
3. Immediately generate genuine offline rule observations. These are keyword/link checks, not the trained model, and are labelled accordingly. Lack of matching rules does not establish safety.
4. Queue eligible text for the trained backend model when automatic reports are enabled. Android WorkManager waits for connectivity, retries failures with backoff, and respects server Retry-After limits. No server failure creates a simulated verdict. New arrivals and pasted messages take priority over backlog.
5. Retain offline findings alongside the model report. Unsupported text keeps its offline findings and receives no model verdict. High-risk incoming offline findings trigger local warnings; completed model batches update one private summary notification, including high-risk counts. Notification content contains no sender or message body.
6. Present a bold result, one recommended action, message preview and expandable reasons. Risk counts include completed model reports only. A seven-day chart counts completed model reports retained on this phone. No fabricated accuracy, saved-money, blocked-attacks or protection-percentage metrics.

## Optional device profile

Settings → My profile saves an optional display name and international-format phone number, encrypted under Android Keystore in private preferences. This profile is local-only and is never attached to model requests or exposed to staff. Deleting the profile removes that ciphertext without deleting reports.

“Use this phone’s number” requests READ_PHONE_NUMBERS only when tapped. Android 13+ uses the default SMS subscription’s `SubscriptionManager.getPhoneNumber`; supported older versions use the compatibility API. The carrier may return nothing, a number in a different format, or an outdated number. The user reviews/edits it before saving; manual entry is always available. The app does not enumerate SIMs, request READ_PHONE_STATE, or collect SIM serials/IMSI/IMEI.

Every saved number is labelled **unverified**. Number availability and accuracy are not guaranteed; Android explicitly requires [additional verification for security-sensitive use](https://developer.android.com/reference/android/telephony/SubscriptionManager#getPhoneNumber(int)). Future ownership verification would require a separate consented OTP challenge service with expiry, attempt/rate limits and anti-enumeration controls. It would prove possession at that time, not authenticate the sender of arbitrary SMS. Sender reputation/spoofing checks are separate features; this version does not claim them.

## Native implementation details

`mobile/modules/smishguard-sms/` is an autolinked local Expo/Kotlin module. It has a received-SMS provider reader, protected SMS_RECEIVED broadcast receiver, SQLite repository, Android Keystore encryption, private notifications and WorkManager tasks. It runs independently of JavaScript/Metro for incoming/offline/background work once configured. Debug UI still requires Metro because this is a development APK.

The inbox reader requests only `_id`, `address`, `body` and `date`. Initial/older pages use date/ID keyset pagination; subsequent refreshes track new provider IDs. Repeated queries do not silently reload deleted or expired history. Broadcast multipart text is joined and reconciled with provider rows using sender, content and a narrow timestamp window. Initial import boundaries distinguish existing SMS from arrivals after protection was enabled; unread status is not used as an arrival detector.

WorkManager performs an unconstrained periodic inbox reconciliation and a network-constrained model task, with one-off sync requests after refresh/arrival. Periodic work has Android’s 15-minute minimum and may be deferred. The receiver provides prompt offline processing when Android delivers the broadcast. Force-stop, battery restrictions, denied permissions, locked/protected OTP delivery and OS behavior can delay or prevent work. Reopening the app reconciles its inbox. There is no promise of immediate or uninterrupted protection.

## Privacy and security

- Sender and SMS-body columns are encrypted with AES-GCM and per-field/record authenticated data. The AES key lives in Android Keystore. Credentials are encrypted separately and bound to the configured endpoint. Message text never enters persisted Zustand state, WorkManager input data, logs or the server database.
- Native SQLite holds local ciphertext, offline findings, model reports, timestamps and queue states. Text crosses the JS bridge only for requested report pages. A bounded, virtualized report list avoids rendering the whole inbox at once. Local copies expire 30 days after import and storage is capped at 5,000 messages. Cleanup runs during app/background activity; physical wiping while Android prevents execution is not promised.
- Backup and device-transfer exclusions cover private databases, files and shared preferences. `allowBackup` is false. No plaintext fallback is used if encryption fails.
- Detected OTP, one-time/security/verification code messages are local-only. Detection is a conservative English-text heuristic, not a guarantee that every secret or language is recognized. Any uploaded message may itself contain personal information; the setup disclosure explains automatic transmission.
- Each model request contains only text and cloud consent, plus an installation bearer header. Sender addresses, provider IDs, thread hashes and SIM details are never sent. HTTPS is required except debug builds targeting loopback/emulator HTTP. Redirects, URL credentials, queries and custom paths are rejected; responses are bounded.
- The backend retains its strict validation, restricted PostgreSQL runtime role, ownership checks, shared quotas, protected staff console and transient inference. Automatic SMS consent is recorded as version `2026-10-23`; the previous manual consent version remains accepted for compatibility. Backend `automatic_sms=false` means the server cannot read a phone inbox itself; `android_client_sms_queue=true` describes client queue support.
- Expired/revoked credentials pause automatic uploads and require setup again. They do not silently re-enroll the installation. Deleted queued rows cannot receive later reports; requests already in transit cannot be recalled. Stopping protection disables collection and uploads; revoking READ_SMS also prevents further inbox reading/model submission.
- Clear/delete controls affect app copies only. Imported provider IDs have deletion tombstones for 30 days. The incremental inbox watermark also avoids automatically restoring previously processed SMS. The original messaging app is never modified.

## Phone acceptance checks

Use the intended demonstration phone and do not share screenshots containing private SMS:

- Fresh/rebuilt setup: grant READ_SMS, RECEIVE_SMS and notifications; inspect the real inbox and sender grouping. Deny permissions on another pass and confirm a useful setup error.
- Offline: disconnect the backend or disable network, import messages and confirm offline reports/queued state survive closing and reopening the app.
- Reconnect: restore network, backend and USB forwarding; verify pending counts fall and MODEL reports appear without selecting a mode. A large backlog is deliberately limited by the backend’s current 300 analyses/installation/day policy.
- Incoming/multipart: send benign and synthetic phishing examples from another phone. Confirm one logical report, correct source label, private warning and provider reconciliation. Verify actual protected-code restrictions on the phone’s Android version.
- Limits/errors: unavailable backend, unsupported input, revoked credential, server throttling, pause/resume, and notification denial must retain honest offline results rather than claim successful model analysis.
- Deletion: delete a queued report, refresh/restart and verify it stays gone while original SMS remains. Stop protection/revoke access and confirm no new collection/uploads.
- Background/reboot: check normal background, reboot, force-stop/reopen and battery restrictions. These are device acceptance scenarios, not yet evidence of uninterrupted operation.

## Sources

- [Expo local native code](https://docs.expo.dev/workflow/customizing/) and [module registration](https://docs.expo.dev/modules/module-config/).
- [Android SMS broadcast API](https://developer.android.com/reference/android/provider/Telephony.Sms.Intents).
- [Android SMS permission restrictions](https://developer.android.com/reference/android/Manifest.permission#READ_SMS): SMS permissions require installer allowlisting as well as runtime approval. The app cannot bypass this. If permission is unavailable, inspect the installer/Android permission settings; do not add default-SMS behavior unless implementing a complete messaging handler.
- [WorkManager persistent work](https://developer.android.com/develop/background-work/background-tasks/persistent-work).

Public Play distribution, full on-device trained-model inference, WhatsApp access, a release-signed standalone APK, push services and production hosting are not part of this implementation.

## Build and automated verification

The final Android 0.2.0 arm64-v8a development APK built successfully. Six native policy/rule/profile tests, fourteen JavaScript contract/transport tests and twenty-three backend regression tests passed. TypeScript, ESLint and diff whitespace checks passed. The packaged manifest contains READ_SMS, RECEIVE_SMS, POST_NOTIFICATIONS and READ_PHONE_NUMBERS. Evidence: [setup/sms-verification.json](setup/sms-verification.json). No app UI was opened and no private SMS was read during verification; the phone acceptance checks above remain pending.
