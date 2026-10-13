import { State } from 'ts-fsrs'
import { describe, expect, it } from 'vitest'
import type { StoredCard } from '../storage/types'
import { keptShare, studyCounts } from './progress'

function card(partial: Partial<StoredCard> & Pick<StoredCard, 'cardId'>): StoredCard {
  return {
    due: '2026-10-20T12:00:00.000Z',
    stability: 2,
    difficulty: 5,
    elapsed_days: 0,
    scheduled_days: 1,
    learning_steps: 0,
    reps: 1,
    lapses: 0,
    state: State.Learning,
    last_review: null,
    ...partial,
  }
}

const today = new Date(2026, 9, 13, 15, 0, 0)
const yesterday = new Date(2026, 9, 12, 15, 0, 0)

describe('study counts', () => {
  it('splits learned sentences and words and ignores cards that were never rated', () => {
    const counts = studyCounts(
      [
        card({ cardId: 'de-vi:meet.hello', reps: 2, state: State.Review }),
        card({ cardId: 'de-vi:w.water', reps: 1, state: State.Learning }),
        card({ cardId: 'de-vi:w.help', reps: 0, state: State.New }),
        card({ cardId: 'de-vi:visa.extend', reps: 1, state: State.Relearning }),
      ],
      today,
    )
    expect(counts.learnedSentences).toBe(2)
    expect(counts.learnedWords).toBe(1)
    expect(counts.retained).toBe(1)
    expect(keptShare(counts)).toBe(33)
  })

  it('counts a later review today and not the first meeting on that day', () => {
    const counts = studyCounts(
      [
        card({
          cardId: 'de-vi:meet.hello',
          elapsed_days: 3,
          state: State.Review,
          last_review: today.toISOString(),
        }),
        card({
          cardId: 'de-vi:w.water',
          elapsed_days: 0,
          reps: 1,
          last_review: today.toISOString(),
        }),
        card({
          cardId: 'de-vi:w.help',
          elapsed_days: 2,
          state: State.Review,
          last_review: yesterday.toISOString(),
        }),
      ],
      today,
    )
    expect(counts.reviewedToday).toBe(1)
    expect(counts.learnedWords).toBe(2)
    expect(counts.retained).toBe(2)
    expect(keptShare(counts)).toBe(67)
  })

  it('keeps an empty day at zero', () => {
    const counts = studyCounts([], today)
    expect(counts).toEqual({ learnedSentences: 0, learnedWords: 0, reviewedToday: 0, retained: 0 })
    expect(keptShare(counts)).toBe(0)
  })
})
