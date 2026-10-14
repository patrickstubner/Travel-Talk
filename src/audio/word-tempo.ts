import { isSpeedStep, type SpeedStep } from './speed'

/** A missing word tempo is 100 %. Words do not follow the sentence choice. */
export function wordTempo(settings: { wordSpeed?: SpeedStep | null }): SpeedStep {
  return isSpeedStep(settings.wordSpeed) ? settings.wordSpeed : 1
}
