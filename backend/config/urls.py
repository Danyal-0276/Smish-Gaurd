from django.contrib import admin
from django.urls import path, include
from .health import health

urlpatterns = [path("health/", health), path("api/v1/", include("service.urls")), path("admin/", admin.site.urls)]
