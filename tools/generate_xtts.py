"""Synthesize pt-BR clips with Coqui XTTS-v2. Weights stay outside the repo.

Hugging Face model coqui/XTTS-v2, language pt, three built-in speakers.
The revision and the SHA-256 of each file are pinned and checked before synthesis.
Output matches the Piper pipeline: peak-normalised WAV, AAC 48 kbit/s mono at
22050 Hz, plus ffmpeg atempo 0.7 and 0.85. A clip under 0.3 s, or a clip under
0.45 s that is mostly unvoiced, is synthesised again. tools/check-clips.ts
applies that bar with the same pitch settings as the app.
"""

from __future__ import annotations

import hashlib
import json
import re
import shutil
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

COQUI_VERSION = "0.27.2"
XTTS_REVISION = "6c2b0d75eae4b7047358e3b6bd9325f857d43f77"
# SHA-256 of the files at that revision. model.pth is the weights.
XTTS_SHA256 = {
    "config.json": "ef262b1454dd2a77e1461b0b2cd53e19b8a7624cc131b837d36df67356bc75e8",
    "vocab.json": "928260878a59da8a72a2a5b7687fea29d5106137669d90945430fe17e415304a",
    "speakers_xtts.pth": "f0f6137c19a4eab0cbbe4c99b5babacf68b1746e50da90807708c10e645b943b",
    "dvae.pth": "b29bc227d410d4991e0a8c09b858f77415013eeb9fba9650258e96095557d97a",
    "mel_stats.pth": "1f69422a8a8f344c4fca2f0c6b8d41d2151d6615b7321e48e6bb15ae949b119c",
    "model.pth": "c7ea20001c6a0a841c77e252d8409f6a74fb423e79b3206a0771ba5989776187",
    "hash.md5": "ef2e25fc4639bb81c6c5048740c1ee8268606a160548abaa2e2fe03b12278c54",
    "LICENSE.txt": "190f6d7c19b8984f91b97712b94ce92d2b2e640fc677dacab966e955ece9d043",
}
LANGUAGE = "pt"
TEMPERATURE = 0.75
LENGTH_PENALTY = 1.0
REPETITION_PENALTY = 5.0
TOP_K = 50
TOP_P = 0.85
SAMPLE_RATE = 24000
SHIP_RATE = 22050
MIN_SECONDS = 0.3
ATTEMPTS = 4

SPEAKERS = [
    {"speaker": "Daisy Studious", "voice": "daisy-studious"},
    {"speaker": "Gracie Wise", "voice": "gracie-wise"},
    {"speaker": "Tammie Ema", "voice": "tammie-ema"},
    # Experimental. Dropped after the run when the length check still fails.
    {"speaker": "Claribel Dervla", "voice": "claribel-dervla", "experimental": True},
]
# Full-speed ceiling: words * 0.72 + 0.85. The same formula is in
# src/pitch/clip-plausible.ts. A spoken "." / "?" / "!" pushes a short line over it.
# No offline ASR is installed here, so the check is this length, not a transcript.
WORD_SECONDS = 0.72
LENGTH_SLACK = 0.85
# Probe noise around the ceiling. 0.03 s keeps "Hoje." at 1.62 s over the limit.
LENGTH_TOLERANCE = 0.03
TRAILING_PUNCT = re.compile(r"[.!?…]+$")
WORD_CHARS = re.compile(r"\w+", re.UNICODE)

ROOT = Path(__file__).resolve().parents[1]
LINES = json.loads((ROOT / "tools" / "lines.json").read_text(encoding="utf-8"))


def require_coqui() -> None:
    import importlib.metadata

    found = importlib.metadata.version("coqui-tts")
    if found != COQUI_VERSION:
        raise SystemExit(f"coqui-tts {found} is not the pinned {COQUI_VERSION}")


def require_model(model_dir: Path) -> None:
    for name, expected in XTTS_SHA256.items():
        path = model_dir / name
        if not path.is_file():
            raise SystemExit(f"missing {name}")
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if digest != expected:
            raise SystemExit(f"checksum mismatch for {name}")


def clip_seed(speaker: str, text: str, attempt: int) -> int:
    digest = hashlib.sha256(f"{XTTS_REVISION}\n{speaker}\n{text}\n{attempt}".encode()).digest()
    return int.from_bytes(digest[:4], "big") % (2**31 - 1)


