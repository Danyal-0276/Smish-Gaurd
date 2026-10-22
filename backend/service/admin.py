from django.contrib import admin, messages
from django.db import transaction
from django.utils import timezone
from .credentials import revoke
from .models import AdminAuditEvent, Feedback, Installation, ModelRelease, Lesson

admin.site.site_header = "SmishGuard operations"
admin.site.site_title = "SmishGuard staff"
admin.site.index_title = "Installations, learning and feedback — no private SMS inbox"


class ReadOnlyAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def get_readonly_fields(self, request, obj=None):
        return [f.name for f in self.model._meta.fields]


@admin.register(Installation)
class InstallationAdmin(ReadOnlyAdmin):
    list_display = ["id", "app_version", "created_at", "cloud_consent_at", "revoked_at"]
    list_filter = ["revoked_at", "created_at", "consent_version"]
    search_fields = ["id"]
    actions = ["revoke_selected"]

    @admin.action(description="Revoke selected installations and their credentials", permissions=["change"])
    def revoke_selected(self, request, queryset):
        with transaction.atomic():
            for installation in queryset.select_for_update().order_by("id"):
                revoke(installation)
                AdminAuditEvent.objects.create(actor=request.user, action="installation_revoked", object_reference=str(installation.id))
        self.message_user(request, "Selected installations were revoked.", messages.SUCCESS)


@admin.register(ModelRelease)
class ModelReleaseAdmin(ReadOnlyAdmin):
    list_display = ["version", "policy_version", "registered_at"]


@admin.register(Feedback)
class FeedbackAdmin(ReadOnlyAdmin):
    list_display = ["id", "model_release", "risk", "reason", "status", "created_at"]
    list_filter = ["status", "risk", "reason", "model_release"]
    actions = ["mark_reviewed"]

    @admin.action(description="Mark selected metadata feedback reviewed", permissions=["change"])
    def mark_reviewed(self, request, queryset):
        with transaction.atomic():
            for row in queryset.select_for_update().order_by("id"):
                row.status = "reviewed"
                row.save(update_fields=["status"])
                AdminAuditEvent.objects.create(actor=request.user, action="feedback_reviewed", object_reference=str(row.id))
        self.message_user(request, "Feedback reviewed. No training or blacklisting was performed.")


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "revision", "published", "updated_at"]
    list_filter = ["published", "category"]
    search_fields = ["title", "slug"]
    readonly_fields = ["revision", "updated_at"]

    def save_model(self, request, obj, form, change):
        if change:
            obj.revision += 1
        super().save_model(request, obj, form, change)
        AdminAuditEvent.objects.create(actor=request.user, action="lesson_changed", object_reference=obj.slug)

    def has_delete_permission(self, request, obj=None):
        return False  # Unpublish instead; retain release/audit continuity.


@admin.register(AdminAuditEvent)
class AuditAdmin(ReadOnlyAdmin):
    list_display = ["created_at", "actor", "action", "object_reference"]
    list_filter = ["action", "created_at"]
