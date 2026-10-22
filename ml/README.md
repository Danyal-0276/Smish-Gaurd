# SmishGuard machine learning workspace

Start with [smishguard_training.ipynb](smishguard_training.ipynb): small, explained cells for source verification, cleaning, charts, grouped partitioning, training three models, evaluation, and backend export. See the living [project brief](../PROJECT_BRIEF.md) for scope.

The Mendeley dataset is downloaded to `data/raw/` and its archive matches the publisher checksum. See [DATASET_CARD.md](DATASET_CARD.md) for attribution and limitations. Source CSV is unchanged.

## Structure

```text
smishguard_training.ipynb    Main notebook with saved execution outputs
requirements.txt            Pinned direct training/Jupyter dependencies
requirements-lock.txt       Complete verified environment snapshot
pyproject.toml              Installable local inference package
smishguard_ml/              Reusable training mechanics and backend inference
scripts/                   Downloader, notebook builder, execution/verification tools
data/raw/                  Downloaded archive, CSV, and provenance
reports/                   Audit JSON, metrics, split IDs, and saved figures
artifacts/<run-id>/         All three fitted candidate bundles
artifacts/selected/         Evaluated validation-selected model for Django
```

## Run on Windows

Use Python 3.12. From the repository root in PowerShell:

```powershell
py -3.12 -m venv ml/.venv
.\ml\.venv\Scripts\python.exe -m pip install -r ml/requirements.txt
.\ml\.venv\Scripts\python.exe -m pip install -e ./ml
.\ml\.venv\Scripts\python.exe -m ipykernel install --prefix ./ml/.venv --name smishguard-ml --display-name "SmishGuard ML (Python 3.12)"
.\ml\.venv\Scripts\python.exe -m jupyterlab ml/smishguard_training.ipynb
```

Choose the `ml/.venv` interpreter/kernel and **Run All**. In VS Code, select that environment's Python interpreter if the named kernel is not listed. Recreate the machine-specific environment on another computer. To reproduce all transitive dependencies exactly, use `requirements-lock.txt` instead of `requirements.txt`.

Refresh a missing dataset with:

```powershell
.\ml\.venv\Scripts\python.exe ml/scripts/download_dataset.py
```

Manual fallback: download [the publisher dataset](https://data.mendeley.com/datasets/f45bkkt8pr/1), extract `Dataset_5971.csv`, and place it in `ml/data/raw/`. The notebook checks its checksum.

Headless execution after preparing the named kernel:

```powershell
.\ml\.venv\Scripts\python.exe ml/scripts/execute_notebook.py
```

`scripts/build_notebook.py` regenerates the source notebook and clears outputs; use only when maintaining the notebook. Runs create dated artifact directories and update `artifacts/selected/`; preserve older runs for comparison.

## Experiment protocol

- Smishing versus ham/spam; preserve original source labels for slices.
- Exclude empty inputs, conflicting annotations, and redundant duplicates.
- Similar templates stay in disjoint approximately 60/20/20 partitions.
- Fit word/character TF-IDF inside training folds only.
- Compare Logistic Regression, Multinomial Naive Bayes, and Linear SVM with group-aware sigmoid calibration.
- Select by validation average precision; choose thresholds using validation only.
- Evaluate held-out results: majority baseline, precision/recall/F1, false positives, PR/ROC, calibration, suspicious referrals, group-bootstrap intervals, and warm inference latency.
- Export the evaluated model without silently refitting after test inspection.

Targets are not guaranteed. The historical English-oriented corpus does not establish multilingual or real-world protection.

The [model card](MODEL_CARD.md) summarizes the initial verified run and its limitations. It identifies its exact model version; regenerate or revise that card when publishing a new experiment. Notebook reports and bundle metadata are regenerated automatically on each run.

## Backend handoff

See [BACKEND_INTEGRATION.md](BACKEND_INTEGRATION.md). The fitted pipeline runs locally inside Django and accepts raw SMS text. No paid API, training CSV, Jupyter, or separate model server is needed at runtime.

Git ignores datasets, model binaries, virtual environments, and notebook checkpoints. Include the selected bundle deliberately when shipping the customer's backend. Never add real private SMS or credentials to the research workspace.
