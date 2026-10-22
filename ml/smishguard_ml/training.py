"""Reusable experiment mechanics; the notebook explains and runs each stage."""

from __future__ import annotations

import hashlib
import json
import platform
import re
import unicodedata
from importlib.metadata import version
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.sparse.csgraph import connected_components
from sklearn.calibration import CalibratedClassifierCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, average_precision_score, brier_score_loss, confusion_matrix,
    f1_score, precision_score, recall_score, roc_auc_score,
)
from sklearn.model_selection import StratifiedGroupKFold
from sklearn.naive_bayes import MultinomialNB
from sklearn.neighbors import NearestNeighbors
from sklearn.pipeline import FeatureUnion, Pipeline
from sklearn.svm import LinearSVC


def canonical_text(text: str) -> str:
    """For duplicate detection only, not an external inference preprocessing step."""
    return re.sub(r"\s+", " ", unicodedata.normalize("NFKC", text)).strip().casefold()


def template_text(text: str) -> str:
    text = canonical_text(text)
    text = re.sub(r"(?:https?://|www\.)\S+", " urltoken ", text)
    text = re.sub(r"\b[\w.+-]+@[\w.-]+\.\w+\b", " emailtoken ", text)
    text = re.sub(r"\d+", " numbertoken ", text)
    return re.sub(r"\s+", " ", text).strip()


def make_template_groups(texts, similarity: float = 0.90):
    """Connected components link exact templates and high-similarity messages.

    This label-free preprocessing builds split boundaries, not classifier features.
    It is a heuristic, not proof of complete campaign/domain separation.
    """
    templates = [template_text(t) for t in texts]
    matrix = TfidfVectorizer(analyzer="char", ngram_range=(3, 5),
                            min_df=1, max_features=20000).fit_transform(templates)
    neighbors = NearestNeighbors(metric="cosine", algorithm="brute", n_jobs=1)
    neighbors.fit(matrix)
    graph = neighbors.radius_neighbors_graph(
        matrix, radius=1.0 - similarity + 1e-9, mode="connectivity"
    )
    # Identical short templates can have empty character vectors; link explicitly.
    graph = graph.tolil()
    first = {}
    for i, text in enumerate(templates):
        if text in first:
            graph[i, first[text]] = 1
            graph[first[text], i] = 1
        else:
            first[text] = i
    count, labels = connected_components(graph.tocsr(), directed=False)
    return labels, {"similarity_threshold": similarity, "groups": int(count),
                    "largest_group": int(np.bincount(labels).max()),
                    "method": "masked-template char TF-IDF cosine connected components"}


def grouped_split(frame: pd.DataFrame, seed: int = 42):
    """Approximately 60/20/20, with no template group crossing partitions."""
    y, groups = frame.target.to_numpy(), frame.group_id.to_numpy()
    outer = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=seed)
    development, test = next(outer.split(frame.text, y, groups))
    inner = StratifiedGroupKFold(n_splits=4, shuffle=True, random_state=seed + 1)
    tr, va = next(inner.split(frame.text.iloc[development], y[development], groups[development]))
    indices = {"train": development[tr], "validation": development[va], "test": test}
    parts = {name: frame.iloc[idx].copy().reset_index(drop=True) for name, idx in indices.items()}
    for name, part in parts.items():
        if part.target.nunique() != 2:
            raise ValueError(f"{name} lacks a class; choose an explicitly documented split strategy.")
    for a, b in [("train", "validation"), ("train", "test"), ("validation", "test")]:
        assert set(parts[a].group_id).isdisjoint(parts[b].group_id)
    return parts


def feature_pipeline(classifier):
    # Both vectorizers are serialized with the classifier. Input remains raw text.
    features = FeatureUnion([
        ("word", TfidfVectorizer(strip_accents="unicode", lowercase=True,
                                ngram_range=(1, 2), min_df=2, max_features=12000,
                                sublinear_tf=True)),
        ("char", TfidfVectorizer(strip_accents="unicode", lowercase=True,
                                analyzer="char_wb", ngram_range=(3, 5),
                                min_df=2, max_features=15000, sublinear_tf=True)),
    ])
    return Pipeline([("features", features), ("classifier", classifier)])


