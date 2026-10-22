"""Download the public Mendeley v1 archive, verify it, and safely extract its CSV."""

from __future__ import annotations

import hashlib
import json
import urllib.error
import urllib.request
from pathlib import Path
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
PAGE = "https://data.mendeley.com/datasets/f45bkkt8pr/1"
API = "https://data.mendeley.com/public-api/datasets/f45bkkt8pr/files?folder_id=root&version=1"
ARCHIVE_SHA256 = "9bbf3188fdad81495d8e82825648b9b63b53fc86841a3d26c02629990b233cc3"
CSV_SHA256 = "649844f1c62a6b27e145eaf17a65f7010c56c390e11a794ea8329993a05ba71e"


def fetch(url):
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0",
            "Referer": PAGE,
            "Accept": "application/json",
        },
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        body = response.read(10_000_001)
    if len(body) > 10_000_000:
        raise ValueError("Unexpected dataset response size")
    return body


def download():
    RAW.mkdir(parents=True, exist_ok=True)
    csv_path = RAW / "Dataset_5971.csv"
    if (
        csv_path.exists()
        and hashlib.sha256(csv_path.read_bytes()).hexdigest() == CSV_SHA256
    ):
        print("Dataset already present and its checksum is valid:", csv_path)
        return
    listing = json.loads(fetch(API))
    item = next(f for f in listing if f["filename"] == "Dataset_5971.zip")
    body = fetch(item["content_details"]["download_url"])
    if hashlib.sha256(body).hexdigest() != ARCHIVE_SHA256:
        raise ValueError(
            "Dataset archive checksum mismatch; investigate the source version"
        )
    archive = RAW / "Dataset_5971.zip"
    archive.write_bytes(body)
    (RAW / "mendeley-file-list.json").write_text(
        json.dumps(listing, indent=2), encoding="utf-8"
    )
    with ZipFile(archive) as zipped:
        if "Dataset_5971.csv" not in zipped.namelist():
            raise ValueError("Expected CSV missing from archive")
        member = zipped.getinfo("Dataset_5971.csv")
        if member.file_size > 10_000_000:
            raise ValueError("Unexpected extracted size")
        csv_body = zipped.read(
            member
        )  # No arbitrary archive paths or publisher code executed.
    if hashlib.sha256(csv_body).hexdigest() != CSV_SHA256:
        raise ValueError("Extracted CSV checksum mismatch")
    csv_path.write_bytes(csv_body)
    print("Downloaded and verified:", csv_path)


if __name__ == "__main__":
    try:
        download()
    except (urllib.error.URLError, TimeoutError) as error:
        raise SystemExit(
            f"Download failed: {error}\nManual source: {PAGE}\nPlace Dataset_5971.csv in {RAW}"
        )
