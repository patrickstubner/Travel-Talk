import { State } from 'ts-fsrs'
import type { StoredCard } from '../storage/types'
import { dayKey } from './session'

export type StudyCounts = {
  learnedSentences: number
  learnedWords: number
  reviewedToday: number
  retained: number
}

/** Word cards use the `w.` id from the word list, after the direction. */
export function isWordCard(cardId: string): boolean {
  const mark = cardId.indexOf(':')
  return mark >= 0 && cardId.slice(mark + 1).startsWith('w.')
}

/**
 * Counts for one person, from the cards already on this device.
 * Learned means the card was rated at least once.
 * Reviewed today means it was already known (elapsed days above 0) and rated again today.
 * Retained means a learned card is in the FSRS review state.
 */
export function studyCounts(cards: readonly StoredCard[], now: Date): StudyCounts {
  const today = dayKey(now)
  let learnedSentences = 0
  let learnedWords = 0
  let reviewedToday = 0
  let retained = 0
  for (const card of cards) {
    if (card.reps < 1) continue
    if (isWordCard(card.cardId)) learnedWords += 1
    else learnedSentences += 1
    if (card.state === State.Review) retained += 1
    if (card.elapsed_days > 0 && card.last_review && dayKey(new Date(card.last_review)) === today) reviewedToday += 1
  }
  return { learnedSentences, learnedWords, reviewedToday, retained }
}

/** Whole percent. Zero when nothing has been learned yet. */
export function keptShare(counts: StudyCounts): number {
  const learned = counts.learnedSentences + counts.learnedWords
  if (learned === 0) return 0
  return Math.round((counts.retained / learned) * 100)
}
