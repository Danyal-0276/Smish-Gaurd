import re
import threading
from urllib.parse import urlsplit
from django.conf import settings
from smishguard_ml.inference import SmishGuardPredictor
from .quotas import ServiceUnavailable

_predictor = None
_load_lock = threading.Lock()
_slots = threading.BoundedSemaphore(2)


def get_predictor():
    global _predictor
    if _predictor is None:
        with _load_lock:
            if _predictor is None:
                try:
                    _predictor = SmishGuardPredictor(settings.SMISHGUARD_MODEL_DIRECTORY)
                except Exception:
                    # Never expose model paths, deserializer errors, or payloads.
                    raise ServiceUnavailable() from None
    return _predictor


INDICATORS = {
    "contains_link": (
        "An external link",
        "A link is present. Its destination has not been visited or verified.",
    ),
    "urgency_language": (
        "Pressure to act",
        "Urgent wording can discourage independent verification.",
    ),
    "credential_or_verification_language": (
        "Verification or credentials",
        "The text mentions verification or sensitive credentials. Check the context independently.",
    ),
}


def analyze(text, request_id):
    if not _slots.acquire(blocking=False):
        raise ServiceUnavailable()
    try:
        raw = get_predictor().predict(text)
    except ServiceUnavailable:
        raise
    except Exception:
        raise ServiceUnavailable() from None
    finally:
        _slots.release()
    base = {
        "request_id": str(request_id),
        "mode": "backend_model",
        "model_version": raw["model_version"],
        "coverage": raw["language_coverage"],
        "safety_guarantee": False,
    }
    if raw["status"] != "completed":
        return {
            **base,
            "status": "unsupported",
            "risk": None,
            "message": "This input is outside the evaluated model coverage or has insufficient text.",
        }
    risk = {
        "low_detected_risk": "low",
        "suspicious": "review",
        "high_phishing_risk": "high",
    }[raw["verdict"]]
    domains = []
    for link in re.findall(r"(?:https?://|www\.)[^\s<>]+", text, flags=re.I)[:20]:
        try:
            domain = urlsplit(
                link if not link.lower().startswith("www.") else "https://" + link
            ).hostname
            if domain and domain not in domains:
                domains.append(domain[:253])
        except ValueError:
            pass
    return {
        **base,
        "status": "completed",
        "risk": risk,
        "policy_version": raw["policy_version"],
        "model_estimate": raw["model_estimate"],
        "indicators": [
            {"title": INDICATORS[k][0], "description": INDICATORS[k][1]}
            for k in raw["observed_indicators"]
            if k in INDICATORS
        ],
        "domains": domains,
        "advice": {
            "high": "Do not open links or share codes. Verify the request through the official app or a number you already trust.",
            "review": "Pause before responding. Confirm the request through a known number or the official app.",
            "low": "No strong phishing signal was detected. Verify unexpected requests before replying or sharing information.",
        }[risk],
        "indicator_note": raw["indicator_note"],
    }
