import { State } from 'ts-fsrs'

/** Fixed steps. There is no slider. 100 % is the original file. */
export const SPEED_STEPS = [0.7, 0.85, 1] as const

export type SpeedStep = (typeof SPEED_STEPS)[number]

/** `auto` follows {@link suggestedSpeed}. A number is the learner's override for every clip. */
export type SpeedChoice = 'auto' | SpeedStep

/**
 * Review cards at or above this FSRS stability play at 100 %.
 * With the default scheduler and fuzz off, a new card reaches it on the fourth Good.
 */
export const FULL_SPEED_STABILITY = 21

export function isSpeedStep(value: unknown): value is SpeedStep {
  return value === 0.7 || value === 0.85 || value === 1
}

export function speedPercent(step: SpeedStep): 70 | 85 | 100 {
  if (step === 0.7) return 70
  if (step === 0.85) return 85
  return 100
}

/**
 * Suggested tempo from the stored FSRS card.
 *
 * A Good-streak is not stored, so the rule uses `state` and `stability`:
 * - no card, New, Learning, or Relearning: 70 %
 * - Review with stability below {@link FULL_SPEED_STABILITY}: 85 %
 * - Review with stability at or above that: 100 %
 *
 * Listening practice uses the same function, so a well-known card is heard at 100 %
 * unless the learner has chosen a fixed step.
 */
export function suggestedSpeed(card: { state: number; stability: number } | null | undefined): SpeedStep {
  if (card == null || card.state !== State.Review) return 0.7
  if (card.stability < FULL_SPEED_STABILITY) return 0.85
  return 1
}

/** A fixed choice wins for every phrase, including a listening exercise at 100 %. */
export function effectiveSpeed(
  choice: SpeedChoice,
  card: { state: number; stability: number } | null | undefined,
): SpeedStep {
  if (choice === 'auto') return suggestedSpeed(card)
  return choice
}

/** `vi/id__south__base.m4a` at 70 % is `vi/id__south__base.r70.m4a`. 100 % keeps the original name. */
export function tempoFile(file: string, step: SpeedStep): string {
  if (step === 1 || !file.endsWith('.m4a')) return file
  return `${file.slice(0, -4)}.${step === 0.7 ? 'r70' : 'r85'}.m4a`
}
