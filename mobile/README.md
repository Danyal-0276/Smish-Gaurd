# SmishGuard mobile workspace

Current delivery: Android SMS permission setup, received-inbox conversations, incoming message handling, offline observations, encrypted local storage, a persistent backend-analysis queue and private notifications. No demo mode or seeded messages. The original shield/S logo and primary blue/white/yellow palette are preserved; report cards now lead with a bold outcome and one next action.

See [SMS protection setup and acceptance](../docs/SMS_PROTECTION.md). Restart Django after the backend update and rebuild/install the APK; a Metro refresh cannot add native SMS features. Browser/Expo Go cannot read SMS.

The local native module is in `modules/smishguard-sms/`. Generated `android/` is ignored; keep the module source and config plugins. Android WorkManager performs background jobs without a running JavaScript UI after setup. This development APK still needs Metro to display its screens.

Offline findings use local rules, not the trained classifier. Consented automatic model checks send eligible text to Django when reachable; no sender number or SIM identifier is uploaded. Pending bodies and senders use Android Keystore encryption. Reports are limited to 5,000 messages/30 days. The Reports page has a virtualized feed, completed-model risk counts and a seven-day completion chart.

Run JavaScript checks with `npm run check` and `npm run lint`. Native rules/endpoint tests: `android/gradlew.bat :smishguard-sms:testDebugUnitTest` (use the project Windows Java temporary-path setup). Full native build: `npx expo prebuild --platform android --no-install`, then `powershell -ExecutionPolicy Bypass -File scripts/android.ps1 --device --no-bundler`.

Runtime phone permission, provider, multipart, background/reboot, notification and reconnect acceptance is separate from compilation/unit-test evidence. No public hosting, release signing or store submission has been performed.

