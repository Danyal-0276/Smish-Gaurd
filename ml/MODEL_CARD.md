# SmishGuard evaluated baseline model card

Model version: `smishguard-multinomial_nb-20261022T113407Z`. Selected algorithm: **multinomial_nb**, chosen using validation average precision, not test performance. This is an initial historical SMS benchmark, not a production-certified detector.

## Training and data

Mishra and Soni, Mendeley Data v1, DOI 10.17632/f45bkkt8pr.1, CC BY 4.0. Source: https://data.mendeley.com/datasets/f45bkkt8pr/1. Download date: 22 October 2026. See DATASET_CARD.md for the source and cleaning limitations.

The source has 5,971 rows. Excluding contradictory annotations and redundant duplicates leaves 5,797. Similar-template grouping is a leakage-reduction heuristic, not full campaign, domain, sender, or temporal independence. Binary label 1 means smishing; label 0 includes ham and promotional spam.

Word/character TF-IDF and the classifier are fitted on training data only. Three group-aware training folds support sigmoid calibration. Approximately 60/20/20 partitions separate training, validation, and testing. The exported model is not refitted after testing. Validation chooses model and thresholds; the test set only evaluates the frozen decisions.

## Held-out classifier results

On 1,160 held-out messages at the frozen high-risk threshold:

- Accuracy: 96.12%.
- Precision: 74.02%.
- Smishing recall: 88.68%.
- F1: 0.8069.
- Non-smishing false-positive rate: 3.13%.
- Average precision: 0.9025.
- Confusion counts: TP 94, FP 33, FN 12, TN 1021.

The provisional 95% recall goal is not met. Accuracy alone would obscure missed phishing and false alarms. Calibration was evaluated, but the probability estimate is not a guarantee or a probability of financial loss. Confidence intervals and full candidate results are in `reports/`.

The suspicious band starts at 0.0750; high risk starts at 0.1500. Suspicious is a review outcome, not a source ground-truth label. Including suspicious alerts gives recall 89.62% and benign alert rate 3.42%.

## Deployment and limitations

The inference wrapper has a separate script/length guard; `reports/inference_wrapper_coverage.json` records its abstentions. The classifier metrics above describe the estimator on all held-out rows, not a claim that all inputs pass that guard. The guard is not a language detector. Arabic, Urdu, and other-language performance is unvalidated.

Use locally inside Django, following BACKEND_INTEGRATION.md. A backend model does not make the Android app fully offline. The wrapper's few observed regex indicators are not verified model attribution. No message sender identity, website safety, automatic quarantine, or prevention guarantee is established by this experiment.

The selected model file SHA-256 is `51452584eb89a4d1e9454003151671df599348d52758f415b2a0ca2b2876a7b9`. Use only trusted artifacts and the pinned runtime. Joblib deserialization can execute code. Keep both model and metadata protected; a checksum is not publisher authentication.
