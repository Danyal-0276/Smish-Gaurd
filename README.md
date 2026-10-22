# SmishGuard

An Android capstone prototype for SMS phishing detection, understandable warnings, and cybersecurity awareness.

Repository: [Danyal-0276/Smish-Gaurd](https://github.com/Danyal-0276/Smish-Gaurd). The product name is SmishGuard; the repository retains the owner's chosen spelling. Original client documents and extracted copies, local credentials, datasets, trained model binaries, and build output are excluded from Git. References to these local files require the original workspace; dataset download and model training instructions are in `ml/`.

Start with [PROJECT_BRIEF.md](PROJECT_BRIEF.md). It is the living project description and decision record to share with the documentation collaborator. The earlier working name was Weightminer.

Current Android workflow and USB installation: [SMS protection guide](docs/SMS_PROTECTION.md). Earlier implementation work is organized in [the secure backend roadmap](docs/BACKEND_ROADMAP.md): API contracts, installation isolation, database privileges, model integration, native SMS milestones, and security/load acceptance tests.

## Workspace

```text
PROJECT_BRIEF.md             Living scope, features, architecture, and decisions
mobile/                     React Native application workspace
backend/                    Django REST API workspace
ml/                         Dataset evaluation and model development workspace
docs/
  references/               Original client and university documents
    images/                 Original project-idea photograph
  analysis/                 Initial review, extracted text, and provenance manifest
  decisions/                Detailed technical decision records
```

The mobile directory contains the Expo/React Native frontend with real SMS inbox access, offline checks and consented automatic model reports. The backend contains protected APIs, local model inference, restricted PostgreSQL roles and a small staff operations console. Start with [the backend run guide](docs/BACKEND_GUIDE.md), [client update](docs/CLIENT_UPDATE.md), [local setup](docs/SETUP.md) and [frontend handoff](docs/FRONTEND_GUIDE.md). The ML directory contains the executed notebook, reports and inference package; see [ml/README.md](ml/README.md). Original supplied files remain unchanged; hashes are recorded in `docs/analysis/source-file-manifest.json`.

Selected stack: Expo development builds with React Native and TypeScript, native Android integration in Kotlin where necessary, Python Django with Django REST Framework, and PostgreSQL. Native SQLite stores encrypted local message copies, queue state and reports; Zustand stores preferences and lesson progress. Installed versions are recorded in the lockfiles and setup guide.

No end-user registration. Local-first history. An optional encrypted local profile may contain a user-confirmed phone number; it is unverified and is not uploaded. No SIM serial, IMSI or IMEI is collected. Optional cloud analysis requires consent; this differs from fully on-device processing.

## Documentation workflow

Update `PROJECT_BRIEF.md` whenever scope or a design decision changes. Preserve the original reference files. Keep research claims, performance targets, measured results, and future ideas distinct. Do not add real private SMS, credentials, database dumps, or signing keys to the repository.
