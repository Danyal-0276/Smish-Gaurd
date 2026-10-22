# SmishGuard

An Android capstone prototype for SMS phishing detection, understandable warnings, and cybersecurity awareness.

Repository: [Danyal-0276/Smish-Gaurd](https://github.com/Danyal-0276/Smish-Gaurd). The product name is SmishGuard; the repository retains the owner's chosen spelling. Original client documents and extracted copies, local credentials, datasets, trained model binaries, and build output are excluded from Git. References to these local files require the original workspace; dataset download and model training instructions are in `ml/`.

Start with [PROJECT_BRIEF.md](PROJECT_BRIEF.md). It is the living project description and decision record to share with the documentation collaborator. The earlier working name was Weightminer.

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

The mobile directory now contains the runnable Expo/React Native demo frontend. The backend contains a Django foundation; business APIs are not implemented. Start with [local setup](docs/SETUP.md) and [frontend handoff](docs/FRONTEND_GUIDE.md). The ML directory contains the dataset, executed notebook, reports, and local-inference package; see [ml/README.md](ml/README.md). The original six supplied files are unchanged; SHA-256 hashes are recorded in `docs/analysis/source-file-manifest.json`.

Selected stack: Expo development builds with React Native and TypeScript, native Android integration in Kotlin where necessary, Python Django with Django REST Framework, and PostgreSQL. SQLite stores local app metadata. Installed versions are recorded in the lockfiles and setup guide.

No end-user registration. Local-first history. No collection of the owner's phone number, SIM serial, IMSI, or IMEI. Optional cloud analysis requires consent; this differs from fully on-device processing.

## Documentation workflow

Update `PROJECT_BRIEF.md` whenever scope or a design decision changes. Preserve the original reference files. Keep research claims, performance targets, measured results, and future ideas distinct. Do not add real private SMS, credentials, database dumps, or signing keys to the repository.
