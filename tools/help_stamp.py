"""Text hash for an explanation clip. No Piper import: tests and CI can run this alone."""

import hashlib
import json
import sys
import tempfile
from pathlib import Path

HASH_FILE = Path(__file__).with_name("help_text_hashes.json")


def text_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def clip_is_current(dest: Path, text: str, stored: str | None) -> bool:
    """True only when the file exists and the stored hash is the hash of this text."""
    if stored != text_hash(text):
        return False
    return dest.is_file() and dest.stat().st_size > 0


def load_hashes(path: Path = HASH_FILE) -> dict[str, str]:
    if not path.is_file():
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        return {}
    return {key: value for key, value in data.items() if isinstance(key, str) and isinstance(value, str)}


def save_hashes(hashes: dict[str, str], path: Path = HASH_FILE) -> None:
    ordered = {key: hashes[key] for key in sorted(hashes)}
    path.write_text(json.dumps(ordered, indent=2) + "\n", encoding="utf-8")


def self_test() -> None:
    sample = "Vorlesen."
    digest = text_hash(sample)
    with tempfile.TemporaryDirectory() as folder:
        dest = Path(folder) / "clip.m4a"
        assert clip_is_current(dest, sample, digest) is False
        dest.write_bytes(b"")
        assert clip_is_current(dest, sample, digest) is False
        dest.write_bytes(b"audio")
        assert clip_is_current(dest, sample, None) is False
        assert clip_is_current(dest, sample, "nope") is False
        assert clip_is_current(dest, sample, digest) is True
        assert clip_is_current(dest, sample + "!", digest) is False
    print("ok")


if __name__ == "__main__":
    if "--self-test" in sys.argv:
        self_test()
