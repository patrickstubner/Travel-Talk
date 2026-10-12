"""Citation-form word clips for the daily block. Models stay outside the repo.

One male voice per language, both Vietnamese male voices, three tempos.
"""

import json
import logging
import sys
import wave
from pathlib import Path

from piper import PiperVoice
from piper.config import SynthesisConfig

from generate_audio import encode, require_model, require_piper

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    logging.getLogger("piper").setLevel(logging.ERROR)
    require_piper()
    model_dir = Path(sys.argv[1])
    rows = json.loads((ROOT / "tools" / "word-lines.json").read_text(encoding="utf-8"))
    loaded: dict[tuple[str, int | None], PiperVoice] = {}
    for index, row in enumerate(rows, start=1):
        speaker = row["speaker"]
        key = (row["model"], speaker)
        if key not in loaded:
            require_model(model_dir, row["model"])
            loaded[key] = PiperVoice.load(model_dir / f"{row['model']}.onnx")
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
        syn = SynthesisConfig(speaker_id=speaker, normalize_audio=True)
        with wave.open(str(wav), "wb") as handle:
            loaded[key].synthesize_wav(row["text"], handle, syn_config=syn)
        for dest, tempo in tempos:
            encode(wav, dest, tempo)
        wav.unlink(missing_ok=True)
        if index % 10 == 0:
            print(f"words {index}/{len(rows)}", flush=True)
    print(f"words done {len(rows)}", flush=True)


if __name__ == "__main__":
    main()
