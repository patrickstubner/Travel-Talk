import type { Lang } from '../../content/phrase'
import { CONTENT_WER_CORRECT, CONTENT_WER_GIBBERISH } from '../speech/text-match'
import { RHYTHM_STAR_WEIGHT, type BarState } from './feedback'

/** Stars on the repeat screen. 1 is the floor: «try again». */
export type Stars = 1 | 2 | 3 | 4 | 5

/**
 * Languages whose recogniser is not good enough to grade the words in 1.0.
 * Their words bar is shown, but it does not change the stars, so the count
 * stays at most 4 (no 5 without recognised words). Vietnamese: the small
 * Vosk model missed 58 % of the words on the bundled northern voice in the
 * local smoke test (docs/analysis-speech-recognition.md).
 */
export const WORDS_INFO_ONLY: ReadonlySet<Lang> = new Set<Lang>(['vi'])

/**
 * Words bar from a word error rate. At or below CONTENT_WER_CORRECT the
 * words were recognised, at or above CONTENT_WER_GIBBERISH they were barely
 * recognised, and anything between is partial. Null when no recogniser ran.
 */
export function wordsBar(wer: number | null | undefined): BarState | null {
  if (typeof wer !== 'number' || !Number.isFinite(wer)) return null
  if (wer <= CONTENT_WER_CORRECT) return 'passt'
  if (wer >= CONTENT_WER_GIBBERISH) return 'daneben'
  return 'teilweise'
}

/**
 * Rhythm bar after RHYTHM_STAR_WEIGHT. A miss costs one step for yellow and
 * two for red, scaled by the weight and rounded: German and English keep the
 * bar, Brazilian Portuguese turns red into yellow, Vietnamese turns yellow
 * into green and red into yellow.
 */
export function weightedRhythm(rhythm: BarState | null, lang: Lang): BarState | null {
  if (rhythm == null || rhythm === 'passt') return rhythm
  const steps = Math.round((rhythm === 'daneben' ? 2 : 1) * RHYTHM_STAR_WEIGHT[lang])
  if (steps <= 0) return 'passt'
  if (steps === 1) return 'teilweise'
  return 'daneben'
}

export type FiveStarInput = {
  melody: BarState | null
  rhythm: BarState | null
  /** Words bar from the recogniser. Null when no recogniser result is there. */
  words: BarState | null
  /** Sentence check from the pitch and band comparison. */
  verdict: BarState | null
  backwards?: boolean
  lang: Lang
}

/**
 * Five-star mapping from docs/architektur/gui-konzept.md (decided 16.11.2026):
 *
 * - 5: melody and rhythm «passt», all words recognised
 * - 4: two of the three «passt», the rest «teilweise»
 * - 3: words recognised, melody or rhythm «teilweise»
 * - 2: words partly recognised, or one bar «daneben»
 * - 1: barely recognised, reversed, or a wrong sentence
 *
 * Without a words bar (no model, recogniser failed, or a language in
 * WORDS_INFO_ONLY) the count is at most 4, because «all words recognised»
 * is not known. Then a «daneben» sentence check is 1, both bars «passt» are
 * 4, one «passt» and one «teilweise» are 3, and anything else is 2.
 * Too short or too quiet takes get no stars at all; the caller handles that.
 */
export function fiveStars(input: FiveStarInput): Stars | null {
  const { melody, lang } = input
  const rhythm = weightedRhythm(input.rhythm, lang)
  if (melody == null || rhythm == null) return null
  if (input.backwards) return 1
  const words = WORDS_INFO_ONLY.has(lang) ? null : input.words
  if (words == null) {
    if (input.verdict === 'daneben') return 1
    if (melody === 'passt' && rhythm === 'passt') return 4
    const pass = [melody, rhythm].filter((bar) => bar === 'passt').length
    const part = [melody, rhythm].filter((bar) => bar === 'teilweise').length
    if (pass === 1 && part === 1) return 3
    return 2
  }
  if (words === 'daneben') return 1
  if (words === 'teilweise' && input.verdict === 'daneben') return 1
  const bars = [melody, rhythm, words]
  const pass = bars.filter((bar) => bar === 'passt').length
  const off = bars.filter((bar) => bar === 'daneben').length
  if (pass === 3) return 5
  if (pass === 2 && off === 0) return 4
  if (words === 'passt' && off === 0) return 3
  return 2
}