def write_wav(path: Path, audio: np.ndarray) -> None:
    peak = float(np.max(np.abs(audio))) if audio.size else 0.0
    if peak > 0:
        audio = audio / peak
    pcm = np.clip(audio * 32767.0, -32768, 32767).astype(np.int16)
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(SAMPLE_RATE)
        handle.writeframes(pcm.tobytes())


def encode(wav: Path, dest: Path, tempo: float | None) -> None:
    command = ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-ar", str(SHIP_RATE), "-ac", "1"]
    if tempo is not None:
        command += ["-filter:a", f"atempo={tempo}"]
    command += ["-c:a", "aac", "-b:a", "48k", str(dest)]
    subprocess.run(command, check=True)


def duration_seconds(path: Path) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        check=True,
        capture_output=True,
        text=True,
    )
    return float(result.stdout.strip())


def synthesize_attempt(model, config, speaker: str, text: str, wav: Path, attempt: int) -> float | None:
    import torch

    speed = 1.0 if attempt < 2 else 0.85
    torch.manual_seed(clip_seed(speaker, text, attempt))
    out = model.synthesize(
        text,
        config,
        speaker=speaker,
        language=LANGUAGE,
        temperature=TEMPERATURE,
        length_penalty=LENGTH_PENALTY,
        repetition_penalty=REPETITION_PENALTY,
        top_k=TOP_K,
        top_p=TOP_P,
        speed=speed,
        enable_text_splitting=False,
    )
    audio = np.asarray(out["wav"], dtype=np.float32)
    if audio.size < int(MIN_SECONDS * SAMPLE_RATE):
        return None
    write_wav(wav, audio)
    heard = duration_seconds(wav)
    if heard < MIN_SECONDS:
        return None
    return heard


def synthesize_one(model, config, speaker: str, text: str, wav: Path) -> int:
    for attempt in range(ATTEMPTS):
        if synthesize_attempt(model, config, speaker, text, wav, attempt) is not None:
            return attempt
    raise SystemExit(f"too short after {ATTEMPTS} attempts: {speaker} {text}")


