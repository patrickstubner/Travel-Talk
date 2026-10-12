import { WORDS } from '../content/words'
import { DexieProgressRepository } from './storage/dexie-repository'
import type { StoredCard } from './storage/types'

/** Marks every checked word as already «Gut», so a sentence test starts on a line. */
export async function seedPassedWords(direction = 'de-vi'): Promise<void> {
  const repo = new DexieProgressRepository('travel-talk')
  const personId = (await repo.load()).activePersonId ?? ''
  const now = Date.now()
  for (const word of WORDS) {
    const card: StoredCard = {
      cardId: `${direction}:${word.id}`,
      due: new Date(now + 3 * 86_400_000).toISOString(),
      stability: 2.3,
      difficulty: 5,
      elapsed_days: 1,
      scheduled_days: 0,
      learning_steps: 1,
      reps: 1,
      lapses: 0,
      state: 1,
      last_review: new Date(now - 86_400_000).toISOString(),
    }
    await repo.saveCard(personId, card)
  }
}
