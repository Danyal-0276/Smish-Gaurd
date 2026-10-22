"""Hourly metadata cleanup for the supplied server; advisory lock avoids replica overlap."""

import io
import logging
import threading
from django.core.management import call_command
from django.db import close_old_connections, connection


def start_maintenance():
    stopped = threading.Event()

    def run():
        while not stopped.is_set():
            locked = False
            try:
                close_old_connections()
                with connection.cursor() as cursor:
                    cursor.execute("SELECT pg_try_advisory_lock(734821901)")
                    locked = cursor.fetchone()[0]
                if locked:
                    call_command("purge_expired_metadata", stdout=io.StringIO())
            except Exception:
                logging.getLogger("smishguard.maintenance").error(
                    "Metadata maintenance could not complete; no payload details logged."
                )
            finally:
                if locked:
                    try:
                        with connection.cursor() as cursor:
                            cursor.execute("SELECT pg_advisory_unlock(734821901)")
                    except Exception:
                        pass
                connection.close()
            stopped.wait(3600)

    thread = threading.Thread(target=run, name="metadata-maintenance", daemon=True)
    thread.start()
    return stopped, thread
