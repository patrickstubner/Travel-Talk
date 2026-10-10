import { describe, expect, it } from 'vitest'
import { requireCatalog } from '../content/load'
import { Rating, emptyCard, reviewCard } from './scheduler'
import { buildSession, dueConcepts } from './session'

describe('fsrs', () => {
  it('moves the due date after a review', () => {
    const now = new Date('2026-10-10T08:00:00.000Z')
    const next = reviewCard(emptyCard(now), Rating.Good, now, 0.9, false)
    expect(next.due.getTime()).toBeGreaterThan(now.getTime())
    expect(next.reps).toBeGreaterThan(0)
    expect(next.difficulty).toBeLessThanOrEqual(10)
  })

  it('keeps a short session of reviews and new cards', () => {
    const catalog = requireCatalog()
    const concepts = catalog.concepts.slice(0, 20)
    const now = new Date('2026-10-10T08:00:00.000Z')
    const due = dueConcepts(concepts, [], 'de-vi', now)
    expect(due).toHaveLength(concepts.length)
    const session = buildSession(catalog.concepts, [], 'de-vi', now)
    expect(session.length).toBeLessThanOrEqual(12)
    expect(session.length).toBeGreaterThan(0)
    const ids = new Set<string>()
    for (const concept of session) ids.add(concept.id)
    expect(ids.size).toBe(session.length)
  })
})
