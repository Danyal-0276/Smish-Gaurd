"""Provision only SmishGuard databases/roles; preserve administrator credentials privately.

Never prints secrets, resets existing-role passwords, drops data, or edits pg_hba.
"""

import os
import secrets
from pathlib import Path
import psycopg
from psycopg import sql
from dotenv import dotenv_values, set_key

ROOT = Path(__file__).resolve().parents[1]
runtime = ROOT / ".env"
admin_file = ROOT / ".env.provisioning"
migration_file = ROOT / ".env.migrations"
test_file = ROOT / ".env.test"
config = dict(dotenv_values(runtime))
if not admin_file.exists():
    for key in ["POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_HOST", "POSTGRES_PORT"]:
        set_key(
            str(admin_file),
            key,
            config.get(key) or {"POSTGRES_HOST": "127.0.0.1", "POSTGRES_PORT": "5432"}.get(key, ""),
        )
admin = dict(dotenv_values(admin_file))
if not admin.get("POSTGRES_PASSWORD"):
    raise SystemExit("Set administrator credentials in backend/.env.provisioning first.")
migration = dict(dotenv_values(migration_file))
roles = {
    "smishguard_migrator": migration.get("POSTGRES_PASSWORD") or secrets.token_urlsafe(36),
    "smishguard_app": (
        config.get("POSTGRES_PASSWORD")
        if config.get("POSTGRES_USER") == "smishguard_app"
        else secrets.token_urlsafe(36)
    ),
}
connection = dict(
    host=admin.get("POSTGRES_HOST", "127.0.0.1"),
    port=admin.get("POSTGRES_PORT", "5432"),
    user=admin["POSTGRES_USER"],
    password=admin["POSTGRES_PASSWORD"],
    connect_timeout=5,
)

try:
    with psycopg.connect(dbname="postgres", autocommit=True, **connection) as db:
        if not db.execute("SELECT rolsuper FROM pg_roles WHERE rolname=current_user").fetchone()[0]:
            raise SystemExit("Provisioning requires a deliberate local administrator connection.")
        for name in roles:
            exists = db.execute("SELECT 1 FROM pg_roles WHERE rolname=%s", (name,)).fetchone()
            known = (
                migration.get("POSTGRES_USER") == name
                if name.endswith("migrator")
                else config.get("POSTGRES_USER") == name
            )
            if exists and not known:
                raise SystemExit(
                    "A target role already exists without this project's saved credential; no password was changed."
                )
        # Write generated credentials before creation so interrupted provisioning is resumable.
        for key, value in {
            "POSTGRES_USER": "smishguard_migrator",
            "POSTGRES_PASSWORD": roles["smishguard_migrator"],
            "POSTGRES_HOST": connection["host"],
            "POSTGRES_PORT": connection["port"],
            "POSTGRES_DB": "smishguard_dev",
        }.items():
            set_key(str(migration_file), key, value)
        for key, value in {
            "POSTGRES_USER": "smishguard_migrator",
            "POSTGRES_PASSWORD": roles["smishguard_migrator"],
            "POSTGRES_HOST": connection["host"],
            "POSTGRES_PORT": connection["port"],
            "POSTGRES_DB": "smishguard_test",
        }.items():
            set_key(str(test_file), key, value)
        for key, value in {
            "POSTGRES_USER": "smishguard_app",
            "POSTGRES_PASSWORD": roles["smishguard_app"],
            "POSTGRES_DB": "smishguard_dev",
            "DJANGO_SECRET_KEY": (
                config.get("DJANGO_SECRET_KEY")
                if config.get("DJANGO_SECRET_KEY", "").startswith("generate-") is False
                and len(config.get("DJANGO_SECRET_KEY", "")) >= 32
                else secrets.token_urlsafe(48)
            ),
            "INSTALLATION_PEPPER": config.get("INSTALLATION_PEPPER") or secrets.token_urlsafe(48),
            "QUOTA_PEPPER": config.get("QUOTA_PEPPER") or secrets.token_urlsafe(48),
        }.items():
            set_key(str(runtime), key, value)
        for name, password in roles.items():
            if not db.execute("SELECT 1 FROM pg_roles WHERE rolname=%s", (name,)).fetchone():
                db.execute(
                    sql.SQL(
                        "CREATE ROLE {} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD {}"
                    ).format(sql.Identifier(name), sql.Literal(password))
                )
            limit = 20 if name == "smishguard_app" else 8
            db.execute(
                sql.SQL("ALTER ROLE {} CONNECTION LIMIT {}").format(
                    sql.Identifier(name), sql.Literal(limit)
                )
            )
        for database in ["smishguard_dev", "smishguard_test"]:
            owner = db.execute(
                "SELECT pg_get_userbyid(datdba) FROM pg_database WHERE datname=%s", (database,)
            ).fetchone()
            if owner and owner[0] != "smishguard_migrator":
                raise SystemExit(
                    "An existing project database has a different owner; no ownership was changed."
                )
            if not owner:
                db.execute(
                    sql.SQL("CREATE DATABASE {} OWNER smishguard_migrator").format(
                        sql.Identifier(database)
                    )
                )
            db.execute(
                sql.SQL("REVOKE ALL ON DATABASE {} FROM PUBLIC").format(sql.Identifier(database))
            )
        db.execute("GRANT CONNECT ON DATABASE smishguard_dev TO smishguard_app")
    with psycopg.connect(dbname="smishguard_dev", autocommit=True, **connection) as db:
        db.execute("REVOKE ALL ON SCHEMA public FROM PUBLIC")
        db.execute("GRANT USAGE ON SCHEMA public TO smishguard_app")
        db.execute(
            "ALTER DEFAULT PRIVILEGES FOR ROLE smishguard_migrator IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO smishguard_app"
        )
        db.execute(
            "ALTER DEFAULT PRIVILEGES FOR ROLE smishguard_migrator IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO smishguard_app"
        )
        db.execute(
            "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO smishguard_app"
        )
        db.execute("GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO smishguard_app")
    print(
        "SmishGuard databases and restricted roles provisioned. Runtime credentials are in .env; migration/admin credentials are in separate ignored files. No secrets displayed."
    )
except psycopg.Error as exc:
    raise SystemExit(
        f"Provisioning failed ({type(exc).__name__}); no secret details displayed."
    ) from None
