# SmishGuard — client progress update

Updated 23 October 2026.

The Android implementation now reads real received SMS after permission, groups conversations by sender, gives immediate offline observations and queues eligible text for automatic checks by the trained backend model. It also handles incoming SMS broadcasts and private warning notifications. Demo messages and the demo/online mode selector have been removed.

Reports show a bold assessment, one recommended action and expandable reasons. The dashboard counts completed model assessments and charts report activity over seven days. Counts come from local reports; the app does not claim every flagged message is a confirmed scam or that low-risk messages are guaranteed safe.

SMS bodies and sender names are encrypted in local app storage, with a 30-day retention period and 5,000-message limit. Automatic uploads require setup consent and can be paused. Detected OTP/code messages remain local. The backend receives text for transient analysis without receiving sender numbers, contacts or SIM identifiers. There is no end-user account or profile.

The Django staff workspace remains a small operations console: anonymous installation management/revocation, model metadata, safety lesson editing/publishing and existing consented feedback records. It does not expose anyone’s SMS inbox. Database credentials stay on the server and each installation authenticates separately.

The new native code must be installed in a rebuilt APK. The development APK builds successfully; six native tests, fourteen JavaScript tests and twenty-three backend tests passed. These checks are separate from real-phone acceptance. Permission approval, inbox reconciliation, multipart/new SMS, offline/reconnect, notifications and background behavior must be checked on the demonstration phone before claiming verified automatic protection.

The model remains English-oriented and can make mistakes. Offline checks are rule observations, not trained-model inference. A laptop/USB backend is not reachable from arbitrary phones over the internet. Public HTTPS deployment, a release-signed standalone APK and production validation remain separate steps.

Technical details and installation: [SMS_PROTECTION.md](SMS_PROTECTION.md). Never share local staff/database credentials with the documentation handoff.


An optional My profile page saves a name and number encrypted on the phone. Own-number permission can fill an available SIM/carrier number, with manual entry as fallback. It stays labelled unverified. Profiles are not uploaded or visible to staff; sender authenticity/reputation and verified OTP ownership are future features.
