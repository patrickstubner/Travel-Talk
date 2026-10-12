import { describe, expect, it } from 'vitest'
import { DUE_LIMIT_DAYS, Rating, emptyCard, reviewCard, toStored } from '../srs/scheduler'
import { EXPORT_FORMAT, IMPORT_CARD_LIMIT, IMPORT_FUTURE, IMPORT_LIMIT, IMPORT_NEWER, emptySnapshot, importKeepsLocalNote, parseImport, previewImport, retainLocalNote, toExport } from './import'
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

  it('keeps a word card for a checked id', () => {
    const known = new Set(['emergency.help', 'w.water'])
    const outcome = parseImport(bundle([{ ...card(), cardId: 'de-vi:w.water' }, { ...card(), cardId: 'de-vi:w.missing' }]), known)
    expect(outcome.snapshot.cards.map((item) => item.cardId)).toEqual(['de-vi:w.water'])
    expect(outcome.skipped).toBe(1)
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
    expect(coerceSettings({ voices: { vi: 'not-a-bundled-voice', de: 'thorsten' } }).voices).toEqual({ de: 'thorsten' })
    expect(coerceSettings({ highlightWords: false }).highlightWords).toBe(false)
    expect(coerceSettings({ highlightWords: true }).highlightWords).toBeUndefined()
    expect(coerceSettings({ wordSpeed: 0.7 }).wordSpeed).toBe(0.7)
    expect(coerceSettings({ wordSpeed: 1 }).wordSpeed).toBe(1)
    expect(coerceSettings({ wordSpeed: 0.5 as never }).wordSpeed).toBeUndefined()
    expect(coerceSettings({}).wordSpeed).toBeUndefined()
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
      people: { settings: Record<string, unknown> }[]
    }
    expect(again.format).toBe(EXPORT_FORMAT)
    expect(again.people[0]?.settings.appLang).toBe('pt-BR')
    expect(again.people[0]?.settings.pairId).toBeUndefined()
  })

  it('rejects format 3 when the languages match, or when an old field remains', () => {
    const file = JSON.parse(toExport({ settings: current, cards: [] }, new Date('2026-10-11T00:00:00.000Z'))) as {
      people: { settings: Record<string, unknown> }[]
    }
    const settings = file.people[0]?.settings
    if (!settings) throw new Error('missing person')
    settings.targetLang = 'de'
    expect(() => parseImport(JSON.stringify(file), concepts)).toThrow('IMPORT_REJECTED')
    settings.targetLang = 'vi'
    settings.pairId = 'de-vi'
    expect(() => parseImport(JSON.stringify(file), concepts)).toThrow('IMPORT_REJECTED')
    delete settings.pairId
    settings.uiLang = 'de'
    expect(() => parseImport(JSON.stringify(file), concepts)).toThrow('IMPORT_REJECTED')
    delete settings.uiLang
    settings.voices = { vi: 'vais1000', extra: 'no' }
    expect(() => parseImport(JSON.stringify(file), concepts)).toThrow('IMPORT_REJECTED')
    settings.voices = { vi: 'vais1000' }
    expect(parseImport(JSON.stringify(file), concepts).snapshot.settings.voices).toEqual({ vi: 'vais1000' })
    settings.voices = { vi: 'not a voice' }
    expect(() => parseImport(JSON.stringify(file), concepts)).toThrow('IMPORT_REJECTED')
  })

  it('rejects a format 3 file with an unknown top-level field', () => {
    const file = JSON.parse(toExport({ settings: current, cards: [] }, new Date('2026-10-11T00:00:00.000Z'))) as Record<string, unknown>
    file.surprise = true
    expect(() => parseImport(JSON.stringify(file), concepts)).toThrow('IMPORT_REJECTED')
  })

  it('caps a last review a few seconds after the export and keeps the file', () => {
    const exportedAt = Date.now() - 60_000
    const raw = JSON.parse(bundle([card()])) as { exportedAt: string; cards: { last_review: string }[] }
    raw.exportedAt = new Date(exportedAt).toISOString()
    raw.cards[0]!.last_review = new Date(exportedAt + 5_000).toISOString()
    const outcome = parseImport(JSON.stringify(raw), concepts)
    expect(outcome.snapshot.cards).toHaveLength(1)
    expect(outcome.snapshot.cards[0]?.last_review).toBe(new Date(exportedAt).toISOString())
  })

  it('rejects an export dated more than a day in the future', () => {
    const raw = JSON.parse(bundle()) as { exportedAt: string }
    raw.exportedAt = '2031-01-01T00:00:00.000Z'
    expect(() => parseImport(JSON.stringify(raw), concepts)).toThrow(IMPORT_FUTURE)
    raw.exportedAt = new Date(Date.now() + 86_400_000 + 60_000).toISOString()
    expect(() => parseImport(JSON.stringify(raw), concepts)).toThrow(IMPORT_FUTURE)
    raw.exportedAt = new Date(Date.now() + 86_400_000).toISOString()
    expect(parseImport(JSON.stringify(raw), concepts).snapshot.cards).toEqual([])
  })

  it('rejects an exportedAt that is not an ISO datetime', () => {
    const raw = JSON.parse(bundle()) as { exportedAt: string }
    raw.exportedAt = '2026-10-10'
    expect(() => parseImport(JSON.stringify(raw), concepts)).toThrow('IMPORT_REJECTED')
  })

  it('caps a due date more than 36500 days after the last review and does not pull it to now', () => {
    const raw = JSON.parse(bundle([card()])) as { cards: { due: string; last_review: string }[] }
    raw.cards[0]!.last_review = '2020-01-01T00:00:00.000Z'
    raw.cards[0]!.due = '2300-01-01T00:00:00.000Z'
    const due = Date.parse(parseImport(JSON.stringify(raw), concepts).snapshot.cards[0]?.due ?? '')
    expect(due).toBe(Date.parse('2020-01-01T00:00:00.000Z') + DUE_LIMIT_DAYS * 86_400_000)
    expect(due).toBeGreaterThan(Date.now())
  })

  it('drops an unknown voice id and keeps a known one', () => {
    const file = JSON.parse(toExport({ settings: current, cards: [] }, new Date('2026-10-11T00:00:00.000Z'))) as {
      people: { settings: { voices?: Record<string, string> } }[]
    }
    const settings = file.people[0]?.settings
    if (!settings) throw new Error('missing person')
    settings.voices = { vi: 'not-a-bundled-voice', de: 'thorsten-high' }
    expect(parseImport(JSON.stringify(file), concepts).snapshot.settings.voices).toEqual({ de: 'thorsten-high' })
    settings.voices = { vi: 'not-a-bundled-voice' }
    expect(parseImport(JSON.stringify(file), concepts).snapshot.settings.voices).toBeUndefined()
    settings.voices = { vi: 'not a voice' }
    expect(() => parseImport(JSON.stringify(file), concepts)).toThrow('IMPORT_REJECTED')
  })

  it('keeps the voice hint out of the export', () => {
    const text = toExport({ settings: { ...current, voiceHintSeen: true }, cards: [] }, new Date('2026-10-11T00:00:00.000Z'))
    expect(text).not.toContain('voiceHintSeen')
    const withHighlight = toExport({ settings: { ...current, highlightWords: false }, cards: [] }, new Date('2026-10-11T00:00:00.000Z'))
    expect(withHighlight).not.toContain('highlightWords')
  })

  it('keeps a word tempo on the file and rejects a step that is not 70, 85 or 100', () => {
    const text = toExport({ settings: { ...current, wordSpeed: 0.7 }, cards: [] }, new Date('2026-10-11T00:00:00.000Z'))
    expect(text).toContain('"wordSpeed": 0.7')
    const plain = toExport({ settings: current, cards: [] }, new Date('2026-10-11T00:00:00.000Z'))
    expect(plain).not.toContain('wordSpeed')
    expect(parseImport(text, concepts).snapshot.settings.wordSpeed).toBe(0.7)
    const raw = JSON.parse(text) as { people: { settings: { wordSpeed: unknown } }[] }
    raw.people[0]!.settings.wordSpeed = 0.5
    expect(() => parseImport(JSON.stringify(raw), concepts)).toThrow('IMPORT_REJECTED')
    raw.people[0]!.settings.wordSpeed = 1
    expect(parseImport(JSON.stringify(raw), concepts).snapshot.settings.wordSpeed).toBe(1)
  })

  it('caps last review and due in a format 4 file', () => {
    const exportedAt = Date.now() - 60_000
    const raw = JSON.parse(personBundle([v4Person('A', [card()])])) as {
      exportedAt: string
      people: { cards: { due: string; last_review: string }[] }[]
    }
    raw.exportedAt = new Date(exportedAt).toISOString()
    raw.people[0]!.cards[0]!.last_review = new Date(exportedAt + 5_000).toISOString()
    const capped = parseImport(JSON.stringify(raw), concepts)
    expect(capped.people[0]?.cards[0]?.last_review).toBe(new Date(exportedAt).toISOString())
    raw.people[0]!.cards[0]!.last_review = '2020-01-01T00:00:00.000Z'
    raw.people[0]!.cards[0]!.due = '2300-01-01T00:00:00.000Z'
    const due = Date.parse(parseImport(JSON.stringify(raw), concepts).people[0]?.cards[0]?.due ?? '')
    expect(due).toBe(Date.parse('2020-01-01T00:00:00.000Z') + DUE_LIMIT_DAYS * 86_400_000)
  })

  it('rejects a person whose name is only an invisible character', () => {
    expect(() => parseImport(personBundle([v4Person('\u3164', [card()]), v4Person('B', [])], 'all'), concepts)).toThrow('IMPORT_REJECTED')
  })

  it('rejects duplicate cards, a one-person file with several people, and more than 8000 cards', () => {
    expect(() => parseImport(personBundle([v4Person('A', [card(), card()])]), concepts)).toThrow('IMPORT_REJECTED')
    expect(() => parseImport(personBundle([v4Person('A', []), v4Person('B', [])]), concepts)).toThrow('IMPORT_REJECTED')
    const many = Array.from({ length: IMPORT_CARD_LIMIT / 2 + 1 }, (_, index) => ({ ...card(), cardId: `de-vi:n${index}` }))
    const over = personBundle([v4Person('A', many.slice(0, IMPORT_CARD_LIMIT / 2)), v4Person('B', many)], 'all')
    expect(() => parseImport(over, concepts)).toThrow('IMPORT_REJECTED')
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

function v4Settings(note = '') {
  return {
    appLang: 'de',
    targetLang: 'vi',
    viRegion: 'south',
    addressVi: 'anh',
    addressPt: 'voce',
    addressDe: 'sie',
    ptSpeaker: 'obrigado',
    viContact: 'phone',
    retention: 0.9,
    personalNote: note,
    speed: 'auto',
  }
}

function v4Person(name: string, cards: unknown[], note = '') {
  return { name, level: 0, settings: v4Settings(note), cards }
}

function personBundle(people: unknown[], scope: 'person' | 'all' = 'person'): string {
  return JSON.stringify({
    app: 'travel-talk',
    format: 4,
    exportedAt: new Date(Date.now() - 60_000).toISOString(),
    scope,
    people,
  })
}

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
