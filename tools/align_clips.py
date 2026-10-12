"""Word timings for the shipped clips.

Piper's default synthesis uses duration noise, so a second run does not match the
file on disk. This script synthesizes a deterministic reference (noise scales 0),
reads phoneme durations from the model, and warps them onto the shipped m4a with
banded dynamic time warping. A clip with no trustworthy timing gets no JSON.

Montreal Forced Aligner is not installed here. The Vietnamese model still goes
through Piper: unknown vivos phonemes take no samples instead of failing the clip.

onnx is imported by piper when alignments are requested. It is not an app dependency.
"""

from __future__ import annotations

import json
import logging
import subprocess
import sys
from pathlib import Path

import numpy as np
from piper import PiperVoice
from piper.config import SynthesisConfig
from piper.const import BOS, EOS, PAD
from piper.voice import PhonemeAlignment

sys.path.insert(0, str(Path(__file__).resolve().parent))
from generate_audio import LINES, require_model, require_onnx, require_piper  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
AUDIO = ROOT / "public" / "audio"

JOBS = [
    {"lang": "de", "model": "de_DE-thorsten-medium", "speaker": None, "voice": None},
    {"lang": "de", "model": "de_DE-thorsten-high", "speaker": None, "voice": "thorsten-high"},
    {"lang": "en", "model": "en_US-ljspeech-medium", "speaker": None, "voice": None},
    {"lang": "en", "model": "en_US-joe-medium", "speaker": None, "voice": "joe"},
    {"lang": "pt-BR", "model": "pt_BR-faber-medium", "speaker": None, "voice": None},
    {"lang": "pt-BR", "model": "pt_BR-cadu-medium", "speaker": None, "voice": "cadu"},
    # XTTS clips. Cadu supplies the phoneme clock. The m4a is the shipped file.
    {"lang": "pt-BR", "model": "pt_BR-cadu-medium", "speaker": None, "voice": "daisy-studious"},
    {"lang": "pt-BR", "model": "pt_BR-cadu-medium", "speaker": None, "voice": "gracie-wise"},
    {"lang": "pt-BR", "model": "pt_BR-cadu-medium", "speaker": None, "voice": "tammie-ema"},
    {"lang": "vi", "model": "vi_VN-vais1000-medium", "speaker": None, "voice": None},
    {"lang": "vi", "model": "vi_VN-vivos-x_low", "speaker": 9, "voice": "vivos-22"},
    {"lang": "vi", "model": "vi_VN-vivos-x_low", "speaker": 37, "voice": "vivos-32"},
]


def find_model(name: str, dirs: list[Path]) -> Path | None:
    for directory in dirs:
        if (directory / f"{name}.onnx").exists():
            return directory
    return None


def custom_align(voice: PiperVoice, phonemes: list[str], phoneme_ids: list[int], samples: np.ndarray) -> list[PhonemeAlignment] | None:
    """Walk ids the way phonemes_to_ids builds them. Unknown phonemes take 0 samples."""
    id_map = voice.config.phoneme_id_map
    pad_ids = list(id_map.get(PAD, []))
    index = 0
    aligned: list[PhonemeAlignment] = []
    for phoneme in [BOS, *phonemes, EOS]:
        if phoneme not in id_map:
            aligned.append(PhonemeAlignment(phoneme=phoneme, phoneme_ids=[], num_samples=0))
            continue
        expected = list(id_map[phoneme])
        ids = expected if phoneme == EOS else expected + pad_ids
        start = index
        for phoneme_id in ids:
            if index >= len(phoneme_ids) or phoneme_ids[index] != phoneme_id:
                return None
            index += 1
        count = int(np.sum(samples[start:index])) if start < index else 0
        aligned.append(PhonemeAlignment(phoneme=phoneme, phoneme_ids=ids, num_samples=count))
    if index != len(phoneme_ids):
        return None
    return aligned


def word_spans(sentences: list[list[PhonemeAlignment]]) -> tuple[list[tuple[int, int]], int] | None:
    spans: list[tuple[int, int]] = []
    clock = 0
    for alignments in sentences:
        in_word = False
        start = 0
        for item in alignments:
            count = int(item.num_samples)
            if count < 0:
                return None
            if item.phoneme in (BOS, EOS):
                if in_word:
                    spans.append((start, clock))
                    in_word = False
                clock += count
                continue
            if item.phoneme == " ":
                if in_word:
                    spans.append((start, clock))
                    in_word = False
                clock += count
                continue
            if not in_word:
                start = clock
                in_word = True
            clock += count
        if in_word:
            spans.append((start, clock))
    if any(end - start < 80 for start, end in spans):
        return None
    return spans, clock


def decode_m4a(path: Path, sample_rate: int) -> np.ndarray:
    result = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(sample_rate), "-f", "f32le", "-"],
        check=True,
        capture_output=True,
    )
    audio = np.frombuffer(result.stdout, dtype=np.float32)
    return np.array(audio, copy=True)


