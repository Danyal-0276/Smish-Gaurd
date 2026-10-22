# Use the trained model inside Django

The customer can keep the model with the backend and run inference locally in Django. No separate model-hosting service is needed. PostgreSQL stores application metadata, not model binaries.

## Customer bundle

Distribute `artifacts/selected/model.joblib`, `metadata.json`, `requirements-inference.txt`, and the `smishguard_ml` package. Include the dataset attribution and model evaluation summary. Training data, Jupyter, and graphs are not Django runtime dependencies. Git ignores model binaries and raw data; cloning the repository does not automatically provide the complete deployment bundle.

From the repository root, install in the backend environment:

```powershell
python -m pip install -r ml/artifacts/selected/requirements-inference.txt
python -m pip install ./ml
```

Use tested Python 3.12 and pinned runtime packages. Rebuild and re-evaluate before changing them. The training module additionally needs pandas; the backend imports only `smishguard_ml.inference`.

## Django service pattern

```python
from pathlib import Path
from django.conf import settings
from smishguard_ml.inference import SmishGuardPredictor

# Load once per worker, outside public static/media directories.
predictor = SmishGuardPredictor(Path(settings.SMISHGUARD_MODEL_DIRECTORY))

def analyze_message(text: str) -> dict:
    return predictor.predict(text)
```

The API view must separately enforce installation authentication, authorization, consent, bounded inputs, throttling, and error handling. Map invalid input to a suitable client error. Never log message bodies or bearer tokens. This is an inference component, not a complete secured DRF endpoint.

## Input and interpretation

Pass raw message text. Fitted feature extraction, classifier, and calibration are serialized together. The wrapper rejects blank/non-string input and messages over 5,000 characters. This cap is an application limit, not evidence that a short-message corpus covers long documents.

Output includes model version, probability estimate, policy version, risk band, and limited observed indicators. The estimate is not a safety guarantee. Observed rule patterns do not establish maliciousness or explain actual model attribution. A coarse Latin-script/length guard rejects mostly non-Latin or insufficient text; it is not a language detector and cannot certify accepted text as English.

Keep thresholds and model version together. The suspicious band does not automatically delete or quarantine system SMS. New refitting/calibration/threshold choices require a new evaluated version.

## Integrity and operations

Load only trusted joblib files: deserialization can execute Python code. The helper verifies the model checksum against metadata and rejects an unexpected scikit-learn version. This detects changed bytes relative to trusted metadata, but does not authenticate an untrusted publisher that replaces both files. Protect both and use authenticated distribution for updates.

Each worker holds a model instance; load once per worker rather than per request. Measure actual API/network/phone latency separately from notebook inference timing. Preserve an earlier trusted release for rollback.

A model local to Django is not automatically inside the Android APK. The phone still needs a reachable backend for this path. Fully offline mobile inference is a separate conversion and parity-testing task.
