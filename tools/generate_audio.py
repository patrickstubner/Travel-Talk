"""Synthesize committed speech files with Piper. Models stay outside the repo."""

import json
import subprocess
import sys
import wave
from pathlib import Path

from piper import PiperVoice

ROOT = Path(__file__).resolve().parents[1]
LINES = json.loads((ROOT / "tools" / "lines.json").read_text(encoding="utf-8"))
MODELS = {
    "de": "de_DE-thorsten-medium",
    "en": "en_US-ljspeech-medium",
    "pt-BR": "pt_BR-faber-medium",
    "vi": "vi_VN-vais1000-medium",
}


def main() -> None:
    lang = sys.argv[1]
    model_dir = Path(sys.argv[2])
    voice = PiperVoice.load(model_dir / f"{MODELS[lang]}.onnx")
    rows = [row for row in LINES if row["lang"] == lang]
    for index, row in enumerate(rows, start=1):
        target = ROOT / "public" / "audio" / row["file"]
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
            voice.synthesize_wav(row["text"], handle)
        for dest, tempo in tempos:
            encode(wav, dest, tempo)
        wav.unlink(missing_ok=True)
        if index % 25 == 0:
            print(f"{lang} {index}/{len(rows)}", flush=True)
    print(f"{lang} done {len(rows)}", flush=True)


def encode(wav: Path, dest: Path, tempo: float | None) -> None:
    command = ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav)]
    if tempo is not None:
        command += ["-filter:a", f"atempo={tempo}"]
    command += ["-c:a", "aac", "-b:a", "48k", "-ac", "1", str(dest)]
    subprocess.run(command, check=True)


if __name__ == "__main__":
    main()
