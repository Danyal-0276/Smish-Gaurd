from django.contrib.admin import AdminSite


class SmishGuardAdminSite(AdminSite):
    index_template = "admin/smishguard_index.html"

    def each_context(self, request):
        from .models import Installation, Feedback, Lesson
        context = super().each_context(request)
        summary = []
        if request.user.has_perm("service.view_installation"):
            summary.append(("Active installations", Installation.objects.filter(revoked_at__isnull=True).count()))
        if request.user.has_perm("service.view_feedback"):
            summary.append(("Feedback awaiting review", Feedback.objects.filter(status="new").count()))
        if request.user.has_perm("service.view_lesson"):
            summary.append(("Published lessons", Lesson.objects.filter(published=True).count()))
        context["smishguard_summary"] = summary
        return context