def build_candidates(train: pd.DataFrame, seed: int = 42):
    """Calibrate inside the training partition using disjoint template folds."""
    cv = list(StratifiedGroupKFold(n_splits=3, shuffle=True, random_state=seed).split(
        train.text, train.target, train.group_id
    ))
    estimators = {
        "logistic_regression": LogisticRegression(C=2.0, max_iter=1500,
                                                  class_weight="balanced", random_state=seed),
        "multinomial_nb": MultinomialNB(alpha=0.5),
        "linear_svm": LinearSVC(C=1.0, class_weight="balanced", random_state=seed),
    }
    return {name: CalibratedClassifierCV(estimator=feature_pipeline(estimator),
                                         method="sigmoid", cv=cv, ensemble=False, n_jobs=1)
            for name, estimator in estimators.items()}


def positive_probability(model, texts):
    index = list(model.classes_).index(1)
    return model.predict_proba(list(texts))[:, index]


def binary_metrics(y_true, probabilities, threshold=0.5):
    y = np.asarray(y_true, dtype=int)
    p = np.asarray(probabilities, dtype=float)
    predictions = (p >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y, predictions, labels=[0, 1]).ravel()
    return {"accuracy": float(accuracy_score(y, predictions)),
            "precision": float(precision_score(y, predictions, zero_division=0)),
            "recall": float(recall_score(y, predictions, zero_division=0)),
            "f1": float(f1_score(y, predictions, zero_division=0)),
            "false_positive_rate": float(fp / (fp + tn)) if fp + tn else 0.0,
            "average_precision": float(average_precision_score(y, p)),
            "roc_auc": float(roc_auc_score(y, p)),
            "brier_score": float(brier_score_loss(y, p)),
            "tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)}


def threshold_table(y_true, probabilities):
    return pd.DataFrame([{"threshold": float(t), **binary_metrics(y_true, probabilities, t)}
                         for t in np.linspace(0.05, 0.95, 91)])


def select_threshold(table: pd.DataFrame, max_fpr=0.05):
    eligible = table[table.false_positive_rate <= max_fpr]
    if eligible.empty:
        raise ValueError("No validation threshold meets the false-positive ceiling; review the policy.")
    return float(eligible.sort_values(["recall", "precision", "f1", "threshold"],
                                      ascending=[False, False, False, False]).iloc[0].threshold)


def risk_bands(probabilities, lower, upper):
    p = np.asarray(probabilities)
    return np.where(p >= upper, "high_phishing_risk",
                    np.where(p >= lower, "suspicious", "low_detected_risk"))


def group_bootstrap_intervals(frame, probabilities, threshold, seed=42, repeats=400):
    """Percentile intervals resample template groups, not dependent individual rows."""
    rng = np.random.default_rng(seed)
    group_indices = list(frame.groupby("group_id").indices.values())
    records = []
    for _ in range(repeats):
        picks = rng.integers(0, len(group_indices), size=len(group_indices))
        idx = np.concatenate([group_indices[i] for i in picks])
        if frame.target.iloc[idx].nunique() < 2:
            continue
        records.append(binary_metrics(frame.target.iloc[idx], np.asarray(probabilities)[idx], threshold))
    values = pd.DataFrame(records)
    metrics = ["precision", "recall", "f1", "false_positive_rate", "average_precision"]
    return pd.DataFrame({"metric": metrics,
                         "lower_95": [float(values[m].quantile(.025)) for m in metrics],
                         "upper_95": [float(values[m].quantile(.975)) for m in metrics]})


def file_sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def environment_versions():
    return {"python": platform.python_version(), **{name: version(name) for name in
            ["numpy", "scipy", "scikit-learn", "pandas", "joblib"]}}


def write_json(path, data):
    Path(path).write_text(json.dumps(data, indent=2, ensure_ascii=False, allow_nan=False), encoding="utf-8")
