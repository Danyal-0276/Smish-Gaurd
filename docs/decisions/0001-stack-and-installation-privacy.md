# Stack and installation privacy decision

Date: 22 October 2026. Status: selected design direction; implementation pending.

Use React Native/TypeScript with required Kotlin Android integration, Django/DRF, PostgreSQL, and local SQLite metadata. Use one backend database. These choices align with the developer's experience and the data model.

Users do not create accounts. Online calls authenticate a pseudonymous installation using an independently issued random secret, stored securely on the phone and verified by its digest on the server. No phone number or SIM/hardware identity is required. An installation ID without a secret is not authentication.

Normal scan bodies are processed transiently and local history does not contain raw messages by default. No cloud inbox or cross-installation query is exposed. Any optional persistent private record is assigned server-side ownership and checked across every operation. Staff administration has separate authentication.

Cloud processing requires explicit consent; this architecture does not claim fully on-device inference or complete anonymity. Token theft, automated registration, rooted-device access, backup behavior, and operational metadata remain part of the threat model. Revocation, request throttles, secure storage, minimal retention, and isolation tests must be implemented before claims of protection.

See [the living brief](../../PROJECT_BRIEF.md) for detailed behavior, features, constraints, and primary sources. Record future decisions in new files and update the brief and change log together.
