"""Synthesize explanation clips. Models stay outside the repo. Sentence audio is left as it is."""

import json
import sys
from pathlib import Path

from piper import PiperVoice
from piper.config import SynthesisConfig

from generate_audio import encode, require_model, require_piper, write_manifest
from help_stamp import clip_is_current, load_hashes, save_hashes, text_hash

ROOT = Path(__file__).resolve().parents[1]
MODELS = {
    "de": ("de_DE-thorsten-high", None),
    "en": ("en_US-joe-medium", None),
    "pt-BR": ("pt_BR-cadu-medium", None),
    "vi": ("vi_VN-vivos-x_low", 9),
}


def main() -> None:
    require_piper()
    lines = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    model_dir = Path(sys.argv[2])
    hashes = load_hashes()
    pending = []
    for row in lines:
        dest = ROOT / "public" / "audio" / row["file"]
        if clip_is_current(dest, row["text"], hashes.get(row["file"])):
            continue
        pending.append(row)
    by_lang: dict[str, list[dict[str, str]]] = {}
    for row in pending:
        by_lang.setdefault(row["file"].split("/", 1)[0], []).append(row)
    for lang, rows in by_lang.items():
        model, speaker = MODELS[lang]
        require_model(model_dir, model)
        loaded = PiperVoice.load(model_dir / f"{model}.onnx")
        syn = SynthesisConfig(speaker_id=speaker, normalize_audio=True)
        for index, row in enumerate(rows, start=1):
            dest = ROOT / "public" / "audio" / row["file"]
            dest.parent.mkdir(parents=True, exist_ok=True)
            wav = dest.with_suffix(".wav")
            import wave

            with wave.open(str(wav), "wb") as handle:
                loaded.synthesize_wav(row["text"], handle, syn_config=syn)
            encode(wav, dest, None)
            wav.unlink(missing_ok=True)
            hashes[row["file"]] = text_hash(row["text"])
            save_hashes(hashes)
            if index % 20 == 0:
                print(f"{lang} {index}/{len(rows)}", flush=True)
        print(f"{lang} done {len(rows)}", flush=True)
    write_manifest()


if __name__ == "__main__":
    main()
