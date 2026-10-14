import type { LearnStep } from './session'

/** A new word is heard this many times, with the meaning visible, before the question. */
export const WORD_INTRO_PASSES = 3

export function wordSteps(isNew: boolean): LearnStep[] {
  if (!isNew) return ['word']
  const intro = Array.from({ length: WORD_INTRO_PASSES }, (): LearnStep => 'word-intro')
  return [...intro, 'word']
}
