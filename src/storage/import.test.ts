import { describe, expect, it } from 'vitest'
import { Rating, emptyCard, reviewCard, toStored } from '../srs/scheduler'
import { IMPORT_LIMIT, emptySnapshot, importKeepsLocalNote, parseImport, previewImport, retainLocalNote, toExport } from './import'
import { coerceSettings, defaultSettings } from './types'

const settings = { ...defaultSettings, pairId: 'de-vi' as const, personalNote: 'Erdnüsse' }
const concepts = new Set(['emergency.help'])

function bundle(cards: unknown[] = [], note = settings): string {
  return JSON.stringify({
    app: 'travel-talk',
    format: 1,
    exportedAt: '2026-10-10T00:00:00.000Z',
    settings: note,
    cards,
  })
}

describe('import', () => {
  it('round-trips a reviewed card when the note is included', () => {
    const now = new Date('2026-10-10T12:00:00.000Z')
    const reviewed = reviewCard(emptyCard(now), Rating.Good, now, 0.9, false)
    const snapshot = { settings, cards: [toStored('de-vi:emergency.help', reviewed)] }
    const parsed = parseImport(toExport(snapshot, now, true), concepts)
    expect(parsed.snapshot.cards[0]?.cardId).toBe('de-vi:emergency.help')
    expect(parsed.snapshot.settings.personalNote).toBe('Erdnüsse')
    expect(parsed.skipped).toBe(0)
    expect(Date.parse(parsed.snapshot.cards[0]?.due ?? '')).toBeGreaterThan(now.getTime())
  })

  it('leaves the note out of the export unless asked', () => {
    const now = new Date('2026-10-10T12:00:00.000Z')
    const text = toExport({ settings, cards: [] }, now)
    expect(text).not.toContain('Erdnüsse')
    expect(text).toContain('"speed"')
    expect(text).not.toContain('"slow"')
    expect(parseImport(text, concepts).snapshot.settings.personalNote).toBe('')
    expect(parseImport(text, concepts).snapshot.settings.speed).toBe('auto')
  })

  it('rejects hostile or broken files without echoing them', () => {
    expect(() => parseImport('{"__proto__":{"polluted":true}}', concepts)).toThrow('IMPORT_REJECTED')
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined()
    expect(() =>
      parseImport(bundle([{ ...card(), cardId: 'de-vi:emergency.help' }, { ...card(), cardId: 'de-vi:emergency.help' }]), concepts),
    ).toThrow('IMPORT_REJECTED')
    expect(() => parseImport('x'.repeat(IMPORT_LIMIT + 1), concepts)).toThrow('IMPORT_REJECTED')
    expect(() => parseImport(bundle([{ ...card(), difficulty: 99 }]), concepts)).toThrow('IMPORT_REJECTED')
    expect(() => parseImport('{"app":"travel-talk"}', concepts)).toThrow('IMPORT_REJECTED')
    expect(() => parseImport(bundle([{ ...card(), cardId: `de-vi:${'a'.repeat(80)}` }]), concepts)).toThrow('IMPORT_REJECTED')
    expect(() => parseImport(bundle([{ ...card(), due: '2026-10-11' }]), concepts)).toThrow('IMPORT_REJECTED')
    expect(() => parseImport(bundle([{ ...card(), due: `${'2026-10-11T00:00:00.000Z'}${'0'.repeat(20)}` }]), concepts)).toThrow(
      'IMPORT_REJECTED',
    )
    expect(() => parseImport(bundle([{ ...card(), last_review: 'yesterday' }]), concepts)).toThrow('IMPORT_REJECTED')
    try {
      parseImport('not json', concepts)
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toBe('IMPORT_REJECTED')
    }
  })

  it('skips unknown card ids and summarises what remains', () => {
    const outcome = parseImport(bundle([{ ...card(), cardId: 'de-vi:not-in-catalog' }, card()]), concepts)
    expect(outcome.skipped).toBe(1)
    expect(outcome.snapshot.cards).toHaveLength(1)
    const preview = previewImport(outcome.snapshot)
    expect(preview.cards).toBe(1)
    expect(preview.hasNote).toBe(true)
    expect(preview.earliest).toBe('2026-10-10')
    expect(preview.latest).toBe('2026-10-11')
  })

  it('keeps the local note when the imported file has none', () => {
    expect(importKeepsLocalNote('')).toBe(true)
    expect(importKeepsLocalNote('   ')).toBe(true)
    expect(importKeepsLocalNote('Pollen')).toBe(false)
    expect(retainLocalNote('Erdnüsse', '')).toBe('Erdnüsse')
    expect(retainLocalNote('Erdnüsse', '   ')).toBe('Erdnüsse')
    expect(retainLocalNote('Erdnüsse', 'Pollen')).toBe('Pollen')
  })

  it('rejects a file that omits the note field', () => {
    const raw = JSON.parse(bundle()) as { settings: { personalNote?: string } }
    delete raw.settings.personalNote
    expect(() => parseImport(JSON.stringify(raw), concepts)).toThrow('IMPORT_REJECTED')
  })

  it('maps a 0.1.0 slow flag and keeps an explicit speed', () => {
    const { speed: _speed, ...rest } = settings
    const legacy = (slow: boolean) =>
      JSON.stringify({
        app: 'travel-talk',
        format: 1,
        exportedAt: '2026-10-10T00:00:00.000Z',
        settings: { ...rest, slow },
        cards: [],
      })
    expect(parseImport(legacy(false), concepts).snapshot.settings.speed).toBe(1)
    expect(parseImport(legacy(true), concepts).snapshot.settings.speed).toBe(0.85)
    const withSpeed = JSON.parse(legacy(true)) as { settings: { speed: number } }
    withSpeed.settings.speed = 0.7
    expect(parseImport(JSON.stringify(withSpeed), concepts).snapshot.settings.speed).toBe(0.7)
    expect(() => {
      const bad = JSON.parse(legacy(false)) as { settings: { speed: number } }
      bad.settings.speed = 0.5
      parseImport(JSON.stringify(bad), concepts)
    }).toThrow('IMPORT_REJECTED')
    expect(coerceSettings({ ...rest, slow: false }).speed).toBe(1)
    expect(coerceSettings({ slow: true }).speed).toBe(0.85)
    expect(coerceSettings({}).speed).toBe('auto')
  })

  it('starts from an empty snapshot', () => {
    expect(emptySnapshot().cards).toEqual([])
    expect(parseImport(bundle(), concepts).snapshot.settings.pairId).toBe('de-vi')
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
