# SmishGuard frontend handoff

The application is a React Native TypeScript project built with Expo SDK 58 and Expo Router. It uses native development builds so a future Kotlin SMS module is possible. Expo Go is not the delivery workflow. No paid Expo service or account is required to run the local web preview or use local Android builds.

## Design

The current direction takes its cues from the owner's Trifid Media screenshots: white space, electric blue (`#0064EF`), near-black, and restrained yellow (`#FFD600`). Manrope typography and outlined cards keep the mobile interface readable. The original hollow shield and message-thread S paths are preserved; only their colors changed. Editable vectors and generated app/adaptive/splash icons are in `mobile/assets/brand/`; the in-app vector lives in `src/components/brand.tsx`. Regenerate native assets with `node scripts/generate-brand.cjs` from `mobile/`.

The custom floating bottom dock uses a black capsule and one blue sliding selection. It keeps all five labelled destinations, uses the installed Expo Router 58 tab-emitter API, includes selected states for assistive technology, and hides when the native keyboard opens. Screen content reserves clearance for the dock and device bottom inset. Motion consists of short upward reveals, tab fades, a moving selection, and a finite simulated-check progress line. Both OS and app reduced-motion settings disable the new movement. No looping decoration or extra animation library was introduced.

Copy now prioritizes a clear action per screen. Home says “Think before you tap”; Check explains the input; History describes local records; Learn groups four short lessons; Settings uses direct preference labels. Demo limits and privacy behavior remain visible. The reference screenshots guide layout and colors; website photography, logos, commercial claims, and agency copy are not imported into the app.

The 22 October UI refresh was checked without launching the app, as requested. Earlier screenshots in `docs/previews/` show the superseded green design and must not be used as evidence of the current UI. Inspect the refreshed dock, keyboard behavior, transitions, and native splash on the phone before accepting visual QA. Native icon/splash colors require regeneration/rebuilding of the Android project; JavaScript-only views can refresh through Metro.

The native splash uses Expo SplashScreen, followed by a short Reanimated brand entrance. Fonts and local state hydrate before app content appears. System reduced-motion is respected by animation builders; the preference also disables screen entrances/transitions. The standalone Android splash must be inspected in a built APK: web preview does not prove native launch behavior.

Quiz explanations now use the same short, reduced-motion-aware reveal when an answer is checked; selected option letters use white on blue for text contrast. The backend roadmap schedules further motion around actual request/permission states rather than adding permanent animated decoration.

## Implemented screens and interactions

- Welcome/onboarding, no account or sign-in.
- Home with explicitly labelled demo status, actual local counts, recent records, and safety guidance.
- Manual message input with empty/length guards, clear, explicit clipboard paste, and three sample scenarios.
- Simulated async checking, progress/loading state, and structured results.
- High/review/low result views, observed pattern explanations, inert domain text, next steps, local corrections, and delete confirmation.
- History search by displayed metadata/date, risk filters, clear confirmation, and empty states.
- Four authored lessons with quizzes, wrong-answer retry, and persisted completion progress.
- Settings for haptics, reduced motion, and history; restore sample data; introduction replay.
- Privacy and protection-status screens explaining unavailable SMS/notification integration honestly.
- Missing-route and missing/deleted-result states.

There are no live model predictions, SMS-reading permissions, website fetches, installation credentials, or backend calls in the frontend. The demo engine is explicitly labelled and should never be promoted as a detector. Scanning an entered message does not send it anywhere. The Django service and trained model are separate later integration work.

## Structure

`src/app/` contains route entries and layouts. `components/` contains reusable controls, layout, and identity. `theme/` contains colors/type tokens. `types/` defines domain contracts. `features/scan/` owns the deterministic UI demo engine. `services/scan-repository.ts` is the asynchronous adapter boundary to replace later. `store/` contains Zustand preferences/history state. `data/` holds fictional sample messages and authored learning material.

TanStack Query handles async scan mutations and future server-data lifecycle. Reanimated provides screen/brand entrances; Lucide supplies consistent functional icons; react-native-svg renders the original mark. SQLite stores metadata on native platforms. The web preview uses localStorage instead; it is not an Android database test.

## Storage and privacy

Only metadata, preferences, corrections, and lesson progress are persisted. Entered message bodies, domains, and result explanations remain in session memory. After reload, a retained record explains that message details are unavailable and offers re-entry. Fictional built-in sample texts remain part of the application's source/demo fixtures.

Turning history off affects future records; it does not silently delete existing records. Clear/delete actions remove app-held records, not system SMS. History is capped at 200 records. A timed retention policy, encryption-at-rest, biometric lock, and production installation credentials have not been implemented. Android app backup is disabled in the generated configuration; no non-resettable device identifiers are requested.

## Validation and delivery boundaries

TypeScript, lint, unit tests, Expo Doctor, production web export, and interactive browser checks are used. Browser testing covers onboarding, simulated checking, result metadata persistence without message text, quiz retry/progress, history filtering, and confirmation cancellation. Native Kotlin reception, Android SQLite behavior, native haptics, and release splash appearance still require a real Android build/device test.

Dependency audit currently reports high-severity transitive advisory chains originating in `braces` and `node-forge` used by the Expo/Metro development toolchain. The registry's current latest versions remain affected; npm proposes an incompatible Expo downgrade. No forced downgrade or invented patched version was applied. See `docs/setup/mobile-audit.json`; recheck upstream before distributing or exposing development tooling. The local preview binds to localhost.

See [SETUP.md](SETUP.md) and the mobile README for commands. EAS profiles are prepared but no cloud build, hosting, store publication, or external account setup has been performed.
