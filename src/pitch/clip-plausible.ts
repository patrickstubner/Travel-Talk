import { PitchDetector } from 'pitchy'
import { CLARITY_MIN, PITCH_HZ_MAX, PITCH_HZ_MIN } from './contour'

/**
 * Full-speed length. Slow files are longer by the tempo, so the comparison
 * uses duration times 0.7 or 0.85. Two legacy Vietnamese syllables are real
 * speech and shorter than this: «Dạ.» (south) and «Vâng.» (north).
 */
export const MIN_BASE_SECONDS = 0.3
/**
 * A clip this short, at full speed, has to be voiced. Bare noise of about
 * 0.2 s has no pitch frame at the bar the app uses (clarity 0.6, 70–450 Hz).
 * 40 % of frames is above that noise. Longer clips are not held to the ratio.
 */
export const SHORT_BASE_SECONDS = 0.45
export const SHORT_VOICED_RATIO = 0.4
const PITCH_FRAME = 2048

export const SHORT_LINE_EXCEPTIONS = new Set([
  'vi/meet.yes__south__base.m4a',
  'vi/meet.yes__north__base.m4a',
])

export function playbackTempo(file: string): number {
  if (file.endsWith('.r70.m4a')) return 0.7
  if (file.endsWith('.r85.m4a')) return 0.85
  return 1
}

export function fullSpeedName(file: string): string {
  return file.replace(/\.r70\.m4a$/, '.m4a').replace(/\.r85\.m4a$/, '.m4a')
}

export function voicedFrameRatio(samples: Float32Array): number {
  if (samples.length < PITCH_FRAME) return 0
  const detector = PitchDetector.forFloat32Array(PITCH_FRAME)
  detector.clarityThreshold = CLARITY_MIN
  detector.minVolumeDecibels = -45
  const frame = new Float32Array(PITCH_FRAME)
  let frames = 0
  let voiced = 0
  for (let index = 0; index + PITCH_FRAME < samples.length; index += 160) {
    frame.set(samples.subarray(index, index + PITCH_FRAME))
    frames += 1
    const [hz, clarity] = detector.findPitch(frame, 16000)
    if (clarity >= CLARITY_MIN && hz >= PITCH_HZ_MIN && hz <= PITCH_HZ_MAX) voiced += 1
  }
  return frames === 0 ? 0 : voiced / frames
}

/**
 * Full-speed ceiling for an XTTS clip: one word may take 0.72 s, plus 0.85 s.
 * The same numbers are in tools/generate_xtts.py. A spoken punctuation mark
 * makes a short line longer than this. No offline speech recogniser is used.
 */
export function stripTrailingPunctuation(text: string): string {
  const stripped = text.trim().replace(/[.!?…]+$/u, '').trim()
  return stripped || text.trim()
}

export function expectedClipSeconds(text: string): number {
  const words = stripTrailingPunctuation(text).match(/\p{L}[\p{L}\p{M}\p{N}_]*/gu) ?? []
  return Math.max(1, words.length) * 0.72 + 0.85
}

export function lengthProblem(text: string, seconds: number): string | null {
  const limit = expectedClipSeconds(text)
  if (seconds > limit + 0.03) return `length ${seconds.toFixed(3)} > ${limit.toFixed(3)}`
  return null
}

/** Null when the clip is long enough and, when it is short, voiced. */
export function clipProblem(file: string, samples: Float32Array): string | null {
  const atFullSpeed = (samples.length / 16000) * playbackTempo(file)
  if (!SHORT_LINE_EXCEPTIONS.has(fullSpeedName(file)) && atFullSpeed < MIN_BASE_SECONDS) {
    return `duration ${atFullSpeed.toFixed(3)}`
  }
  if (atFullSpeed < SHORT_BASE_SECONDS && voicedFrameRatio(samples) < SHORT_VOICED_RATIO) {
    return `voicing ${(voicedFrameRatio(samples) * 100).toFixed(0)}%`
  }
  return null
}
