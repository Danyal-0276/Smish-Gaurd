"""Create only the named project database; never drop or reset existing data."""
import os
import re
from pathlib import Path
import psycopg
from psycopg import sql
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
name = os.getenv("POSTGRES_DB", "smishguard_dev")
if not re.fullmatch(r"smishguard_[a-z0-9_]+", name):
    raise SystemExit("Use an explicit smishguard_ database name.")
if not os.getenv("POSTGRES_PASSWORD"):
    raise SystemExit("Fill POSTGRES_PASSWORD in backend/.env first; credentials are never printed.")
kwargs = dict(user=os.getenv("POSTGRES_USER", "postgres"), password=os.getenv("POSTGRES_PASSWORD"),
              host=os.getenv("POSTGRES_HOST", "127.0.0.1"), port=os.getenv("POSTGRES_PORT", "5432"), connect_timeout=5)
try:
    with psycopg.connect(dbname="postgres", autocommit=True, **kwargs) as conn:
        exists = conn.execute("SELECT 1 FROM pg_database WHERE datname = %s", (name,)).fetchone()
        if not exists:
            conn.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(name)))
            print("Created project database.")
        else:
            print("Project database already exists; left its contents unchanged.")
    with psycopg.connect(dbname=name, **kwargs) as conn:
        conn.execute("SELECT 1")
        print("PostgreSQL project connection verified.")
except psycopg.Error as error:
    raise SystemExit(f"Database setup failed ({type(error).__name__}); check credentials/service.") from None
