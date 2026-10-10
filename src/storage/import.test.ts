import { describe, expect, it } from 'vitest'
import { Rating, emptyCard, reviewCard, toStored } from '../srs/scheduler'
import { IMPORT_LIMIT, emptySnapshot, parseImport, toExport } from './import'
import { defaultSettings } from './types'

const settings = { ...defaultSettings, pairId: 'de-vi' as const, personalNote: 'Erdnüsse' }

function bundle(cards: unknown[] = []): string {
  return JSON.stringify({
    app: 'travel-talk',
    format: 1,
    exportedAt: '2026-10-10T00:00:00.000Z',
    settings,
    cards,
  })
}

describe('import', () => {
  it('round-trips a reviewed card', () => {
    const now = new Date('2026-10-10T12:00:00.000Z')
    const reviewed = reviewCard(emptyCard(now), Rating.Good, now, 0.9, false)
    const snapshot = { settings, cards: [toStored('de-vi:emergency.help', reviewed)] }
    const parsed = parseImport(toExport(snapshot, now))
    expect(parsed.cards[0]?.cardId).toBe('de-vi:emergency.help')
    expect(parsed.settings.personalNote).toBe('Erdnüsse')
    expect(Date.parse(parsed.cards[0]?.due ?? '')).toBeGreaterThan(now.getTime())
  })

  it('rejects hostile or broken files without echoing them', () => {
    expect(() => parseImport('{"__proto__":{"polluted":true}}')).toThrow('IMPORT_REJECTED')
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined()
    expect(() => parseImport(bundle([{ ...card(), cardId: 'de-vi:a' }, { ...card(), cardId: 'de-vi:a' }]))).toThrow(
      'IMPORT_REJECTED',
    )
    expect(() => parseImport('x'.repeat(IMPORT_LIMIT + 1))).toThrow('IMPORT_REJECTED')
    expect(() => parseImport(bundle([{ ...card(), difficulty: 99 }]))).toThrow('IMPORT_REJECTED')
    expect(() => parseImport('{"app":"travel-talk"}')).toThrow('IMPORT_REJECTED')
    try {
      parseImport('not json')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toBe('IMPORT_REJECTED')
    }
  })

  it('starts from an empty snapshot', () => {
    expect(emptySnapshot().cards).toEqual([])
    expect(parseImport(bundle()).settings.pairId).toBe('de-vi')
  })
})

function card() {
  return {
    cardId: 'de-vi:emergency.help',
    due: '2026-10-11T00:00:00.000Z',
    stability: 1,
    difficulty: 5,
    elapsed_days: 0,
    scheduled_days: 1,
    learning_steps: 0,
    reps: 1,
    lapses: 0,
    state: 2,
    last_review: '2026-10-10T00:00:00.000Z',
  }
}
