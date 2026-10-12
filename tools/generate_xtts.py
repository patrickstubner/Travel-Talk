"""Synthesize pt-BR clips with Coqui XTTS-v2. Weights stay outside the repo.

Hugging Face model coqui/XTTS-v2, language pt. The revision and the SHA-256 of
each file are pinned and checked before synthesis. Every sentence and word is
spoken without trailing punctuation. faster-whisper small then rejects a take
whose transcript names a punctuation mark or runs longer than the text.
Output matches the Piper pipeline: peak-normalised WAV, AAC 48 kbit/s mono at
22050 Hz, plus ffmpeg atempo 0.7 and 0.85. A clip under 0.3 s, or a clip under
0.45 s that is mostly unvoiced, is synthesised again. tools/check-clips.ts
applies that bar with the same pitch settings as the app.
faster-whisper is a generation tool, not an app dependency.
"""

from __future__ import annotations

import hashlib
import json
import re
import subprocess
import sys
import unicodedata
import wave
from pathlib import Path

import numpy as np

COQUI_VERSION = "0.27.2"
FASTER_WHISPER = "1.2.1"
AV_VERSION = "15.1.0"
WHISPER_MODEL = "small"
WHISPER_BEAM = 5
XTTS_REVISION = "6c2b0d75eae4b7047358e3b6bd9325f857d43f77"
CPML_URL = f"https://huggingface.co/coqui/XTTS-v2/resolve/{XTTS_REVISION}/LICENSE.txt"
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
    # Trial voice. She stays. Delete this entry and set SHIP_CLARIBEL false in
    # src/audio/voices.ts to remove her. A failed check does not delete the folder.
    {"speaker": "Claribel Dervla", "voice": "claribel-dervla", "experimental": True},
]
# Full-speed ceiling: words * 0.72 + 0.85. The same formula is in
# src/pitch/clip-plausible.ts. Trailing punctuation is not spoken.
# faster-whisper small is the transcript check.
WORD_SECONDS = 0.72
LENGTH_SLACK = 0.85
# Probe noise around the ceiling. 0.03 s keeps "Hoje." at 1.62 s over the limit.
LENGTH_TOLERANCE = 0.03
# Whisper sometimes splits one spoken word into two. Two extra words still fail.
EXTRA_WORDS = 1
TRAILING_PUNCT = re.compile(r"[.!?…]+$")
WORD_CHARS = re.compile(r"\w+", re.UNICODE)
INNER_PUNCT = re.compile(r"[,:;!?…\"“”«»]+")
# Spoken names of punctuation. Folded, so accents do not matter.
PUNCT_WORDS = frozenset({
    "ponto",
    "pontos",
    "virgula",
    "virgulas",
    "interrogacao",
    "interrogacoes",
    "exclamacao",
    "exclamacoes",
    "reticencias",
})

ROOT = Path(__file__).resolve().parents[1]
LINES = json.loads((ROOT / "tools" / "lines.json").read_text(encoding="utf-8"))


def require_coqui() -> None:
    import importlib.metadata

    found = importlib.metadata.version("coqui-tts")
    if found != COQUI_VERSION:
        raise SystemExit(f"coqui-tts {found} is not the pinned {COQUI_VERSION}")
    whisper = importlib.metadata.version("faster-whisper")
    if whisper != FASTER_WHISPER:
        raise SystemExit(f"faster-whisper {whisper} is not the pinned {FASTER_WHISPER}")
    av_found = importlib.metadata.version("av")
    if av_found != AV_VERSION:
        raise SystemExit(f"av {av_found} is not the pinned {AV_VERSION}")


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


def clip_ready(target: Path) -> bool:
    return all(path.exists() and path.stat().st_size > 0 for path, _tempo in tempos_for(target))


def strip_trailing_punctuation(text: str) -> str:
    stripped = TRAILING_PUNCT.sub("", text.strip()).strip()
    return stripped or text.strip()


def has_trailing_punctuation(text: str) -> bool:
    return strip_trailing_punctuation(text) != text.strip()


def strip_all_punctuation(text: str) -> str:
    bare = INNER_PUNCT.sub(" ", strip_trailing_punctuation(text))
    bare = re.sub(r"\s+", " ", bare).strip()
    return bare or strip_trailing_punctuation(text)


def spoken_forms(text: str) -> list[str]:
    """Trailing punctuation is never spoken. Inner marks are a later attempt."""
    forms = [strip_trailing_punctuation(text)]
    bare = strip_all_punctuation(text)
    if bare != forms[0]:
        forms.append(bare)
    return forms


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


def fold_token(token: str) -> str:
    decomposed = unicodedata.normalize("NFD", token.lower())
    return "".join(char for char in decomposed if unicodedata.category(char) != "Mn")