def envelope(samples: np.ndarray, hop: int) -> np.ndarray | None:
    count = len(samples) // hop
    if count < 4:
        return None
    frames = samples[: count * hop].reshape(count, hop)
    return np.sqrt(np.mean(frames * frames, axis=1) + 1e-8)


def dtw_map(ref_env: np.ndarray, real_env: np.ndarray) -> np.ndarray | None:
    ref = np.log(ref_env + 1e-3)
    real = np.log(real_env + 1e-3)
    ref = (ref - ref.mean()) / (ref.std() + 1e-6)
    real = (real - real.mean()) / (real.std() + 1e-6)
    rows = len(ref)
    cols = len(real)
    # 0.22 still refuses a path that sits on the band. 0.18 left one slower
    # vivos-32 clip (Xin viết ra giúp tôi.) on the edge even though the
    # word count matched.
    band = max(6, int(round(0.22 * max(rows, cols))))
    inf = 1e12
    cost = np.full((rows, cols), inf)
    step = np.zeros((rows, cols), dtype=np.uint8)
    cost[0, 0] = abs(float(ref[0] - real[0]))
    for i in range(rows):
        center = 0 if rows == 1 else int(round(i * (cols - 1) / (rows - 1)))
        start = max(0, center - band)
        stop = min(cols, center + band + 1)
        for j in range(start, stop):
            if i == 0 and j == 0:
                continue
            local = abs(float(ref[i] - real[j]))
            best = inf
            how = 0
            if i > 0 and j > 0 and cost[i - 1, j - 1] < best:
                best = cost[i - 1, j - 1]
                how = 0
            if i > 0 and cost[i - 1, j] < best:
                best = cost[i - 1, j]
                how = 1
            if j > 0 and cost[i, j - 1] < best:
                best = cost[i, j - 1]
                how = 2
            if best >= inf:
                continue
            cost[i, j] = best + local + (0.0 if how == 0 else 0.05)
            step[i, j] = how
    if cost[rows - 1, cols - 1] >= inf:
        return None
    i = rows - 1
    j = cols - 1
    path: list[tuple[int, int]] = [(i, j)]
    while (i, j) != (0, 0):
        how = int(step[i, j])
        if how == 0:
            i -= 1
            j -= 1
        elif how == 1:
            i -= 1
        else:
            j -= 1
        if i < 0 or j < 0:
            return None
        path.append((i, j))
        if len(path) > rows + cols + 5:
            return None
    path.reverse()
    edge = 0
    for left, right in path:
        center = 0 if rows == 1 else int(round(left * (cols - 1) / (rows - 1)))
        if abs(right - center) >= max(1, band - 1):
            edge += 1
    if edge / len(path) > 0.25:
        return None
    mapped = np.full(rows, -1, dtype=np.int32)
    for left, right in path:
        mapped[left] = right
    if np.any(mapped < 0):
        return None
    return mapped


def to_seconds(sample: float, sample_rate: int, hop: int, mapped: np.ndarray, real_len: int) -> float:
    if sample <= 0:
        return 0.0
    frame = sample / hop
    left = min(int(np.floor(frame)), len(mapped) - 1)
    right = min(left + 1, len(mapped) - 1)
    frac = float(frame - left) if right != left else 0.0
    index = mapped[left] * (1.0 - frac) + mapped[right] * frac
    return float(np.clip((index * hop) / sample_rate, 0.0, real_len / sample_rate))


