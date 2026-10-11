"""Synthesize committed speech files with Piper. Models stay outside the repo."""

import json
import logging
import subprocess
import sys
import wave
from pathlib import Path

from piper import PiperVoice
from piper.config import SynthesisConfig

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
]


def main() -> None:
    logging.getLogger("piper").setLevel(logging.ERROR)
    if len(sys.argv) >= 2 and sys.argv[1] == "extra":
        model_dir = Path(sys.argv[2])
        for job in EXTRA:
            synthesize(job["lang"], model_dir, job["model"], job["voice"], job["speaker"])
        write_manifest()
        write_samples()
        return
    lang = sys.argv[1]
    model_dir = Path(sys.argv[2])
    synthesize(lang, model_dir, LEGACY[lang], None, None)
    write_manifest()


def synthesize(lang: str, model_dir: Path, model: str, voice: str | None, speaker: int | None) -> None:
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
    files = sorted(path.relative_to(audio).as_posix() for path in audio.rglob("*.m4a"))
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
