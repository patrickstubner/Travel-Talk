/**
 * Kept for a later release, 0.10.0 or after. The app does not import this
 * file, and neither do the tests. Version 0.9.0 shows the melody curve, the
 * word colours and the melody and rhythm bars. It does not show a grade, and
 * it does not say whether the spoken line was the one that was heard.
 *
 * That later release grades the question with on-device speech recognition. This bar
 * count is the formula that left the screen, written down so the thresholds
 * are not only in git history. Do not wire it back into the session.
 */
import { COLOURED_SHARE, type BarState } from './feedback'

/** Share of moving words that had to agree before the old grade was given. */
export const DIRECTION_MAJORITY = 0.5

export function starsFromBars(melody: BarState | null, rhythm: BarState | null): 0 | 1 | 2 | 3 {
  if (!melody || !rhythm) return 0
  if (melody === 'passt' && rhythm === 'passt') return 3
  if (melody === 'daneben' || rhythm === 'daneben') return 1
  return 2
}

export function sentenceStars(input: {
  melody: BarState | null
  rhythm: BarState | null
  colouredShare: number
  movingWords: number
  sameMoving: number
  /** Band shape rejected the take. Not a sentence check. */
  rejected: boolean
}): 0 | 1 | 2 | 3 {
  const allowed = input.colouredShare >= COLOURED_SHARE
  let stars = allowed ? starsFromBars(input.melody, input.rhythm) : 0
  if (stars > 0 && input.movingWords >= 2 && input.sameMoving / input.movingWords < DIRECTION_MAJORITY) stars = 0
  if (input.rejected) stars = 0
  return stars
}