def transcript_words(text: str) -> list[str]:
    return [fold_token(token) for token in re.findall(r"[^\W_]+", text, flags=re.UNICODE)]


def asr_problem(transcript: str, expected: str) -> str | None:
    """A take fails when it adds a punctuation word or contains more words than the text.

    "ponto" in "ponto de táxi" is the taxi rank, so a word counts only when the
    transcript has more copies than the line.
    """
    heard = transcript_words(transcript)
    wanted = transcript_words(strip_all_punctuation(expected))
    if not heard:
        return "empty transcript"
    extra = [word for word in sorted(PUNCT_WORDS) if heard.count(word) > wanted.count(word)]
    if extra:
        return "punctuation word " + " ".join(extra) + f": {' '.join(heard)}"
    if len(heard) > len(wanted) + EXTRA_WORDS:
        return f"transcript longer {len(heard)}>{len(wanted)}+{EXTRA_WORDS}: {' '.join(heard)}"
    return None


_whisper = None


def whisper_model():
    global _whisper
    if _whisper is None:
        from faster_whisper import WhisperModel

        _whisper = WhisperModel(WHISPER_MODEL, device="cpu", compute_type="int8")
    return _whisper


def transcribe(path: Path) -> str:
    # temperature 0 keeps the beam search from falling through to random samples.
    segments, _info = whisper_model().transcribe(
        str(path),
        language=LANGUAGE,
        beam_size=WHISPER_BEAM,
        temperature=0.0,
        condition_on_previous_text=False,
    )
    return " ".join(segment.text.strip() for segment in segments)


def judge_file(path: Path, text: str) -> str | None:
    limit = expected_seconds(text) + LENGTH_TOLERANCE
    heard = duration_seconds(path)
    if heard > limit:
        return f"length {heard:.3f}>{limit:.3f}"
    if heard < MIN_SECONDS:
        return f"short {heard:.3f}"
    return asr_problem(transcribe(path), text)


def commit_wav(wav: Path, target: Path) -> None:
    for path in expand_tempos([target]):
        path.unlink(missing_ok=True)
    forget_align(target)
    for dest, tempo in tempos_for(target):
        encode(wav, dest, tempo)
    wav.unlink(missing_ok=True)


def synthesize_clean(model, config, speaker: str, text: str, target: Path, attempt_base: int = 0) -> dict | None:
    """None when a take fits the length and the transcript. Otherwise the last failure."""
    wav = target.with_suffix(".wav")
    target.parent.mkdir(parents=True, exist_ok=True)
    last: dict | None = None
    for spoken in spoken_forms(text):
        limit = expected_seconds(spoken) + LENGTH_TOLERANCE
        for attempt in range(attempt_base, attempt_base + ATTEMPTS):
            heard = synthesize_attempt(model, config, speaker, spoken, wav, attempt)
            record = {"file": target.name, "text": text, "spoken": spoken, "attempt": attempt}
            if heard is None:
                record["reason"] = "too short"
                last = record
                continue
            record["seconds"] = round(heard, 3)
            if heard > limit:
                record["reason"] = f"length {heard:.3f}>{limit:.3f}"
                last = record
                print(f"  {target.name} attempt {attempt} {record['reason']}", flush=True)
                continue
            problem = asr_problem(transcribe(wav), spoken)
            if problem:
                record["reason"] = problem
                last = record
                print(f"  {target.name} attempt {attempt} {problem}", flush=True)
                continue
            commit_wav(wav, target)
            print(f"  {target.name} {heard:.2f}s attempt {attempt}", flush=True)
            return None
    if last is not None and wav.exists():
        commit_wav(wav, target)
        print(f"  {target.name} kept last take {last.get('reason')}", flush=True)
    else:
        wav.unlink(missing_ok=True)
    return last


def ensure_clip(model, config, speaker: str, text: str, target: Path, audit_existing: bool) -> dict | None:
    if clip_ready(target):
        if not audit_existing:
            return None
        reason = judge_file(target, text)
        if reason is None:
            return None
        print(f"again {target.name} {reason}", flush=True)
    return synthesize_clean(model, config, speaker, text, target)


def forget_affected(voice: str, rows: list[dict]) -> int:
    """Drop clips whose source still ends in punctuation, so they are spoken again."""
    removed = 0
    for row in rows:
        if not has_trailing_punctuation(row["text"]):
            continue
        target = ROOT / "public" / "audio" / "pt-BR" / voice / Path(row["file"]).name
        if not clip_ready(target) and not target.with_suffix(".align.json").exists():
            continue
        for path, _tempo in tempos_for(target):
            path.unlink(missing_ok=True)
        forget_align(target)
        removed += 1
    return removed


