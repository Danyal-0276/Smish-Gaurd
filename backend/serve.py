"""Bounded local Windows/Linux WSGI server. No public network binding by default."""

import ipaddress
import os

os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")


def create_server(port=8000):
    from django.conf import settings
    from django.core.wsgi import get_wsgi_application
    from django.contrib.staticfiles.handlers import StaticFilesHandler
    from waitress import create_server as make_server

    application = get_wsgi_application()
    from service.inference import get_predictor

    get_predictor()  # Fail startup if the trusted bundle cannot load.
    from django.core.management import call_command

    call_command("check_readiness", verbosity=0)
    if settings.DEBUG:
        application = StaticFilesHandler(application)
    options = dict(
        host="127.0.0.1",
        port=port,
        threads=4,
        connection_limit=100,
        backlog=64,
        channel_timeout=30,
        max_request_body_size=32768,
        max_request_header_size=16384,
        expose_tracebacks=False,
        clear_untrusted_proxy_headers=True,
        ident="SmishGuard",
        log_socket_errors=False,
    )
    proxy = os.environ.get("SG_TRUSTED_PROXY")
    if proxy:
        # No wildcard and no automatic client-header trust. The deployment's
        # proxy must overwrite headers and prevent direct backend access.
        ipaddress.ip_address(proxy)
        options.update(
            trusted_proxy=proxy,
            trusted_proxy_count=1,
            trusted_proxy_headers={"x-forwarded-for", "x-forwarded-proto"},
        )
    return make_server(application, **options)


if __name__ == "__main__":
    server = create_server()
    print("SmishGuard backend: http://127.0.0.1:8000 (loopback only)")
    print("Staff workspace: /admin/ — credentials are in the ignored local handoff file.")
    from service.maintenance import start_maintenance

    stopped, maintenance = start_maintenance()
    try:
        server.run()
    except KeyboardInterrupt:
        pass
    finally:
        stopped.set()
        maintenance.join(timeout=2)
        server.task_dispatcher.shutdown(timeout=2)
        server.close()
