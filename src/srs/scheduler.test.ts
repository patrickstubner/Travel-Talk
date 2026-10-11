import { describe, expect, it } from 'vitest'
import { requireCatalog } from '../content/load'
import { Rating, emptyCard, previewDue, reviewCard, toStored, fromStored } from './scheduler'
import { buildSession, dueConcepts } from './session'

describe('fsrs', () => {
  it('moves the due date after a review', () => {
    const now = new Date('2026-10-10T08:00:00.000Z')
    const next = reviewCard(emptyCard(now), Rating.Good, now, 0.9, false)
    expect(next.due.getTime()).toBeGreaterThan(now.getTime())
    expect(next.reps).toBeGreaterThan(0)
    expect(next.difficulty).toBeLessThanOrEqual(10)
  })

  it('keeps scheduling when the last review is dated after now', () => {
    const now = new Date('2026-10-11T08:00:00.000Z')
    const reviewed = reviewCard(emptyCard(now), Rating.Good, now, 0.9, false)
    const future = fromStored({
      ...toStored('de-vi:future', reviewed),
      last_review: new Date(now.getTime() + 86_400_000).toISOString(),
    })
    expect(() => previewDue(future, now, 0.9)).not.toThrow()
    const next = reviewCard(future, Rating.Good, now, 0.9, false)
    expect(next.due.getTime()).toBeGreaterThanOrEqual(future.last_review?.getTime() ?? 0)
    expect(Number.isNaN(next.due.getTime())).toBe(false)
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
