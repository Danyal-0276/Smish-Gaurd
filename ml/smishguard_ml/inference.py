"""Framework-independent local inference; import once at Django worker startup.

Load only your own trusted bundle: joblib deserialization can execute Python code.
A hash detects changed bytes but does not authenticate an untrusted publisher.
"""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

import joblib
import sklearn


class SmishGuardPredictor:
    def __init__(self, bundle_directory):
        root = Path(bundle_directory).resolve()
        self.metadata = json.loads((root / "metadata.json").read_text(encoding="utf-8"))
        if self.metadata.get("schema_version") != 1:
            raise ValueError("Unsupported model bundle schema")
        expected_version = self.metadata["environment"]["scikit-learn"]
        if sklearn.__version__ != expected_version:
            raise RuntimeError(
                f"Use scikit-learn=={expected_version}; found {sklearn.__version__}"
            )
        model_path = root / "model.joblib"
        actual = hashlib.sha256(model_path.read_bytes()).hexdigest()
        if actual != self.metadata["model_sha256"]:
            raise ValueError("Model integrity check failed")
        self.model = joblib.load(model_path)
        self.positive_index = list(self.model.classes_).index(1)
        policy = self.metadata["decision_policy"]
        self.lower, self.upper = policy["lower_threshold"], policy["upper_threshold"]
        if not 0 < self.lower < self.upper < 1:
            raise ValueError("Invalid decision thresholds")

    def predict(self, text):
        if not isinstance(text, str):
            raise ValueError("Message text must be a string")
        if not text.strip():
            raise ValueError("Message text must not be empty")
        if len(text) > self.metadata["maximum_input_characters"]:
            raise ValueError("Message is longer than the supported input limit")
        # Unicode letters are counted; digits, URLs, and punctuation alone are not
        # enough to claim in-domain English text. This is a coarse script guard,
        # not a language detector; Spanish/etc. Latin-script text is not validated.
        letters = [c for c in text if c.isalpha()]
        latin_fraction = (
            sum(c.isascii() for c in letters) / len(letters) if letters else 0
        )
        if len(letters) < 5 or latin_fraction < 0.8:
            return {
                "status": "unsupported_or_insufficient_text",
                "verdict": None,
                "model_estimate": None,
                "language_coverage": "English-oriented benchmark only",
                "model_version": self.metadata["model_version"],
            }
        p = float(self.model.predict_proba([text])[0, self.positive_index])
        verdict = (
            "high_phishing_risk"
            if p >= self.upper
            else "suspicious" if p >= self.lower else "low_detected_risk"
        )
        indicators = []
        if re.search(r"https?://|www\.", text, flags=re.I):
            indicators.append("contains_link")
        if re.search(
            r"\b(urgent|immediately|suspend(?:ed)?|expires?)\b", text, flags=re.I
        ):
            indicators.append("urgency_language")
        if re.search(r"\b(password|pin|otp|verify|credential)\b", text, flags=re.I):
            indicators.append("credential_or_verification_language")
        return {
            "status": "completed",
            "verdict": verdict,
            "model_estimate": round(p, 6),
            "model_version": self.metadata["model_version"],
            "policy_version": self.metadata["decision_policy"]["version"],
            "observed_indicators": indicators,
            "indicator_note": "Observed patterns are not proof or model-attribution explanations.",
            "language_coverage": "English-oriented benchmark; language is not automatically verified",
            "mode": "local_backend_model",
            "safety_guarantee": False,
        }