def boundary_errors(real: np.ndarray, sample_rate: int, words: list[dict[str, float]]) -> list[float]:
    hop = max(1, sample_rate // 100)
    env = envelope(real, hop)
    if env is None:
        return []
    errors: list[float] = []
    for word in words[1:]:
        frame = int(round(word["start"] * sample_rate / hop))
        low = max(0, frame - 8)
        high = min(len(env), frame + 9)
        if high <= low:
            continue
        dip = low + int(np.argmin(env[low:high]))
        errors.append(abs(dip - frame) * hop / sample_rate)
    return errors


def align_row(voice: PiperVoice, text: str, speaker: int | None, audio_path: Path) -> tuple[list[dict[str, float]] | None, str, dict[str, float]]:
    words = text.split()
    if not words:
        return None, "empty", {}
    syn = SynthesisConfig(speaker_id=speaker, normalize_audio=True, noise_scale=0.0, noise_w_scale=0.0, length_scale=1.0)
    pieces: list[np.ndarray] = []
    sentences: list[list[PhonemeAlignment]] = []
    for chunk in voice.synthesize(text, syn_config=syn, include_alignments=True):
        pieces.append(np.asarray(chunk.audio_float_array, dtype=np.float32))
        aligned = chunk.phoneme_alignments
        if aligned is None and chunk.phoneme_id_samples is not None and len(chunk.phoneme_id_samples) == len(chunk.phoneme_ids):
            aligned = custom_align(voice, chunk.phonemes, chunk.phoneme_ids, np.asarray(chunk.phoneme_id_samples))
        if not aligned:
            return None, "no-phonemes", {}
        sentences.append(aligned)
    if not pieces:
        return None, "no-audio", {}
    ref = np.concatenate(pieces)
    spanned = word_spans(sentences)
    if spanned is None:
        return None, "short-word", {}
    spans, clock = spanned
    if len(spans) != len(words) or clock <= 0:
        return None, "word-count", {}
    if abs(clock - len(ref)) / max(1, len(ref)) > 0.03:
        return None, "clock", {}
    scale = len(ref) / clock
    spans = [(int(start * scale), int(end * scale)) for start, end in spans]
    sample_rate = int(voice.config.sample_rate)
    try:
        real = decode_m4a(audio_path, sample_rate)
    except subprocess.CalledProcessError:
        return None, "decode", {}
    ratio = len(real) / max(1, len(ref))
    # vivos-32 «Chào …» and «Ngon quá.» are the same sentence, spoken slower
    # than the deterministic reference. 2.05 still rejects a different line.
    if ratio < 0.55 or ratio > 2.05:
        return None, "duration", {"ratio": ratio}
    hop = max(1, sample_rate // 100)
    ref_env = envelope(ref, hop)
    real_env = envelope(real, hop)
    if ref_env is None or real_env is None:
        return None, "envelope", {}
    mapped = dtw_map(ref_env, real_env)
    if mapped is None:
        return None, "dtw", {"ratio": ratio}
    timed: list[dict[str, float]] = []
    previous = 0.0
    for start, end in spans:
        left = round(to_seconds(start, sample_rate, hop, mapped, len(real)), 3)
        right = round(to_seconds(end, sample_rate, hop, mapped, len(real)), 3)
        if left < previous - 0.02 or right <= left:
            return None, "order", {"ratio": ratio}
        if left < previous:
            left = previous
        if right <= left:
            return None, "order", {"ratio": ratio}
        timed.append({"start": left, "end": right})
        previous = right
    errors = boundary_errors(real, sample_rate, timed)
    stats = {"ratio": float(ratio)}
    if errors:
        stats["boundary"] = float(np.median(errors))
    return timed, "ok", stats


def main() -> None:
    logging.getLogger("piper").setLevel(logging.ERROR)
    require_piper()
    require_onnx()
    dirs: list[Path] = []
    limit = 0
    voices_only: set[str] = set()
    raw = sys.argv[1:]
    index = 0
    while index < len(raw):
        arg = raw[index]
        if arg == "--limit":
            limit = int(raw[index + 1])
            index += 2
            continue
        if arg == "--voice":
            voices_only.add(raw[index + 1])
            index += 2
            continue
        if arg.startswith("--"):
            raise SystemExit(f"unknown option {arg}")
        dirs.append(Path(arg))
        index += 1
    if not dirs:
        raise SystemExit("usage: align_clips.py <model-dir> [--limit N] [--voice id]")
    voices: dict[tuple[str, str], PiperVoice] = {}
    written = 0
    skipped = 0
    reasons: dict[str, int] = {}
    ratios: list[float] = []
    boundaries: list[float] = []
    for job in JOBS:
        if voices_only and job["voice"] not in voices_only:
            continue
        directory = find_model(job["model"], dirs)
        if directory is None:
            print(f"skip {job['model']}: model not in the given directories", flush=True)
            continue
        require_model(directory, job["model"])
        key = (str(directory), job["model"])
        if key not in voices:
            voices[key] = PiperVoice.load(directory / f"{job['model']}.onnx", include_alignments=True)
        voice = voices[key]
        rows = [row for row in LINES if row["lang"] == job["lang"]]
        if limit:
            rows = rows[:limit]
        label = job["voice"] or "legacy"
        for index, row in enumerate(rows, start=1):
            relative = Path(row["file"])
            if job["voice"]:
                relative = Path(job["lang"]) / job["voice"] / relative.name
            audio = AUDIO / relative
            dest = audio.with_suffix(".align.json")
            if dest.exists() and dest.stat().st_size > 0:
                skipped += 1
                continue
            if not audio.exists():
                reasons["missing-audio"] = reasons.get("missing-audio", 0) + 1
                continue
            timed, reason, stats = align_row(voice, row["text"], job["speaker"], audio)
            if timed is None:
                reasons[reason] = reasons.get(reason, 0) + 1
                dest.unlink(missing_ok=True)
                continue
            dest.write_text(json.dumps({"words": timed}, ensure_ascii=False) + "\n", encoding="utf-8")
            written += 1
            if "ratio" in stats:
                ratios.append(stats["ratio"])
            if "boundary" in stats:
                boundaries.append(stats["boundary"])
            if index % 40 == 0:
                print(f"{label} {index}/{len(rows)} written {written}", flush=True)
        print(f"{label} done", flush=True)
    summary = {
        "written": written,
        "skipped": skipped,
        "failed": reasons,
        "ratioMedian": float(np.median(ratios)) if ratios else None,
        "boundaryMedianSeconds": float(np.median(boundaries)) if boundaries else None,
        "boundaryP90Seconds": float(np.percentile(boundaries, 90)) if boundaries else None,
    }
    print(json.dumps(summary), flush=True)
    Path("/tmp/align-summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