def render_rows(model, config, job: dict, rows: list[dict], respeak: bool) -> list[dict]:
    voice = job["voice"]
    experimental = bool(job.get("experimental"))
    if respeak:
        removed = forget_affected(voice, rows)
        if removed:
            print(f"{voice} cleared {removed} clips that ended with punctuation", flush=True)
    failures: list[dict] = []
    made = 0
    for index, row in enumerate(rows, start=1):
        target = ROOT / "public" / "audio" / "pt-BR" / voice / Path(row["file"]).name
        failure = ensure_clip(model, config, job["speaker"], row["text"], target, audit_existing=respeak)
        if failure is not None:
            failure["voice"] = voice
            if experimental:
                failure["experimental"] = True
            failures.append(failure)
            print(f"{voice} flagged {target.name} {failure.get('reason')}", flush=True)
        else:
            made += 1
        if index % 25 == 0:
            print(f"{voice} {index}/{len(rows)}", flush=True)
    paths = [ROOT / "public" / "audio" / "pt-BR" / voice / Path(row["file"]).name for row in rows]
    paths = [path for path in paths if path.exists()]
    if paths:
        bad = check_voice(expand_tempos(paths))
        for item in bad:
            item["voice"] = voice
            if experimental:
                item["experimental"] = True
            failures.append(item)
        if bad:
            print(json.dumps({"voice": voice, "voicing": bad}, ensure_ascii=False), flush=True)
    if failures and not experimental:
        print(json.dumps({"voice": voice, "failures": failures}, ensure_ascii=False), flush=True)
    print(f"{voice} done {len(rows)} written-or-kept {made} flagged {len(failures)}", flush=True)
    return failures


def write_license(model_dir: Path, job: dict) -> None:
    voice = job["voice"]
    license_src = model_dir / "LICENSE.txt"
    notice = (
        "Travel Talk. Audio in this folder is synthesized offline with Coqui XTTS-v2.\n"
        f"Speaker: {job['speaker']}. Language: pt. The weights are not in this repository.\n"
        f"Revision: {XTTS_REVISION}\n"
        f"SHA-256 model.pth: {XTTS_SHA256['model.pth']}\n"
        "The model and this output are under the Coqui Public Model License 1.0.0.\n"
        "Non-commercial use only.\n"
        f"Licence file at this revision: {CPML_URL}\n"
        "A copy of that file is docs/samples/cpml.txt.\n\n"
    )
    (ROOT / "public" / "audio" / "pt-BR" / voice / "LICENSE.txt").write_text(
        notice + license_src.read_text(encoding="utf-8"),
        encoding="utf-8",
    )


def render(model_dir: Path, words_only: bool = False, respeak: bool = False) -> None:
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
    failures: list[dict] = []
    for job in SPEAKERS:
        if job["speaker"] not in names:
            raise SystemExit(f"speaker missing: {job['speaker']}")
        if not words_only:
            failures.extend(render_rows(model, config, job, rows, respeak))
        write_license(model_dir, job)
    failures.extend(render_words(model, config, respeak))
    reported = Path("/tmp/xtts-asr-failures.json")
    reported.write_text(json.dumps(failures, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    blocking = [item for item in failures if not item.get("experimental")]
    print(f"flagged {len(failures)} blocking {len(blocking)} see {reported}", flush=True)
    if blocking:
        raise SystemExit(f"{len(blocking)} clips still fail the length, voicing, or transcript check")
    if failures:
        print(f"experimental clips flagged {len(failures)}; Claribel stays", flush=True)


def render_words(model, config, respeak: bool) -> list[dict]:
    """Citation clips. Same tempos as Piper words, and no align.json, matching 0.9.0."""
    rows = json.loads((ROOT / "tools" / "word-lines.json").read_text(encoding="utf-8"))
    rows = [row for row in rows if row["lang"] == "pt-BR"]
    if len(rows) != 19:
        raise SystemExit(f"expected 19 pt-BR word lines, found {len(rows)}")
    failures: list[dict] = []
    for job in SPEAKERS:
        voice = job["voice"]
        batch = render_rows(model, config, job, rows, respeak)
        for item in batch:
            item.setdefault("voice", voice)
        failures.extend(batch)
        print(f"{voice} words done", flush=True)
    return failures


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
    respeak = "--respeak" in args
    args = [arg for arg in args if arg not in ("--words-only", "--respeak")]
    if len(args) != 1:
        raise SystemExit("usage: generate_xtts.py <model-dir> [--words-only] [--respeak]")
    try:
        render(Path(args[0]), words_only=words_only, respeak=respeak)
    finally:
        write_manifest()


if __name__ == "__main__":
    main()
