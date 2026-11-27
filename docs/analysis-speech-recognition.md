# Analysis: speech recognition for the repeat check (Travel Talk 1.0)

Date: 27 Nov 2026. Base commit: `f6b61cb46b1748c855cea91dd2b0a654395a91e9` (`main`, 0.10.2). Research, local tests and a browser spike. No cloud agent. Implemented in branch `feat/speech-1.0` (version 1.0.0).

## 1. Starting point

- Lesson languages: `de`, `en`, `pt-BR`, `vi` (`src/domain/schema.ts`). Vietnamese has a southern default and a northern variant. Spanish is planned after 1.0.
- Before 1.0 the repeat check had no word recognition. `src/pitch` compares the take with the model clip by pitch contour (pitchy, DTW), spectral bands and word durations, which gives a melody bar, a rhythm bar and a sentence verdict, and 0–3 stars.
- Target for 1.0 (`docs/architektur/gui-konzept.md`, decided 16 Nov): 5 stars from melody, rhythm and "words recognised". Speech recognition supplies the words. Everything runs on the device; nothing is uploaded.
- Closed draft PRs #42 (Vosk for Portuguese with a word list) and #43 (Vosk for de, en, vi, on-demand model download, cache, delete in settings). The code of #43 (`refs/pull/43/head`, `1d6e5bb`) is the template for 1.0.

## 2. Options (free, in the browser, offline)

| Option | Languages | Download | Licence | Notes |
|---|---|---|---|---|
| Vosk via `vosk-browser` 0.0.8 (Kaldi WASM) | de, en, pt, vn, es and more | small models 31–45 MB | Apache-2.0 (package and the small models used) | Runs in a worker, supports a grammar (word list). No package release since 12/2022: maintenance risk. Avoid the Zamia models (LGPL-3.0) and the large pt model (GPL-3.0). |
| sherpa-onnx (WASM, ONNX Runtime) | vi: Zipformer models | vi-int8-2025-04-20: 75 MB; vi-30M-int8-2026-02-09: 33 MB | Engine Apache-2.0. Model 2025-04-20 Apache-2.0 (70,000 h). Model 30M **CC BY-NC-ND 4.0** (non-commercial) | Actively maintained. The prebuilt browser bundle is a pthread build (see 5). |
| Moonshine Streaming Tiny vi | vi | 27 M parameters | MIT | Older non-streaming vi models use a non-commercial community licence. Browser runtime not tested. |
| Whisper via transformers.js (ONNX) | all | tiny ~40 MB, base ~75 MB, small ~245 MB (q8) | MIT | Weak for Vietnamese and Portuguese in the smoke test. |
| whisper.cpp WASM | all | as above | MIT | Same model quality as Whisper, no advantage here. |
| Web Speech API | many | provided by the browser | browser service | On-device only with `processLocally` (Chrome 139+), not on Safari/iOS. Without it the browser may send audio to a server. No word list. Not suitable as the main path. |
| Phoneme models (wav2vec2-xlsr-53-espeak-cv-ft, ZIPA small) | language-independent (IPA) | 1.2 GB fp32 / not measured | Apache-2.0 / CC BY 4.0 | Real phone scoring possible later; too large or untested for 1.0. |
| Allosaurus | 2000+ (phones) | – | GPL-3.0, Python | Unsuitable for a static web app. |
| Own pitch analysis (existing) | vi tones | 0 | MIT | Stays the way to judge tones. No recogniser judges whether a tone sounds right; they only guess the most likely word. |

## 3. Local smoke test (word error rate)

Method: 40 random sentences per language (seed 7) from the bundled Piper/XTTS clips, base tempo, 16 kHz mono, free recognition without word list. Vosk via its Python package with the same models as `vosk-browser`, Whisper via faster-whisper (int8, CPU). Values: WER · sentences closer to the right sentence than to any other. **Real learner voices and phones not tested.**