def check_voice(paths: list[Path]) -> list[dict[str, str]]:
    listing = Path("/tmp/xtts-check-list.txt")
    report_path = Path("/tmp/xtts-clip-problems.json")
    report_path.unlink(missing_ok=True)
    listing.write_text("".join(f"{path}\n" for path in paths), encoding="utf-8")
    result = subprocess.run(
        ["npx", "tsx", "tools/check-clips.ts", str(listing)],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    listing.unlink(missing_ok=True)
    report_path = Path("/tmp/xtts-clip-problems.json")
    if not report_path.exists():
        raise SystemExit(result.stderr or result.stdout or "clip check wrote no report")
    report = json.loads(report_path.read_text(encoding="utf-8"))
    if result.returncode not in (0, 1):
        raise SystemExit(result.stderr or result.stdout)
    return report["bad"]


def tempos_for(target: Path) -> list[tuple[Path, float | None]]:
    return [
        (target, None),
        (target.with_name(target.name.replace(".m4a", ".r70.m4a")), 0.7),
        (target.with_name(target.name.replace(".m4a", ".r85.m4a")), 0.85),
    ]


def write_tempos(model, config, speaker: str, text: str, target: Path) -> bool:
    tempos = tempos_for(target)
    if all(path.exists() and path.stat().st_size > 0 for path, _tempo in tempos):
        return False
    target.parent.mkdir(parents=True, exist_ok=True)
    wav = target.with_suffix(".wav")
    synthesize_one(model, config, speaker, text, wav)
    for dest, tempo in tempos:
        encode(wav, dest, tempo)
    wav.unlink(missing_ok=True)
    return True


def strip_trailing_punctuation(text: str) -> str:
    stripped = TRAILING_PUNCT.sub("", text.strip()).strip()
    return stripped or text.strip()


def expected_seconds(text: str) -> float:
    words = WORD_CHARS.findall(strip_trailing_punctuation(text))
    return max(1, len(words)) * WORD_SECONDS + LENGTH_SLACK


def expand_tempos(paths: list[Path]) -> list[Path]:
    slow: list[Path] = []
    for path in paths:
        slow.extend(dest for dest, _tempo in tempos_for(path))
    return slow


def forget_align(target: Path) -> None:
    align = target.with_suffix(".align.json")
    align.unlink(missing_ok=True)


def resynthesize(model, config, speaker: str, text: str, target: Path) -> float | None:
    """Write a new take that fits the expected length. None when every attempt misses it."""
    limit = expected_seconds(text) + LENGTH_TOLERANCE
    wav = target.with_suffix(".wav")
    chosen: float | None = None
    for attempt in range(ATTEMPTS):
        heard = synthesize_attempt(model, config, speaker, text, wav, attempt)
        if heard is None:
            continue
        if heard <= limit:
            chosen = heard
            break
        print(f"  attempt {attempt} {heard:.2f}s > {limit:.2f}s", flush=True)
    if chosen is None:
        wav.unlink(missing_ok=True)
        return None
    for path in expand_tempos([target]):
        path.unlink(missing_ok=True)
    forget_align(target)
    for dest, tempo in tempos_for(target):
        encode(wav, dest, tempo)
    wav.unlink(missing_ok=True)
    return chosen


def repair_punctuation(model, config, speaker: str, voice: str, rows: list[dict]) -> tuple[list[dict], list[dict]]:
    """Re-render clips that are longer than the word-count ceiling, without trailing punctuation."""
    replaced: list[dict] = []
    failed: list[dict] = []
    for row in rows:
        target = ROOT / "public" / "audio" / "pt-BR" / voice / Path(row["file"]).name
        if not target.exists():
            failed.append({"file": target.name, "text": row["text"], "reason": "missing"})
            continue
        limit = expected_seconds(row["text"])
        heard = duration_seconds(target)
        if heard <= limit + LENGTH_TOLERANCE:
            continue
        bare = strip_trailing_punctuation(row["text"])
        print(f"{voice} long {target.name} {heard:.2f}s > {limit:.2f}s", flush=True)
        fresh = resynthesize(model, config, speaker, bare, target)
        record = {"file": target.name, "text": row["text"], "spoken": bare, "limit": round(expected_seconds(bare), 3)}
        if fresh is None:
            record["seconds"] = round(heard, 3)
            record["reason"] = (
                "still over expected length after stripping trailing punctuation"
                if bare != row["text"].strip()
                else "over expected length and a new take missed the ceiling"
            )
            failed.append(record)
            print(f"{voice} still long {target.name}", flush=True)
        else:
            record["seconds"] = round(fresh, 3)
            replaced.append(record)
            print(f"{voice} repaired {target.name} {fresh:.2f}s", flush=True)
    return replaced, failed


def drop_voice(voice: str) -> None:
    folder = ROOT / "public" / "audio" / "pt-BR" / voice
    if folder.exists():
        shutil.rmtree(folder)
    print(f"{voice} not shipped", flush=True)


def render(model_dir: Path, words_only: bool = False) -> None:
    import torch
    from TTS.tts.configs.xtts_config import XttsConfig
    from TTS.tts.models.xtts import Xtts

    torch.set_num_threads(4)
    require_model(model_dir)
    config = XttsConfig()
    config.load_json(str(model_dir / "config.json"))
    model = Xtts.init_from_config(config)
    model.load_checkpoint(config, checkpoint_dir=str(model_dir), eval=True, use_deepspeed=False)
    model.cpu()
    names = set(model.speaker_manager.speakers)
    rows = [row for row in LINES if row["lang"] == "pt-BR"]
    if not rows:
        raise SystemExit("no pt-BR lines in tools/lines.json")
    rejected: set[str] = set()
    for job in SPEAKERS:
        if job["speaker"] not in names:
            raise SystemExit(f"speaker missing: {job['speaker']}")
        voice = job["voice"]
        experimental = bool(job.get("experimental"))
        if not words_only:
            made = 0
            for index, row in enumerate(rows, start=1):
                target = ROOT / "public" / "audio" / "pt-BR" / voice / Path(row["file"]).name
                if not write_tempos(model, config, job["speaker"], row["text"], target):
                    continue
                made += 1
                if index % 25 == 0 or made == 1:
                    print(f"{voice} {index}/{len(rows)}", flush=True)
            if made:
                paths = [ROOT / "public" / "audio" / "pt-BR" / voice / Path(row["file"]).name for row in rows]
                bad = check_voice(expand_tempos(paths))
                if bad:
                    print(json.dumps({"voice": voice, "bad": bad}, ensure_ascii=False), flush=True)
                    if experimental:
                        rejected.add(voice)
                    else:
                        raise SystemExit(f"{voice} failed the duration or voicing check")
        if voice not in rejected:
            replaced, failed = repair_punctuation(model, config, job["speaker"], voice, rows)
            if replaced:
                bad = check_voice(expand_tempos([ROOT / "public" / "audio" / "pt-BR" / voice / item["file"] for item in replaced]))
                if bad:
                    print(json.dumps({"voice": voice, "repaired": bad}, ensure_ascii=False), flush=True)
                    if experimental:
                        rejected.add(voice)
                    else:
                        raise SystemExit(f"{voice} failed the duration or voicing check after the punctuation repair")
            if failed:
                print(json.dumps({"voice": voice, "punctuation": failed}, ensure_ascii=False), flush=True)
                if experimental:
                    rejected.add(voice)
                else:
                    raise SystemExit(f"{voice} stayed over the expected length")
        if voice in rejected:
            print(f"{voice} sentences rejected", flush=True)
            continue
        license_src = model_dir / "LICENSE.txt"
        notice = (
            "Travel Talk. Audio in this folder is synthesized offline with Coqui XTTS-v2.\n"
            f"Speaker: {job['speaker']}. Language: pt. The weights are not in this repository.\n"
            f"Revision: {XTTS_REVISION}\n"
            f"SHA-256 model.pth: {XTTS_SHA256['model.pth']}\n"
            "The model and this output are under the Coqui Public Model License 1.0.0.\n"
            "Non-commercial use only. https://coqui.ai/cpml.txt\n\n"
        )
        (ROOT / "public" / "audio" / "pt-BR" / voice / "LICENSE.txt").write_text(
            notice + license_src.read_text(encoding="utf-8"),
            encoding="utf-8",
        )
        print(f"{voice} done {len(rows)}", flush=True)
    render_words(model, config, rejected)
    for voice in rejected:
        drop_voice(voice)


def render_words(model, config, rejected: set[str]) -> None:
    """Citation clips. Same tempos as Piper words, and no align.json, matching 0.9.0."""
    rows = json.loads((ROOT / "tools" / "word-lines.json").read_text(encoding="utf-8"))
    rows = [row for row in rows if row["lang"] == "pt-BR"]
    if len(rows) != 19:
        raise SystemExit(f"expected 19 pt-BR word lines, found {len(rows)}")
    for job in SPEAKERS:
        voice = job["voice"]
        if voice in rejected:
            continue
        experimental = bool(job.get("experimental"))
        made = 0
        for index, row in enumerate(rows, start=1):
            target = ROOT / "public" / "audio" / "pt-BR" / voice / Path(row["file"]).name
            if not write_tempos(model, config, job["speaker"], row["text"], target):
                continue
            made += 1
            print(f"{voice} word {index}/{len(rows)} {row['text']}", flush=True)
        paths = [ROOT / "public" / "audio" / "pt-BR" / voice / Path(row["file"]).name for row in rows]
        if made or experimental:
            bad = check_voice(expand_tempos(paths))
            if bad:
                print(json.dumps({"voice": voice, "words": bad}, ensure_ascii=False), flush=True)
                if experimental:
                    rejected.add(voice)
                    continue
                raise SystemExit(f"{voice} word clips failed the duration or voicing check")
        _replaced, failed = repair_punctuation(model, config, job["speaker"], voice, rows)
        if failed:
            print(json.dumps({"voice": voice, "wordPunctuation": failed}, ensure_ascii=False), flush=True)
            if experimental:
                rejected.add(voice)
                continue
            raise SystemExit(f"{voice} word clips stayed over the expected length")
        print(f"{voice} words done {len(rows)} new {made}", flush=True)


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


def main() -> None:
    require_coqui()
    args = sys.argv[1:]
    words_only = "--words-only" in args
    args = [arg for arg in args if arg != "--words-only"]
    if len(args) != 1:
        raise SystemExit("usage: generate_xtts.py <model-dir> [--words-only]")
    render(Path(args[0]), words_only=words_only)
    write_manifest()


if __name__ == "__main__":
    main()
