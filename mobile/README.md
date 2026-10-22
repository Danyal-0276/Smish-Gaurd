# SmishGuard mobile workspace

React Native TypeScript frontend using Expo SDK 58 development builds, Expo Router, Reanimated, Zustand, TanStack Query, SQLite, Manrope, Lucide, and an original SVG identity. Native Android folders are generated from `app.config.ts`.

Source of scope and decisions: [project brief](../PROJECT_BRIEF.md).

Run the frontend preview from this directory with `npm run web`. It uses explicitly labelled mock data and does not require Django or PostgreSQL. For an Android development build, connect a phone or configure an emulator, then run `powershell -File scripts/android.ps1`. That script also handles the short Java temporary-path workaround needed on this Windows host.

Implemented: animated startup, onboarding, Home, Check, Result, Activity, Learn, quizzes, Settings and privacy/protection states. Demo mode stays local. Optional online mode asks for consent and uses the protected Django model API; SecureStore holds an origin-bound installation credential. Metadata feedback requires separate consent; published lessons refresh only on request. Native history uses SQLite, web uses localStorage, and saved records exclude message text/domains. History is capped at 200 with 30-day expiry checked on load/save. Live SMS and WhatsApp access remain future work.

Rebuild once after this backend integration for `expo-secure-store`. Set the public API URL from `.env.example`, reverse USB port 8000, and follow [the backend/phone guide](../docs/BACKEND_GUIDE.md). Online model checks require native secure storage and intentionally do not run in the web preview.

Checks: `npm run check`, `npm run lint`, `npx expo-doctor`, `npm run export:web`. See [frontend handoff](../docs/FRONTEND_GUIDE.md) and [setup guide](../docs/SETUP.md) for architecture, feature boundaries, and dependency audit findings.

Editable brand files are in `assets/brand/`; regenerate the PNG icon/splash assets using `node scripts/generate-brand.cjs`. No EAS cloud build, store release, or external hosting has been submitted.