| Language · voice | Vosk small | Whisper base | Whisper small | sherpa vi 2025-04-20 | sherpa vi 30M | Moonshine vi |
|---|---|---|---|---|---|---|
| de · thorsten (default) | 11 % · 40/40 | 20 % · 39/40 | 16 % · 36/40 | | | |
| de · mls-4576 | 110 % · 14/40 | 136 % · 16/40 | 154 % · 13/40 | | | |
| en · ljspeech (default) | 8 % · 40/40 | 9 % · 39/40 | 6 % · 40/40 | | | |
| en · joe | 7 % · 40/40 | 12 % · 38/40 | 18 % · 39/40 | | | |
| pt-BR · faber (default) | 18 % · 39/40 | 32 % · 32/40 | 23 % · 33/40 | | | |
| pt-BR · cadu | 10 % · 40/40 | 28 % · 34/40 | 16 % · 38/40 | | | |
| pt-BR · gracie-wise | 7 % · 40/40 | 10 % · 40/40 | 14 % · 36/40 | | | |
| vi · vais1000 (default, northern) | 58 % · 34/40 | 73 % · 24/40 | 49 % · 29/40 | **12 %** · 37/40 | 14 % · 36/40 | 16 % · 35/40 |
| vi · vivos-22 | 27 % · 37/40 | 58 % · 35/40 | 53 % · 35/40 | 26 % · 38/40 | 24 % · 39/40 | 29 % · 39/40 |

Vietnamese without tone marks: sherpa 2025-04-20 10 %/15 %, Vosk 56 %/22 %. Much of the remaining error on vivos is tone marks. The Vosk vn model was trained and measured on VIVOS and fails on the northern default voice.

Side finding: the optional German voice `mls-4576` is barely intelligible to Vosk and Whisper ("Hilfe!" → "du kannst"). The clips should be listened to.

## 4. Decision per language

