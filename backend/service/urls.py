from django.urls import path
from . import views

urlpatterns = [
    path("installations", views.Register.as_view()),
    path("installations/me", views.DeleteInstallation.as_view()),
    path("installations/me/credentials/rotate", views.Rotate.as_view()),
    path("analyses", views.Analyze.as_view()),
    path("capabilities", views.Capabilities.as_view()),
    path("feedback/me", views.FeedbackList.as_view()),
    path("feedback/me/<uuid:identifier>", views.FeedbackDelete.as_view()),
    path("lessons", views.LessonList.as_view()),
    path("lessons/<slug:slug>", views.LessonDetail.as_view()),
]
