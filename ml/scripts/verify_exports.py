"""Verify executed notebook, data provenance, and deployable artifact behavior."""

import hashlib
import json
import sys
from pathlib import Path
from tempfile import TemporaryDirectory
import shutil

import nbformat
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from smishguard_ml.inference import SmishGuardPredictor


def verify():
    notebook = nbformat.read(ROOT / "smishguard_training.ipynb", as_version=4)
    nbformat.validate(notebook)
    code_cells = [c for c in notebook.cells if c.cell_type == "code"]
    assert all(c.execution_count is not None for c in code_cells), "Unexecuted notebook cells"
    errors = [o for c in code_cells for o in c.outputs if o.output_type == "error"]
    assert not errors, errors
    images = sum("image/png" in o.get("data", {}) for c in code_cells for o in c.outputs)
    assert images >= 12, "Missing chart outputs"

    assignments = pd.read_csv(ROOT / "reports/split_assignments.csv")
    assert assignments.groupby("group_id").partition.nunique().max() == 1
    assert assignments.source_row_id.is_unique
    source = ROOT / "data/raw/Dataset_5971.csv"
    assert hashlib.sha256(source.read_bytes()).hexdigest() == (
        "649844f1c62a6b27e145eaf17a65f7010c56c390e11a794ea8329993a05ba71e")

    run = json.loads((ROOT / "reports/latest_run.json").read_text())
    for algorithm in ["logistic_regression", "multinomial_nb", "linear_svm"]:
        predictor = SmishGuardPredictor(ROOT / "artifacts" / run["run_id"] / algorithm)
        result = predictor.predict("Please confirm our library study session tomorrow afternoon.")
        assert result["status"] == "completed" and 0 <= result["model_estimate"] <= 1
        assert predictor.predict("1234")["verdict"] is None
        for invalid in [None, 123, [], "", "  ", "a" * 5001]:
            try:
                predictor.predict(invalid)
            except ValueError:
                pass
            else:
                raise AssertionError(f"Invalid input accepted: {type(invalid)}")

    (ROOT / ".tmp").mkdir(exist_ok=True)
    with TemporaryDirectory(dir=ROOT / ".tmp") as directory:
        destination = Path(directory)
        for name in ["model.joblib", "metadata.json"]:
            shutil.copyfile(ROOT / "artifacts/selected" / name, destination / name)
        with (destination / "model.joblib").open("ab") as handle:
            handle.write(b"integrity-test")
        try:
            SmishGuardPredictor(destination)
        except ValueError as error:
            assert "integrity" in str(error)
        else:
            raise AssertionError("Changed model was not rejected before deserialization")

    summary = {"notebook_code_cells": len(code_cells), "embedded_chart_outputs": images,
               "template_partition_overlap": False, "dataset_checksum": "passed",
               "three_model_reload": "passed", "invalid_input_checks": "passed",
               "tampered_model_rejection": "passed"}
    (ROOT / "reports/verification.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    verify()
