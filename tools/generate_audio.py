"""Synthesize committed speech files with Piper. Models stay outside the repo.

piper-tts is pinned. Each shipped model is checked by SHA-256 before synthesis.
"""

import hashlib
import json
import logging
import subprocess
import sys
import wave
from pathlib import Path

from piper import PiperVoice
from piper.config import SynthesisConfig

PIPER_VERSION = "1.8.0"
# Alignment reads phoneme lengths through Piper. Synthesis itself does not import onnx.
ONNX_VERSION = "1.17.0"
# onnx weights. The four 0.4.0 models, plus the four voices shipped before that.
MODEL_SHA256 = {
    "de_DE-thorsten-high": "9df1c43c61149ef9b39e618e2b861fbe41e1fcea9390b2dac62e8761573ea4f1",
    "en_US-joe-medium": "58afce0321b8d9c46d7cdf9c16500cc55a793b4220212dba6b70fb788b3baf06",
    "pt_BR-cadu-medium": "765f0809a6ea9035d4a6d0d008dbf8876e68b2dd32029312672fa8f405bdb535",
    "vi_VN-vivos-x_low": "6ab13374eb0862021a545befe7727aef59e16117f1c075aa9e0362237ecc98ae",
    "de_DE-thorsten-medium": "7e64762d8e5118bb578f2eea6207e1a35a8e0c30595010b666f983fc87bb7819",
    "en_US-ljspeech-medium": "6f52a751e2349abe7a76735eb09dc1875298c77ea2342ffd2fef79ff81b87f22",
    "pt_BR-faber-medium": "858555e3a064209c57088fe6bd70c4c3dc54d03eaa00c45d5ecaf43a33f95aa7",
    "vi_VN-vais1000-medium": "ec7c89e2c85f4d1edc24b6120c18aaf1bda614f06b511567eb9c7c0de15e2dab",
    "de_DE-mls-medium": "69cd1d2aa5a35839a518966fcc4924b5f93e5f8c948ed0752b1a616ad53f65bf",
}
# Sidecar next to the onnx file. Checked with the weights. Not a runtime file.
JSON_SHA256 = {
    "de_DE-thorsten-high": "6de734444e4c3f9e33b7ebe2746dbc19b71e85f613e79c65acf623200b99a76a",
    "en_US-joe-medium": "3d6d5410b3795cb1950595247ef8f06190719e6fdbfa3a2356d8ec368e1aad33",
    "pt_BR-cadu-medium": "5fe03aa3d4901880554905b12075713cd552598c8a350455a1ec73f8b4e6be19",
    "vi_VN-vivos-x_low": "9dc373d69b0e4f39d864cb8ac9fe42cee49817a0f02d831e57a9ce6e944e234a",
    "de_DE-thorsten-medium": "974adee790533adb273a1ac88f49027d2a1b8f0f2cf4905954a4791e79264e85",
    "en_US-ljspeech-medium": "141d612cc0a95ed7efc1ca936b845c2364967f2e9217c5dbfcf69fc4d6c65860",
    "pt_BR-faber-medium": "7e694de195ae3fc36dd732c445eb04fb49b649854893cb5506b978f0d50a1d6f",
    "vi_VN-vais1000-medium": "fafb9da1354ed4b77c31af228ed41fb41cd825c14cffa105454b25e6ae751ee0",
    "de_DE-mls-medium": "b0af1c89ddfdc72d32e015729b0e89b99eec13c2c8caa1db7488d98e9e570b40",
}

ROOT = Path(__file__).resolve().parents[1]
LINES = json.loads((ROOT / "tools" / "lines.json").read_text(encoding="utf-8"))
LEGACY = {
    "de": "de_DE-thorsten-medium",
    "en": "en_US-ljspeech-medium",
    "pt-BR": "pt_BR-faber-medium",
    "vi": "vi_VN-vais1000-medium",
}
# Free voices added in 0.4.0. speaker is the Piper id for a multi-speaker model.
EXTRA = [
    {"lang": "vi", "model": "vi_VN-vivos-x_low", "speaker": 9, "voice": "vivos-22"},
    {"lang": "vi", "model": "vi_VN-vivos-x_low", "speaker": 37, "voice": "vivos-32"},
    {"lang": "de", "model": "de_DE-thorsten-high", "speaker": None, "voice": "thorsten-high"},
    {"lang": "en", "model": "en_US-joe-medium", "speaker": None, "voice": "joe"},
    {"lang": "pt-BR", "model": "pt_BR-cadu-medium", "speaker": None, "voice": "cadu"},
    # MLS speaker 4576, Piper id 153. Female, medium, CC BY 4.0, trained from scratch.
    {"lang": "de", "model": "de_DE-mls-medium", "speaker": 153, "voice": "mls-4576"},
]


def require_piper() -> None:
    import importlib.metadata

    found = importlib.metadata.version("piper-tts")
    if found != PIPER_VERSION:
        raise SystemExit(f"piper-tts {found} is not the pinned {PIPER_VERSION}")


