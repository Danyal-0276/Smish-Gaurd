"""Explicit local/deployment settings; phone clients never receive these secrets."""

import os
from pathlib import Path
from django.core.exceptions import ImproperlyConfigured
from dotenv import dotenv_values

BASE_DIR = Path(__file__).resolve().parents[2]
MODE = os.environ.get("SG_DATABASE_MODE", "runtime")
if MODE not in {"runtime", "migrate", "test"}:
    raise ImproperlyConfigured("Invalid SG_DATABASE_MODE")
CONFIG = dict(dotenv_values(BASE_DIR / ".env"))
if MODE != "runtime":
    CONFIG.update(
        dotenv_values(BASE_DIR / (".env.migrations" if MODE == "migrate" else ".env.test"))
    )


def env(name, default=""):
    return os.environ.get(name, CONFIG.get(name, default))


def positive(name, default, maximum=100000):
    number = int(env(name, str(default)))
    if not 1 <= number <= maximum:
        raise ImproperlyConfigured(f"Invalid {name}")
    return number


SECRET_KEY = env("DJANGO_SECRET_KEY")
INSTALLATION_PEPPER = env("INSTALLATION_PEPPER")
QUOTA_PEPPER = env("QUOTA_PEPPER")
if any(len(v) < 32 for v in [SECRET_KEY, INSTALLATION_PEPPER, QUOTA_PEPPER]):
    raise ImproperlyConfigured(
        "Set independent secret/installation/quota keys of at least 32 characters."
    )
DEBUG = env("DJANGO_DEBUG", "False").lower() == "true"
ALLOWED_HOSTS = env("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
if not DEBUG and env("POSTGRES_USER") == "postgres":
    raise ImproperlyConfigured("Production must not use the PostgreSQL superuser.")
INSTALLED_APPS = [
    "service.apps.SmishGuardAdminConfig",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "service.apps.ServiceConfig",
]
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "service.middleware.ApiBoundaryMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]
ROOT_URLCONF = "config.urls"
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": env("POSTGRES_DB", "smishguard_dev"),
        "USER": env("POSTGRES_USER"),
        "PASSWORD": env("POSTGRES_PASSWORD"),
        "HOST": env("POSTGRES_HOST", "127.0.0.1"),
        "PORT": env("POSTGRES_PORT", "5432"),
        "CONN_MAX_AGE": 60,
        "CONN_HEALTH_CHECKS": True,
        "OPTIONS": {
            "connect_timeout": 5,
            "options": "-c statement_timeout=5000 -c lock_timeout=3000",
            "sslmode": env("POSTGRES_SSLMODE", "prefer" if DEBUG else "verify-full"),
        },
        "TEST": {"NAME": "smishguard_test"},
    }
}
if env("POSTGRES_SSLROOTCERT"):
    DATABASES["default"]["OPTIONS"]["sslrootcert"] = env("POSTGRES_SSLROOTCERT")
if (
    not DEBUG
    and DATABASES["default"]["HOST"] not in {"127.0.0.1", "localhost", "::1"}
    and DATABASES["default"]["OPTIONS"]["sslmode"] != "verify-full"
):
    raise ImproperlyConfigured("Remote production PostgreSQL requires verified TLS.")
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": f"django.contrib.auth.password_validation.{n}"}
    for n in [
        "UserAttributeSimilarityValidator",
        "MinimumLengthValidator",
        "CommonPasswordValidator",
        "NumericPasswordValidator",
    ]
]
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["service.credentials.InstallationAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
    "EXCEPTION_HANDLER": "service.exceptions.api_exception_handler",
    "DEFAULT_METADATA_CLASS": None,
}
API_IP_PER_MINUTE = positive("API_IP_PER_MINUTE", 120)
REGISTER_PER_HOUR = positive("REGISTER_PER_HOUR", 20)
REGISTER_GLOBAL_DAILY = positive("REGISTER_GLOBAL_DAILY", 1000)
ANALYSIS_PER_MINUTE = positive("ANALYSIS_PER_MINUTE", 30)
ANALYSIS_PER_DAY = positive("ANALYSIS_PER_DAY", 300)
ANALYSIS_GLOBAL_DAILY = positive("ANALYSIS_GLOBAL_DAILY", 5000)
CREDENTIAL_DAYS = positive("CREDENTIAL_DAYS", 90, 365)
CORS_ALLOWED_ORIGINS = env(
    "CORS_ALLOWED_ORIGINS", "http://localhost:8081,http://127.0.0.1:8081"
).split(",")
CORS_ALLOW_CREDENTIALS = False
CSRF_TRUSTED_ORIGINS = [v for v in env("CSRF_TRUSTED_ORIGINS").split(",") if v]
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
SMISHGUARD_MODEL_DIRECTORY = BASE_DIR.parent / "ml" / "artifacts" / "selected"
DATA_UPLOAD_MAX_MEMORY_SIZE = 32768
DATA_UPLOAD_MAX_NUMBER_FIELDS = 30
APPEND_SLASH = False
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Strict"
SESSION_COOKIE_AGE = 3600
CSRF_COOKIE_HTTPONLY = True
if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000
# No automatic trust in X-Forwarded-For/Proto. Configure the actual trusted
# deployment boundary deliberately before using a reverse proxy.
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "filters": {"safe_request": {"()": "service.logging.SafeRequestFilter"}},
    "handlers": {"safe_console": {"class": "logging.StreamHandler", "filters": ["safe_request"]}},
    "loggers": {
        "django.request": {"handlers": ["safe_console"], "propagate": False},
        "django.server": {"handlers": ["safe_console"], "propagate": False},
    },
}
