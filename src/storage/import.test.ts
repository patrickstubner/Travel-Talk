import { describe, expect, it } from 'vitest'
import { Rating, emptyCard, reviewCard, toStored } from '../srs/scheduler'
import { EXPORT_FORMAT, IMPORT_LIMIT, IMPORT_NEWER, emptySnapshot, importKeepsLocalNote, parseImport, previewImport, retainLocalNote, toExport } from './import'
import { cleanPersonalNote, coerceSettings, defaultSettings } from './types'

const current = { ...defaultSettings, appLang: 'de' as const, targetLang: 'vi' as const, personalNote: 'Erdnüsse' }
const legacySettings = {
  pairId: 'de-vi' as const,
  uiLang: 'de' as const,
  viRegion: 'south' as const,
  addressVi: 'anh',
  addressPt: 'voce',
  addressDe: 'sie',
  ptSpeaker: 'obrigado' as const,
  viContact: 'phone' as const,
  retention: 0.9,
  personalNote: 'Erdnüsse',
  speed: 'auto' as const,
}
const concepts = new Set(['emergency.help'])

function bundle(cards: unknown[] = [], note: object = legacySettings): string {
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
    const snapshot = { settings: current, cards: [toStored('de-vi:emergency.help', reviewed)] }
    const parsed = parseImport(toExport(snapshot, now, true), concepts)
    expect(parsed.snapshot.cards[0]?.cardId).toBe('de-vi:emergency.help')
    expect(parsed.snapshot.settings.personalNote).toBe('Erdnüsse')
    expect(parsed.skipped).toBe(0)
    expect(Date.parse(parsed.snapshot.cards[0]?.due ?? '')).toBeGreaterThan(now.getTime())
  })

  it('leaves the note out of the export unless asked', () => {
    const now = new Date('2026-10-10T12:00:00.000Z')
    const text = toExport({ settings: current, cards: [] }, now)
    expect(text).not.toContain('Erdnüsse')
    expect(JSON.parse(text).format).toBe(EXPORT_FORMAT)
    expect(text).toContain('"appLang"')
    expect(text).toContain('"targetLang"')
    expect(text).not.toContain('pairId')
    expect(text).not.toContain('uiLang')
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
    const { speed: _speed, ...rest } = legacySettings
    const legacy = (slow: boolean) =>
      JSON.stringify({
        app: 'travel-talk',
        format: 1,
        exportedAt: '2026-10-10T00:00:00.000Z',
        settings: { ...rest, slow },
        cards: [],
      })
    expect(parseImport(legacy(false), concepts).snapshot.settings.speed).toBe('auto')
    expect(parseImport(legacy(true), concepts).snapshot.settings.speed).toBe(0.85)
    const missing = JSON.parse(legacy(false)) as { settings: { slow?: boolean } }
    delete missing.settings.slow
    expect(parseImport(JSON.stringify(missing), concepts).snapshot.settings.speed).toBe('auto')
    const withSpeed = JSON.parse(legacy(true)) as { settings: { speed: number } }
    withSpeed.settings.speed = 0.7
    expect(parseImport(JSON.stringify(withSpeed), concepts).snapshot.settings.speed).toBe(0.7)
    expect(() => {
      const bad = JSON.parse(legacy(false)) as { settings: { speed: number } }
      bad.settings.speed = 0.5
      parseImport(JSON.stringify(bad), concepts)
    }).toThrow('IMPORT_REJECTED')
    expect(coerceSettings({ ...rest, slow: false }).speed).toBe('auto')
    expect(coerceSettings({ slow: true }).speed).toBe(0.85)
    expect(coerceSettings({}).speed).toBe('auto')
    expect(cleanPersonalNote('Erd\u0000nüsse')).toBe('Erdnüsse')
    expect(coerceSettings({ personalNote: 'Erd\u0007nüsse\nZeile' }).personalNote).toBe('Erdnüsse\nZeile')
    expect(coerceSettings({ voices: { vi: 'not a voice', de: 'thorsten' } }).voices).toEqual({ de: 'thorsten' })
  })

  it('rejects a settings object that carries an unknown field', () => {
    for (const format of [1, 2]) {
      const raw = JSON.parse(bundle()) as { format: number; settings: Record<string, unknown> }
      raw.format = format
      raw.settings.extra = 'nope'
      expect(() => parseImport(JSON.stringify(raw), concepts)).toThrow('IMPORT_REJECTED')
      try {
        parseImport(JSON.stringify(raw), concepts)
      } catch (error) {
        expect((error as Error).message).toBe('IMPORT_REJECTED')
        expect((error as Error).message).not.toContain('extra')
      }
    }
  })

  it('asks for an update only when format is a safe integer above 2', () => {
    const header = (format: string) => `{"app":"travel-talk","format":${format}}`
    expect(JSON.parse('1e400')).toBe(Number.POSITIVE_INFINITY)
    expect(Number.isSafeInteger(2.5)).toBe(false)
    expect(Number.isSafeInteger(JSON.parse('1e308'))).toBe(false)
    for (const format of ['2.5', '1e308', '1e400', '"3"']) {
      try {
        parseImport(header(format), concepts)
        expect.fail('expected a rejection')
      } catch (error) {
        expect((error as Error).message).toBe('IMPORT_REJECTED')
        expect((error as Error).message).not.toBe(IMPORT_NEWER)
      }
    }
  })

  it('rejects format 2 when slow is present or speed is missing', () => {
    const base = JSON.parse(bundle()) as { format: number; settings: Record<string, unknown> }
    base.format = 2
    delete base.settings.speed
    expect(() => parseImport(JSON.stringify(base), concepts)).toThrow('IMPORT_REJECTED')
    base.settings.speed = 0.85
    base.settings.slow = false
    expect(() => parseImport(JSON.stringify(base), concepts)).toThrow('IMPORT_REJECTED')
    delete base.settings.slow
    expect(parseImport(JSON.stringify(base), concepts).snapshot.settings.speed).toBe(0.85)
  })

  it('asks for an update when the format is newer than this app', () => {
    const raw = JSON.parse(bundle()) as { format: number; settings: Record<string, unknown> }
    raw.format = EXPORT_FORMAT + 1
    raw.settings.future = true
    expect(() => parseImport(JSON.stringify(raw), concepts)).toThrow(IMPORT_NEWER)
    try {
      parseImport(JSON.stringify(raw), concepts)
    } catch (error) {
      expect((error as Error).message).toBe(IMPORT_NEWER)
      expect((error as Error).message).not.toContain('future')
    }
    expect(() => parseImport(JSON.stringify({ app: 'other', format: 9 }), concepts)).toThrow('IMPORT_REJECTED')
  })

  it('starts from an empty snapshot', () => {
    expect(emptySnapshot().cards).toEqual([])
    const migrated = parseImport(bundle(), concepts)
    expect(migrated.snapshot.settings.appLang).toBe('de')
    expect(migrated.snapshot.settings.targetLang).toBe('vi')
    expect(migrated.uiNotRelabeled).toBe(false)
    expect(migrated.snapshot.settings).not.toHaveProperty('pairId')
    expect(migrated.snapshot.settings).not.toHaveProperty('uiLang')
  })

  it('migrates format 2 to app and target language and keeps the card id', () => {
    const raw = JSON.parse(bundle([card('pt-en:emergency.help')])) as {
      format: number
      settings: { pairId: string; uiLang: string }
    }
    raw.format = 2
    raw.settings.pairId = 'pt-en'
    raw.settings.uiLang = 'de'
    const outcome = parseImport(JSON.stringify(raw), concepts)
    expect(outcome.snapshot.settings.appLang).toBe('pt-BR')
    expect(outcome.snapshot.settings.targetLang).toBe('en')
    expect(outcome.uiNotRelabeled).toBe(true)
    expect(outcome.snapshot.cards[0]?.cardId).toBe('pt-en:emergency.help')
    expect(outcome.snapshot.settings).not.toHaveProperty('pairId')
    const again = JSON.parse(toExport(outcome.snapshot, new Date('2026-10-11T00:00:00.000Z'), true)) as {
      format: number
      settings: Record<string, unknown>
    }
    expect(again.format).toBe(3)
    expect(again.settings.appLang).toBe('pt-BR')
    expect(again.settings.pairId).toBeUndefined()
  })

  it('rejects format 3 when the languages match, or when an old field remains', () => {
    const file = JSON.parse(toExport({ settings: current, cards: [] }, new Date('2026-10-11T00:00:00.000Z'))) as {
      settings: Record<string, unknown>
    }
    file.settings.targetLang = 'de'
    expect(() => parseImport(JSON.stringify(file), concepts)).toThrow('IMPORT_REJECTED')
    file.settings.targetLang = 'vi'
    file.settings.pairId = 'de-vi'
    expect(() => parseImport(JSON.stringify(file), concepts)).toThrow('IMPORT_REJECTED')
    delete file.settings.pairId
    file.settings.uiLang = 'de'
    expect(() => parseImport(JSON.stringify(file), concepts)).toThrow('IMPORT_REJECTED')
    delete file.settings.uiLang
    file.settings.voices = { vi: 'vais1000', extra: 'no' }
    expect(() => parseImport(JSON.stringify(file), concepts)).toThrow('IMPORT_REJECTED')
    file.settings.voices = { vi: 'vais1000' }
    expect(parseImport(JSON.stringify(file), concepts).snapshot.settings.voices).toEqual({ vi: 'vais1000' })
    file.settings.voices = { vi: 'not a voice' }
    expect(() => parseImport(JSON.stringify(file), concepts)).toThrow('IMPORT_REJECTED')
  })

  it('rejects a format 3 file with an unknown top-level field', () => {
    const file = JSON.parse(toExport({ settings: current, cards: [] }, new Date('2026-10-11T00:00:00.000Z'))) as Record<string, unknown>
    file.surprise = true
    expect(() => parseImport(JSON.stringify(file), concepts)).toThrow('IMPORT_REJECTED')
  })

  it('rejects a last review dated after the export', () => {
    const raw = JSON.parse(bundle([card()])) as { exportedAt: string; cards: { last_review: string }[] }
    raw.exportedAt = '2026-10-10T00:00:00.000Z'
    raw.cards[0]!.last_review = '2026-10-11T00:00:00.000Z'
    expect(() => parseImport(JSON.stringify(raw), concepts)).toThrow('IMPORT_REJECTED')
    raw.cards[0]!.last_review = '2026-10-10T00:00:00.000Z'
    expect(parseImport(JSON.stringify(raw), concepts).snapshot.cards).toHaveLength(1)
  })

  it('maps every old pair, including pt-vi, onto the two languages', () => {
    const pairs: Array<[string, string, string]> = [
      ['de-vi', 'de', 'vi'],
      ['de-pt', 'de', 'pt-BR'],
      ['pt-de', 'pt-BR', 'de'],
      ['en-pt', 'en', 'pt-BR'],
      ['pt-en', 'pt-BR', 'en'],
      ['pt-vi', 'pt-BR', 'vi'],
      ['vi-pt', 'vi', 'pt-BR'],
    ]
    for (const [pairId, appLang, targetLang] of pairs) {
      const raw = JSON.parse(bundle()) as { format: number; settings: { pairId: string; uiLang: string } }
      raw.format = 2
      raw.settings.pairId = pairId
      raw.settings.uiLang = 'source'
      const settings = parseImport(JSON.stringify(raw), concepts).snapshot.settings
      expect(settings.appLang).toBe(appLang)
      expect(settings.targetLang).toBe(targetLang)
      expect(settings).not.toHaveProperty('pairId')
    }
  })
})

function card(cardId = 'de-vi:emergency.help') {
  return {
    cardId,
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
