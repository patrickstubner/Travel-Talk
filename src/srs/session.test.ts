import { describe, expect, it } from 'vitest'
import {
  DAILY_NEW_CAP,
  SESSION_NEW,
  SESSION_REVIEW_CAP,
  buildSession,
  dayKey,
  dueConcepts,
  introducedToday,
  isDueCard,
  newCardBudget,
  stepsFor,
  targetTextVisible,
} from './session'
import type { StoredCard } from '../storage/types'

function card(patch: Partial<StoredCard> & { cardId: string }): StoredCard {
  return {
    due: '2026-10-12T08:00:00.000Z',
    stability: 1,
    difficulty: 5,
    elapsed_days: 0,
    scheduled_days: 1,
    learning_steps: 0,
    reps: 1,
    lapses: 0,
    state: 2,
    last_review: '2026-10-11T08:00:00.000Z',
    ...patch,
  }
}

const now = new Date(2026, 9, 11, 9, 0, 0)

describe('new and due', () => {
  it('does not treat an unknown concept as due', () => {
    expect(isDueCard(undefined, now)).toBe(false)
    expect(dueConcepts([{ id: 'a' }, { id: 'b' }], [], 'de-vi', now)).toEqual([])
  })

  it('counts a card as due only when its date has arrived', () => {
    const due = card({ cardId: 'de-vi:a', due: new Date(2026, 9, 11, 8, 0, 0).toISOString() })
    const later = card({ cardId: 'de-vi:b', due: new Date(2026, 9, 12, 8, 0, 0).toISOString() })
    expect(dueConcepts([{ id: 'a' }, { id: 'b' }], [due, later], 'de-vi', now).map((item) => item.id)).toEqual(['a'])
  })

  it('caps a fresh session at four new phrases', () => {
    const concepts = Array.from({ length: 20 }, (_, index) => ({ id: `c${index}` }))
    const session = buildSession(concepts, [], 'de-vi', now)
    expect(session).toHaveLength(SESSION_NEW)
    expect(session.every((item) => item.isNew)).toBe(true)
  })

  it('shrinks new cards when reviews pile up and stops at the daily cap', () => {
    expect(newCardBudget(0, 0)).toBe(4)
    expect(newCardBudget(8, 0)).toBe(2)
    expect(newCardBudget(12, 0)).toBe(1)
    expect(newCardBudget(20, 0)).toBe(0)
    expect(newCardBudget(0, DAILY_NEW_CAP)).toBe(0)
    expect(newCardBudget(0, 14)).toBe(1)
  })

  it('counts only the first review of today toward the daily cap', () => {
    const introduced = card({
      cardId: 'de-vi:new',
      elapsed_days: 0,
      reps: 1,
      last_review: now.toISOString(),
    })
    const older = card({
      cardId: 'de-vi:old',
      elapsed_days: 3,
      reps: 4,
      last_review: now.toISOString(),
      due: new Date(2026, 9, 11, 8, 0, 0).toISOString(),
    })
    expect(introducedToday(introduced, now)).toBe(true)
    expect(introducedToday(older, now)).toBe(false)
    expect(dayKey(now)).toBe('2026-10-11')
    const concepts = [{ id: 'old' }, { id: 'fresh' }]
    const session = buildSession(concepts, [introduced, older], 'de-vi', now, 'new')
    expect(session.map((item) => item.id)).toEqual(['fresh'])
  })

  it('keeps reviews and new cards apart, and limits a mixed session', () => {
    const concepts = Array.from({ length: 30 }, (_, index) => ({ id: `c${index}` }))
    const reviews = concepts.slice(0, 10).map((concept, index) =>
      card({
        cardId: `de-vi:${concept.id}`,
        due: new Date(2026, 9, 11, 8, 0, index).toISOString(),
        elapsed_days: 2,
      }),
    )
    const mixed = buildSession(concepts, reviews, 'de-vi', now, 'mix')
    expect(mixed.filter((item) => !item.isNew)).toHaveLength(SESSION_REVIEW_CAP)
    expect(mixed.filter((item) => item.isNew)).toHaveLength(2)
    expect(buildSession(concepts, reviews, 'de-vi', now, 'review').every((item) => !item.isNew)).toBe(true)
    expect(buildSession(concepts, reviews, 'de-vi', now, 'new').every((item) => item.isNew)).toBe(true)
  })
})

describe('target text', () => {
  it('keeps the script visible for a new phrase and hides it on a later check until the answer', () => {
    expect(stepsFor(true)).toEqual(['slow', 'normal', 'repeat', 'understand', 'recall'])
    expect(stepsFor(false)).toEqual(['understand', 'recall'])
    for (const step of ['slow', 'normal', 'repeat'] as const) {
      expect(targetTextVisible(step, true, false)).toBe(true)
    }
    expect(targetTextVisible('understand', true, false)).toBe(true)
    expect(targetTextVisible('understand', false, false)).toBe(false)
    expect(targetTextVisible('understand', false, true)).toBe(true)
    expect(targetTextVisible('recall', true, false)).toBe(false)
    expect(targetTextVisible('recall', false, true)).toBe(true)
    expect(targetTextVisible('rate', false, false)).toBe(true)
  })
})
