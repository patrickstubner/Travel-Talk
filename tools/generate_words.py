"""Citation-form word clips for the daily block. Models stay outside the repo.

One voice per language, both Vietnamese male voices, and the optional German woman, three tempos.
"""

import json
import logging
import sys
import wave
from pathlib import Path

import numpy as np
from piper import PiperVoice
from piper.config import SynthesisConfig

from generate_audio import CARRIERS, cut_carrier_word, encode, require_model, require_piper, write_wav

ROOT = Path(__file__).resolve().parents[1]
# Bare citation forms collapse to about 0.2 s of noise for this speaker. The clip is
# the first word of a carrier, synthesized with noise scales at 0 so a later run matches.
# The noise check rejects a full-speed clip under 0.3 s. A real first word can be
# shorter than that, so the file keeps a quiet tail past the cut.
MIN_WORD_SECONDS = 0.36
WORD_CARRIERS = {
    ("mls-4576", "ich"): "ich heisse Anna.",
    ("mls-4576", "ja"): "ja gerne.",
    ("mls-4576", "bitte"): "Bitte schön.",
    ("mls-4576", "danke"): "Danke schön.",
    ("mls-4576", "hier"): "hier bitte.",
    ("mls-4576", "wo"): "wo ist das.",
    ("mls-4576", "Wasser"): "Wasser bitte.",
    ("mls-4576", "Gesuch"): "Gesuch bitte.",
}


def main() -> None:
    logging.getLogger("piper").setLevel(logging.ERROR)
    require_piper()
    model_dir = Path(sys.argv[1])
    only = sys.argv[2] if len(sys.argv) >= 3 else None
    rows = json.loads((ROOT / "tools" / "word-lines.json").read_text(encoding="utf-8"))
    loaded: dict[tuple[str, int | None], PiperVoice] = {}
    aligned: set[tuple[str, int | None]] = set()
    for index, row in enumerate(rows, start=1):
        if only and row["voice"] != only:
            continue
        speaker = row["speaker"]
        key = (row["model"], speaker)
        carrier = WORD_CARRIERS.get((row["voice"], row["text"]))
        if key not in loaded:
            require_model(model_dir, row["model"])
            needs_align = any(item[0] == row["voice"] for item in WORD_CARRIERS)
            loaded[key] = PiperVoice.load(model_dir / f"{row['model']}.onnx", include_alignments=needs_align)
            if needs_align:
                aligned.add(key)
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
        if carrier:
            if key not in aligned:
                raise SystemExit(f"carrier cut needs alignments for {row['voice']}")
            CARRIERS[row["text"]] = carrier
            clip, rate, _start, _end = cut_carrier_word(loaded[key], row["text"], speaker)
            minimum = int(rate * MIN_WORD_SECONDS)
            if len(clip) < minimum:
                clip = np.concatenate([clip, np.zeros(minimum - len(clip), dtype=np.float32)])
            write_wav(wav, clip, rate)
        else:
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
