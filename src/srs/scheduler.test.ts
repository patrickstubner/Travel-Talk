import { describe, expect, it } from 'vitest'
import { requireCatalog } from '../content/load'
import { DUE_LIMIT_DAYS, Rating, capDueIso, emptyCard, previewDue, reviewCard, toStored, fromStored } from './scheduler'
import { buildSession, dueConcepts } from './session'

describe('fsrs', () => {
  it('moves the due date after a review', () => {
    const now = new Date('2026-10-10T08:00:00.000Z')
    const next = reviewCard(emptyCard(now), Rating.Good, now, 0.9, false)
    expect(next.due.getTime()).toBeGreaterThan(now.getTime())
    expect(next.reps).toBeGreaterThan(0)
    expect(next.difficulty).toBeLessThanOrEqual(10)
  })

  it('caps a future last review to now when the card is rated', () => {
    const now = new Date('2026-10-11T08:00:00.000Z')
    const reviewed = reviewCard(emptyCard(now), Rating.Good, now, 0.9, false)
    const far = new Date(now.getTime() + 400 * 86_400_000)
    const future = fromStored({
      ...toStored('de-vi:future', reviewed),
      last_review: far.toISOString(),
    })
    const dues = previewDue(future, now, 0.9)
    expect(dues[Rating.Good].getTime()).toBeLessThan(now.getTime() + 60 * 86_400_000)
    const next = reviewCard(future, Rating.Good, now, 0.9, false)
    expect(next.last_review?.getTime()).toBe(now.getTime())
    expect(next.due.getTime()).toBeGreaterThan(now.getTime())
    expect(next.due.getTime()).toBeLessThan(far.getTime())
  })

  it('resets a card the planner cannot read, instead of postponing it', () => {
    const now = new Date('2026-10-11T08:00:00.000Z')
    const broken = fromStored({
      ...toStored('de-vi:broken', emptyCard(now)),
      stability: Number.NaN,
      difficulty: 40,
      state: 9,
    })
    const next = reviewCard(broken, Rating.Good, now, 0.9, false)
    expect(next.state).toBe(0)
    expect(next.reps).toBe(0)
    expect(next.stability).toBe(0)
    expect(next.last_review).toBeUndefined()
    const dues = previewDue(broken, now, 0.9)
    expect(dues[Rating.Good].getTime()).toBeGreaterThan(now.getTime())
    expect(dues[Rating.Good].getTime()).toBeLessThan(now.getTime() + 30 * 86_400_000)
  })

  it('caps previewDue from an old last review without moving that review to now', () => {
    const now = new Date('2026-10-11T00:00:00.000Z')
    const reviewed = new Date('2020-01-01T00:00:00.000Z')
    const card = fromStored({
      cardId: 'de-vi:old',
      due: now.toISOString(),
      stability: 100000,
      difficulty: 5,
      elapsed_days: 2000,
      scheduled_days: 36500,
      learning_steps: 0,
      reps: 20,
      lapses: 0,
      state: 2,
      last_review: reviewed.toISOString(),
    })
    const dues = previewDue(card, now, 0.9)
    const limit = reviewed.getTime() + DUE_LIMIT_DAYS * 86_400_000
    expect(dues[Rating.Easy].getTime()).toBe(limit)
    expect(dues[Rating.Easy].getTime()).toBeLessThan(now.getTime() + DUE_LIMIT_DAYS * 86_400_000)
  })

  it('caps a due date 36500 days after the last review, or after now', () => {
    const anchor = '2020-01-01T00:00:00.000Z'
    const now = Date.parse('2026-10-11T00:00:00.000Z')
    const capped = capDueIso('2300-01-01T00:00:00.000Z', anchor, now)
    expect(Date.parse(capped)).toBe(Date.parse(anchor) + DUE_LIMIT_DAYS * 86_400_000)
    expect(capDueIso('2020-06-01T00:00:00.000Z', anchor, now)).toBe('2020-06-01T00:00:00.000Z')
    expect(Date.parse(capDueIso('2300-01-01T00:00:00.000Z', null, now))).toBe(now + DUE_LIMIT_DAYS * 86_400_000)
  })

  it('keeps a short session of reviews and new cards', () => {
    const catalog = requireCatalog()
    const concepts = catalog.concepts.slice(0, 20)
    const now = new Date('2026-10-10T08:00:00.000Z')
    const due = dueConcepts(concepts, [], 'de-vi', now)
    expect(due).toHaveLength(0)
    const session = buildSession(catalog.concepts, [], 'de-vi', now)
    expect(session).toHaveLength(4)
    expect(session.every((item) => item.isNew)).toBe(true)
    const ids = new Set<string>()
    for (const concept of session) ids.add(concept.id)
    expect(ids.size).toBe(session.length)
  })
})
