import type { LearnStep } from './session'

/** A new word and a review both open on the meaning question. The clip plays once when that step opens. */
export function wordSteps(_isNew: boolean): LearnStep[] {
  return ['word']
}
