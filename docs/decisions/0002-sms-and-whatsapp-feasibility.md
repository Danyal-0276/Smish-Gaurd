# SMS inbox and WhatsApp access: feasibility and scope

Reviewed 22 October 2026. This records a product discussion and platform research, not implemented access or a commitment to every feature. SmishGuard currently blocks SMS-reading permissions and has no native inbox receiver or notification listener. Existing model output is phishing risk; non-phishing training labels combine ham and promotional spam. The model does not establish a sender's identity or global phone-number reputation.

## Existing SMS on the phone

Feasible on an Android phone where READ_SMS is actually granted and applicable OS access restrictions permit the query. A native Kotlin/Expo module can query the system Telephony SMS content provider, returning bounded pages containing local message ID, thread ID, sender address, timestamp, direction/type and text. We can group by thread, assess messages individually, and show a summary such as “6 messages, 2 flagged.” A flagged message does not prove every message in the conversation or the sender is fraudulent.

READ_SMS and RECEIVE_SMS are hard-restricted permissions: the installer must allowlist them, and the user grant must succeed. Sideloading an APK does not automatically make either permission available. Prove the intended install method and actual demonstration phone before promising inbox access. Becoming a default SMS handler has separate obligations and is not automatically necessary for every permitted read-only demonstration; do not adopt that role just to make an untested permission problem disappear.

Source text can be queried again from the system provider while permission remains available. This differs from copying the inbox into SmishGuard's SQLite database. Keep persistent app records metadata-only; re-query on deliberate user action and handle revoked permissions/deleted messages without silently retaining bodies. Sender labels/thread identifiers, if retained, stay local and require the revised local schema/privacy disclosure.

Proposed optional flow: user selects “Check existing SMS,” sees the access explanation, grants permission, chooses messages/date range, sees whether local or online assessment will be used, and confirms any text transmission. Use a bounded cancellable queue with real completion counts and quota-aware retries, not an unbounded upload of the whole inbox. The server receives selected text for transient classification, not an inbox archive. Reading SMS permission is not permission to send all messages to Django.

The provider is for SMS. Do not assume that RCS messages displayed in Google Messages, MMS attachments, archived proprietary chat data, or WhatsApp conversations are available through it. Protected verification-message access can also be delayed/filtered by Android.

## Historical versus incoming SMS

Keep the source mode explicit: `inbox_scan` for an intentional snapshot/query and `incoming_sms` for a received native event. Track local provider IDs/timestamps and scanned metadata; reconcile the same message observed through both paths so it is not counted twice. Use a per-import boundary/high-water mark and event reconciliation rather than assuming a timestamp or text hash uniquely identifies every message. Multipart reception must be assembled before assessment; equal text from the same sender can still be two different legitimate messages. No globally stored message fingerprint is needed.

“Unread” is a read-state flag, not proof a message arrived after monitoring began. Existing unread messages remain historical messages in our classification. A thread can contain both older messages and new incoming messages.

Incoming reception uses RECEIVE_SMS with the appropriate platform broadcast and native processing. Alerts are possible when the permission/OS/background/notification conditions hold, but cannot guarantee arrival before the normal SMS app is opened. Android 17 documents expanded OTP protection: affected verification messages can be withheld from non-exempt listeners/provider queries for three hours. The actual phone and app target determine observed behavior; do not advertise universal immediate screening.

## WhatsApp: accessible notifications, not a second inbox

A normal Android app has no general permission to query WhatsApp's private chat database. User consent in SmishGuard does not grant access to another app's private sandbox. Official business messaging APIs are scoped to business messaging integrations; they are not a general API for reading every personal WhatsApp conversation on an arbitrary user's phone.

Two realistic paths:

