from django.apps import AppConfig
from django.contrib.admin.apps import AdminConfig


class SmishGuardAdminConfig(AdminConfig):
    default_site = "service.admin_site.SmishGuardAdminSite"


class ServiceConfig(AppConfig):
    name = "service"
    verbose_name = "SmishGuard operations"
    default_auto_field = "django.db.models.BigAutoField"
