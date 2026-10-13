import type { BarState } from './feedback'

/**
 * Stars for the two bars already on the page.
 * This file does not import sentence-grade.ts. That later grade needs
 * on-device speech recognition and is not this count.
 * Missing bars are not a grade.
 */
export function takeStars(melody: BarState | null, rhythm: BarState | null): 1 | 2 | 3 | null {
  if (!melody || !rhythm) return null
  if (melody === 'passt' && rhythm === 'passt') return 3
  if (melody === 'daneben' || rhythm === 'daneben') return 1
  return 2
}