1. **Copy/share selected text:** the user intentionally provides WhatsApp text to SmishGuard. Copy/paste is the reliable fallback if a WhatsApp sharing UI does not expose a compatible text-share action. Apply cloud consent and clearly state that SMS-benchmark performance does not validate WhatsApp scam detection.
2. **Optional notification-preview screening:** with separately enabled Android Notification Access, a native NotificationListenerService may receive text WhatsApp exposes in posted notifications. Filter allowed WhatsApp packages immediately; do not retain/process other apps' notifications or SmishGuard's own alerts. Treat notification updates/group summaries as updates to avoid repeated warnings. Handle hidden/redacted/truncated text and absent numbers as unavailable data, not low risk.

Notification access is broad at the Android permission boundary even when our code filters one app; explain that honestly before enabling it. It is separate from permission to post SmishGuard notifications and separate from cloud processing consent. Modern Android can redact sensitive notification content, including OTPs. App privacy settings, disabled notifications, certain muted chats, foreground conversations, missing previews, and OEM behavior can prevent useful text from being available. A notification may contain only a display name, not the actual phone number.

An illustrative warning is “Possible phishing in a WhatsApp notification—review before acting.” Do not say “this number is a scammer” based on a text classifier. A warning can appear after notification processing, but there is no guaranteed interception point before the user opens WhatsApp or taps a message. App-launch monitoring would not reveal chat content or solve this timing issue. Do not build a WhatsApp blocker or screen-scraping dependency into the baseline. Accessibility/overlay automation is not a reliable general chat API and adds sensitive access and policy/UX risks.

No historical WhatsApp scan follows from notification access; active notifications are not a complete archive. A deliberate user-exported text file could be a later import feature with its own parser, limits, consent and sensitive-data handling—not automatic chat access. Photos, audio and attachments need separately scoped OCR/media models and evaluation, not the current SMS classifier.

## External services and evaluation

Existing/incoming SMS access and notification callbacks use native Android APIs, not paid third-party services. Our Django backend can run the existing model. Inference in Django is online processing; complete offline ML requires an additional validated on-device model/runtime integration.

Number-reputation services or external URL-reputation feeds are optional separate integrations. Assess licensing, cost, regional coverage, retention and disclosure of submitted identifiers before adopting one. They neither unlock WhatsApp chats nor guarantee a number is malicious. No provider has been selected. Arbitrary URL fetching remains outside the baseline.

For an eventual Google Play release, SMS permissions require separate policy eligibility/review. Google documents an anti-smishing exception with evidence requirements; a capstone's purpose alone does not establish approval. Keep the current university APK target distinct from a future store launch.

Recommended order: prove READ_SMS/RECEIVE_SMS on the actual phone; add explicit selected existing-SMS scans; implement incoming-SMS warnings and reconciliation; add copy/share intake for other messaging sources; consider WhatsApp notification previews as a labelled experimental extension only after consent, privacy and coverage tests. Update the backend roadmap/schema before implementation: inbox scanning expands the earlier no-inbox-import baseline.

## Primary sources

- [SMS provider](https://developer.android.com/reference/android/provider/Telephony.Sms)
- [SMS message/thread fields](https://developer.android.com/reference/android/provider/Telephony.TextBasedSmsColumns)
- [READ_SMS and RECEIVE_SMS restrictions](https://developer.android.com/reference/android/Manifest.permission#READ_SMS)
- [Incoming SMS broadcasts](https://developer.android.com/reference/android/provider/Telephony.Sms.Intents)
- [Android 17 verification-message protection](https://developer.android.com/about/versions/17/behavior-changes-all)
- [NotificationListenerService](https://developer.android.com/reference/android/service/notification/NotificationListenerService)
- [Android 15 sensitive-notification protections](https://developer.android.com/about/versions/15/behavior-changes-all)
- [Android application sandbox](https://developer.android.com/privacy-and-security/security-tips)
- [WhatsApp Business Platform](https://whatsappbusiness.com/products/business-platform/)
- [Google Play SMS permission exceptions](https://support.google.com/googleplay/android-developer/answer/10208820)
