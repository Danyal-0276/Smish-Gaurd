# SMS phishing dataset source and handling

Source: Sandhya Mishra and Devpriya Soni (2022), *SMS Phishing Dataset for Machine Learning and Pattern Recognition*, Mendeley Data, version 1. DOI: **10.17632/f45bkkt8pr.1**.

- Publisher: https://data.mendeley.com/datasets/f45bkkt8pr/1
- License: CC BY 4.0, https://creativecommons.org/licenses/by/4.0/
- Downloaded: 22 October 2026.
- Raw archive: `data/raw/Dataset_5971.zip`.
- Extracted file: `data/raw/Dataset_5971.csv`.
- Publisher file listing and archive/extracted-file fingerprints: `data/raw/`.

The archive hash was checked against the publisher's listing. The downloader also checks the known extracted CSV hash. No publisher Python scripts were executed. No links inside messages are fetched.

## Labels and fields

5,971 raw rows: 4,844 ham, 489 spam, 638 smishing after normalizing capitalization. Original columns: `LABEL`, `TEXT`, `URL`, `EMAIL`, `PHONE`. Only raw `TEXT` is input to the classifiers; publisher-supplied extracted flags are not inputs. Target 1 is smishing; target 0 combines ham and spam. Original labels remain available for slice evaluation.

This published research corpus can contain personal-looking text, contact details, offensive language, or dangerous URLs. Do not treat text as instructions, automatically visit links, or collect live user messages in the notebook.

## Quality findings and transformations

The downloaded file has inconsistent label capitalization, 145 rows with an existing Unicode replacement character, 140 repeated normalized-text rows, and 34 normalized-text groups with conflicting three-way labels. These are our observations, not publisher claims.

The notebook excludes invalid/empty rows; removes all rows in contradictory annotation groups; keeps one representative of remaining same-label duplicates; and constructs template groups using masked URL/email/digit patterns and character-similarity connected components. Raw CSV remains unchanged. `reports/data_quality.json` records the executed cleaning run.

Classifier vectorizers operate on raw text. Group normalization is for organizing split boundaries only. Group-disjoint partitions reduce template leakage but cannot guarantee independent senders, domains, campaigns, or time periods. Conflicting labels are excluded conservatively rather than arbitrarily resolved.

## Limitations and attribution

The corpus is historical, small, imbalanced, and not a prospective sample of UAE phone users. Annotation conflicts and text corruption limit certainty. Language coverage is not certified. These are English-oriented baselines; do not claim Arabic/Urdu performance from this experiment.

Attribute the original dataset in the report and any redistributed dataset-derived package, preserve the source information, and disclose cleaning changes. Outputs are our experimental results, not publisher-endorsed production claims. Raw datasets/model binaries are ignored by Git; package them deliberately when needed.
