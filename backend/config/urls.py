from django.contrib import admin
from django.urls import path
from .health import health

urlpatterns = [path("health/", health), path("admin/", admin.site.urls)]