| Language | Recogniser | Download | Effect on stars |
|---|---|---|---|
| German | Vosk small-de-0.15 | 45 MB | words count (up to 5 stars) |
| English | Vosk small-en-us-0.15 | 40 MB | words count |
| Portuguese (BR) | Vosk small-pt-0.3 with grammar of the expected words plus `[unk]` (as in #42) | 31 MB | words count |
| Vietnamese | Vosk small-vn-0.4 | 32 MB | words shown as information only; at most 4 stars (as in #43) |
| Spanish (planned) | Vosk small-es-0.42 as starting point | 39 MB | not tested |

Rejected for 1.0: Whisper (larger, worse for pt/vi), Web Speech API (no on-device iOS, privacy), phoneme models (too large or untested), Allosaurus (GPL-3.0), sherpa 30M (non-commercial, no derivatives).

## 5. Vietnamese spike: sherpa-onnx in the browser

Goal: can sherpa-onnx with Zipformer vi-int8-2025-04-20 run as WASM on a mid-range Android phone and an older iPhone? Proxy: Playwright Chromium on a server CPU with CPU throttling (DevTools `Emulation.setCPUThrottlingRate`). Bundle: official sherpa-onnx v1.13.2 WASM build (ASR with VAD).

| Item | Result |
|---|---|
| Download | wasm 12.9 MB + model 75 MB (encoder, decoder, joiner int8, tokens) |
| Memory | wasm heap fixed at `INITIAL_MEMORY` 512 MB, plus about 230 MB JS heap after loading |
| Threads | the prebuilt bundle is a pthread build and needs `SharedArrayBuffer`, i.e. `crossOriginIsolated` (COOP/COEP). Without it: "SharedArrayBuffer transfer requires self.crossOriginIsolated" |

Timings with cross-origin isolation (one ~1.1 s clip):

| CPU throttle | Runtime init | Model fetch + write | Recogniser create | Real-time factor | Per clip |
|---|---|---|---|---|---|
| 1x | 0.31 s | 0.22 s | 1.3 s | 0.10 | 114 ms |
| 4x (mid-range Android proxy) | 0.94 s | 0.84 s | 5.5 s | 0.44 | 479 ms |
| 6x (older phone proxy) | 1.3 s | 1.2 s | 8.7 s | 0.67 | 728 ms |

The transcripts were correct (upper-case Vietnamese).

Decision: **not in 1.0**. Speed would be acceptable, but:

1. GitHub Pages cannot send COOP/COEP headers. Cross-origin isolation would need a service-worker header workaround (first load not isolated, more moving parts in the CSP and the offline cache), or a custom single-thread Emscripten build.
2. A fixed 512 MB wasm heap plus about 230 MB JS heap is a real risk of tab kills on older iPhones (iOS limits per tab are lower than on desktop). This cannot be checked without a device.

Vietnamese therefore keeps Vosk small-vn-0.4 with words as information only and a cap of 4 stars. Follow-up: a single-thread sherpa-onnx build with a smaller heap, tested on real devices.

## 6. Star calibration (1.0)

Mapping from `gui-konzept.md`, implemented in `src/pitch/stars.ts`:

| Stars | Condition |
|---|---|
| 5 | melody, rhythm and words fit |
| 4 | two of three fit, the third is partial |
| 3 | words recognised, melody or rhythm partial |
| 2 | words partly recognised, or one bar off |
| 1 | barely recognised, too short, too quiet, or reversed |

Words bar from the word error rate: fit ≤ 0.34, off ≥ 0.5, partial in between. Without recognition (model not loaded, failed, or Vietnamese) the words do not count and the maximum is 4.

Calibration run (local, before the PR): 60 random sentences per language (fewer for English where alignments are missing). Model clip = default voice, take = the second bundled voice (de thorsten-high, en joe, pt-BR cadu, vi vivos-22), so every take differs in voice and pace from the model. Cases: the right sentence, another sentence, and the take played backwards. Words from Vosk (Python package, same models, free recognition without the pt grammar). Pitch scoring from `src/pitch` unchanged. Counts are takes per star value; "–" means the app shows no stars because a bar is missing.

| Language | Case | 1 | 2 | 3 | 4 | 5 | – |
|---|---|---|---|---|---|---|---|
| de | right sentence | 3 | 17 | 4 | 16 | 20 | 0 |
| de | other sentence | 60 | 0 | 0 | 0 | 0 | 0 |
| de | backwards | 0 | 0 | 0 | 0 | 0 | 60 |
| en | right sentence | 3 | 31 | 3 | 7 | 6 | 1 |
| en | other sentence | 51 | 0 | 0 | 0 | 0 | 0 |
| en | backwards | 50 | 0 | 0 | 0 | 0 | 1 |
| pt-BR | right sentence | 3 | 15 | 24 | 18 | 0 | 0 |
| pt-BR | other sentence | 60 | 0 | 0 | 0 | 0 | 0 |
| pt-BR | backwards | 41 | 0 | 0 | 0 | 0 | 19 |
| vi (words info only) | right sentence | 21 | 8 | 20 | 11 | 0 | 0 |
| vi (words info only) | other sentence | 39 | 13 | 7 | 1 | 0 | 0 |
| vi (words info only) | backwards | 50 | 4 | 3 | 2 | 0 | 1 |

Reading:

- With recognition, another sentence always gets 1 star in de, en and pt-BR (before: up to 4). A right sentence gets 1 star in 5 % of takes (3 of 60, 3 of 50, 3 of 60).
- Many right English and German takes get 2 stars: all words recognised, but one bar is off because the second voice differs strongly in pitch and pace from the model. This follows the concept ("one bar off" = 2). Real learners imitate the model voice, so this cross-voice test is harsher than real use. If learner tests show the same, "words fit + one bar off" could become 3.
- Vietnamese does not change with 1.0 (the words do not count): a right sentence by the other voice gets 1 star in 21 of 60 takes. This comes from the pitch check across a northern model voice and a different take voice and existed before 1.0. Follow-up together with the sherpa issue.
- Backwards takes in German show no stars because no word bar can be coloured; the app asks for another take.

## 7. Open points

- Calibration with real learner voices (see 6); the Vietnamese cross-voice false 1-star rate.
- Speed and memory on real phones (mid-range Android, older iPhone) for Vosk: not measured.
- Tests with real learner voices, including wrong pronunciation. So far only synthetic clips.
- North versus south: how well the vi models recognise southern speakers is not established.
- Whether Moonshine Streaming (MIT) runs in the browser.
- Spanish: scope, voices and recognition not tested.
- Voice `mls-4576`: check intelligibility.

## Sources (retrieved 27 Nov 2026)

- Vosk models, sizes, WER, licences: https://alphacephei.com/vosk/models
- vosk-browser: npm 0.0.8 (2022-12-25), https://github.com/ccoreilly/vosk-browser
- sherpa-onnx vi models: https://k2-fsa.github.io/sherpa/onnx/pretrained_models/offline-transducer/zipformer-transducer-models.html; licences: https://huggingface.co/zzasdf/viet_iter3_pseudo_label (Apache-2.0), https://huggingface.co/hynt/Zipformer-30M-RNNT-6000h (CC BY-NC-ND 4.0)
- sherpa-onnx WASM: https://k2-fsa.github.io/sherpa/onnx/wasm/index.html
- Moonshine: https://huggingface.co/moonshine-ai/moonshine-streaming-tiny-vi
- Whisper in the browser: https://huggingface.co/onnx-community/whisper-base/tree/main/onnx
- Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API, https://caniuse.com/mdn-api_speechrecognition_processlocally
- Phoneme models: https://huggingface.co/facebook/wav2vec2-xlsr-53-espeak-cv-ft, https://github.com/lingjzhu/zipa, https://github.com/xinjli/allosaurus
