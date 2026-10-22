import json
from pathlib import Path
from django.conf import settings
from django.core.management.base import BaseCommand
from service.inference import get_predictor
from service.models import Lesson, ModelRelease


class Command(BaseCommand):
    help = "Register the trusted deployed model and create bundled lessons without overwriting staff edits."

    def handle(self, *args, **kwargs):
        predictor = get_predictor()
        meta = predictor.metadata
        metrics_path = settings.BASE_DIR.parent / "ml/reports/selected_test_metrics.json"
        ModelRelease.objects.get_or_create(
            version=meta["model_version"],
            defaults={
                "checksum": meta["model_sha256"],
                "policy_version": str(meta["decision_policy"]["version"]),
                "metrics": json.loads(metrics_path.read_text()) if metrics_path.exists() else {},
            },
        )
        rows = json.loads(
            (Path(__file__).resolve().parents[2] / "seed_lessons.json").read_text(encoding="utf-8")
        )
        for row in rows:
            slug = row.pop("id")
            row["correct_index"] = row.pop("correctIndex")
            Lesson.objects.get_or_create(slug=slug, defaults={**row, "published": True})
        self.stdout.write(
            "Trusted model registered and bundled lessons seeded; existing records left unchanged."
        )
