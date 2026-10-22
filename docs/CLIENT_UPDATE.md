# SmishGuard — client progress update

The first backend and small staff operations console are implemented. The mobile app now has an optional online checking flow connected to the trained Python model, alongside its clearly labelled demo mode.

What the client can be shown after the Android rebuild:

- Paste a message, choose online analysis, review the privacy explanation and receive a real model assessment with warning indicators and a model version.
- Keep result metadata locally, without retaining the message text in saved app history or a server inbox.
- Optionally share correction metadata with staff through a separate consent step.
- Open the staff console to review that metadata, revoke an installation, inspect the registered model results, and edit/publish safety lessons.
- Refresh published lessons in the app and see the staff-edited content.

No phone-user signup, owner phone number, SIM identifier or contact list is required. Each installation has separate credentials; staff authentication is separate. Database credentials remain on the backend. The backend runs the trained model itself, so a paid third-party model host is not required.

Security evidence includes PostgreSQL-backed tests for installation isolation, revoked/expired credentials, strict inputs, shared concurrent quotas, unavailable-model behavior, staff access and metadata expiry. The actual restricted runtime role was checked separately. These checks are evidence for the tested scenarios, not a guarantee that the service is production-certified.

The app must be rebuilt once for the new secure credential-storage native module, then tested on the intended phone. Existing/incoming SMS scanning and optional WhatsApp notification previews are the next platform milestones; they are not working features in this delivery yet. Public hosting, production hardening/load testing, and a standalone customer APK remain separate delivery steps.

The staff panel is an operations console, not a customer-contact CRM and not a way to browse anyone's SMS. The model can make mistakes; a low-risk result does not guarantee safety.

Technical run/setup instructions: [BACKEND_GUIDE.md](BACKEND_GUIDE.md). Never include local staff/database passwords in this client update.