def require_onnx() -> None:
    """Pin used by align_clips.py. generate_audio.py does not call this."""
    import importlib.metadata

    try:
        found = importlib.metadata.version("onnx")
    except importlib.metadata.PackageNotFoundError:
        raise SystemExit(f"onnx {ONNX_VERSION} is not installed") from None
    if found != ONNX_VERSION:
        raise SystemExit(f"onnx {found} is not the pinned {ONNX_VERSION}")


def require_model(model_dir: Path, model: str) -> None:
    expected = MODEL_SHA256.get(model)
    expected_json = JSON_SHA256.get(model)
    if expected is None or expected_json is None:
        raise SystemExit(f"no pinned checksum for {model}")
    digest = hashlib.sha256((model_dir / f"{model}.onnx").read_bytes()).hexdigest()
    if digest != expected:
        raise SystemExit(f"checksum mismatch for {model}")
    digest_json = hashlib.sha256((model_dir / f"{model}.onnx.json").read_bytes()).hexdigest()
    if digest_json != expected_json:
        raise SystemExit(f"checksum mismatch for {model}.onnx.json")


def main() -> None:
    logging.getLogger("piper").setLevel(logging.ERROR)
    require_piper()
    if len(sys.argv) >= 2 and sys.argv[1] == "extra":
        model_dir = Path(sys.argv[2])
        only = sys.argv[3] if len(sys.argv) >= 4 else None
        for job in EXTRA:
            if only and job["voice"] != only:
                continue
            synthesize(job["lang"], model_dir, job["model"], job["voice"], job["speaker"])
        write_manifest()
        write_samples()
        return
    lang = sys.argv[1]
    model_dir = Path(sys.argv[2])
    synthesize(lang, model_dir, LEGACY[lang], None, None)
    write_manifest()


def synthesize(lang: str, model_dir: Path, model: str, voice: str | None, speaker: int | None) -> None:
    require_model(model_dir, model)
    loaded = PiperVoice.load(model_dir / f"{model}.onnx")
    rows = [row for row in LINES if row["lang"] == lang]
    syn = SynthesisConfig(speaker_id=speaker, normalize_audio=True)
    label = voice or "legacy"
    for index, row in enumerate(rows, start=1):
        relative = Path(row["file"])
        if voice:
            relative = Path(lang) / voice / relative.name
        target = ROOT / "public" / "audio" / relative
        tempos = [
            (target, None),
            (target.with_name(target.name.replace(".m4a", ".r70.m4a")), 0.7),
            (target.with_name(target.name.replace(".m4a", ".r85.m4a")), 0.85),
        ]
        if all(path.exists() and path.stat().st_size > 0 for path, _tempo in tempos):
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        wav = target.with_suffix(".wav")
        with wave.open(str(wav), "wb") as handle:
            loaded.synthesize_wav(row["text"], handle, syn_config=syn)
        for dest, tempo in tempos:
            encode(wav, dest, tempo)
        wav.unlink(missing_ok=True)
        if index % 25 == 0:
            print(f"{label} {index}/{len(rows)}", flush=True)
    print(f"{label} done {len(rows)}", flush=True)


def encode(wav: Path, dest: Path, tempo: float | None) -> None:
    command = ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav)]
    if tempo is not None:
        command += ["-filter:a", f"atempo={tempo}"]
    command += ["-c:a", "aac", "-b:a", "48k", "-ac", "1", str(dest)]
    subprocess.run(command, check=True)


def write_manifest() -> None:
    audio = ROOT / "public" / "audio"
    names = []
    for path in audio.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix == ".m4a" or path.name.endswith(".align.json"):
            names.append(path.relative_to(audio).as_posix())
    files = sorted(names)
    (audio / "manifest.json").write_text(json.dumps(files, indent=2) + "\n", encoding="utf-8")
    print(f"manifest {len(files)}", flush=True)


def write_samples() -> None:
    """Short mp3s of one phrase so the files can be heard without the whole set."""
    samples = ROOT / "docs" / "samples"
    samples.mkdir(parents=True, exist_ok=True)
    jobs = [
        ("vi/vivos-22/emergency.peanut__south__base.m4a", "vi-mann-1-erdnuss.mp3"),
        ("vi/vivos-32/emergency.peanut__south__base.m4a", "vi-mann-2-erdnuss.mp3"),
        ("de/thorsten-high/emergency.peanut__any__base.m4a", "de-mann-erdnuss.mp3"),
        ("de/mls-4576/emergency.peanut__any__base.m4a", "de-frau-erdnuss.mp3"),
        ("pt-BR/cadu/emergency.peanut__any__base.m4a", "pt-mann-erdnuss.mp3"),
    ]
    for source, name in jobs:
        src = ROOT / "public" / "audio" / source
        if not src.exists():
            raise SystemExit(f"missing sample source {source}")
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-codec:a", "libmp3lame", "-q:a", "5", str(samples / name)],
            check=True,
        )
    print("samples", flush=True)


if __name__ == "__main__":
    main()
