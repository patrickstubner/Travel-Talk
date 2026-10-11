import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { describe, expect, it } from 'vitest'
import { DexieProgressRepository } from './dexie-repository'
import { parseImport, toExport } from './import'
import { cleanPersonName, defaultSettings, type Settings, type StoredCard } from './types'

const concepts = new Set(['emergency.water', 'meet.hello'])

function card(cardId: string): StoredCard {
  return {
    cardId,
    due: '2026-10-11T00:00:00.000Z',
    stability: 2,
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

function learning(app: Settings['appLang'], target: Settings['targetLang'], voice?: string): Settings {
  return {
    ...defaultSettings,
    appLang: app,
    targetLang: target,
    ...(voice && target ? { voices: { [target]: voice } } : {}),
  }
}

describe('people on one device', () => {
  it('keeps an old database as person 1 with an empty name', async () => {
    const name = `travel-talk-test-${crypto.randomUUID()}`
    const raw = new Dexie(name)
    raw.version(1).stores({ settings: 'id', cards: 'cardId' })
    await raw.table('settings').put({
      id: 'app',
      ...defaultSettings,
      appLang: 'de',
      targetLang: 'vi',
      personalNote: 'Nur lokal',
      voices: { vi: 'vais1000' },
    })
    await raw.table('cards').put(card('de-vi:emergency.water'))
    raw.close()
    const loaded = await new DexieProgressRepository(name).load()
    expect(loaded.people).toHaveLength(1)
    expect(loaded.people?.[0]?.name).toBe('')
    expect(loaded.people?.[0]?.level).toBe(0)
    expect(loaded.activePersonId).toBe(loaded.people?.[0]?.id)
    expect(loaded.settings.appLang).toBe('de')
    expect(loaded.settings.targetLang).toBe('vi')
    expect(loaded.settings.personalNote).toBe('Nur lokal')
    expect(loaded.settings.voices?.vi).toBe('vais1000')
    expect(loaded.cards.map((item) => item.cardId)).toEqual(['de-vi:emergency.water'])
  })

  it('keeps each person progress separate and stops at ten people', async () => {
    const repo = new DexieProgressRepository(`travel-talk-test-${crypto.randomUUID()}`)
    const first = await repo.load()
    const firstId = first.activePersonId ?? ''
    expect(await repo.renamePerson(firstId, 'A')).toBe(true)
    await repo.saveSettings(firstId, learning('de', 'vi', 'vivos-22'))
    await repo.saveCard(firstId, card('de-vi:emergency.water'))
    expect(await repo.addPerson('\u0001')).toBe(false)
    expect(await repo.addPerson('B'.repeat(41))).toBe(false)
    for (let index = 1; index < 10; index += 1) {
      expect(await repo.addPerson(String.fromCharCode(65 + index))).toBe(true)
    }
    expect(await repo.addPerson('K')).toBe(false)
    const full = await repo.load()
    expect(full.people).toHaveLength(10)
    expect(full.people?.map((person) => person.name).sort()).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'])
    const activeB = full.people?.find((person) => person.id === full.activePersonId)
    expect(activeB?.name).toBe('J')
    expect(full.cards).toEqual([])
    await repo.switchPerson(firstId)
    const back = await repo.load()
    expect(back.settings.voices?.vi).toBe('vivos-22')
    expect(back.cards.map((item) => item.cardId)).toEqual(['de-vi:emergency.water'])
    await repo.replaceAll(firstId, { settings: learning('de', 'vi'), cards: [] })
    const cleared = await repo.load()
    expect(cleared.cards).toEqual([])
    expect(cleared.people).toHaveLength(10)
  })

  it('deletes one person and starts again when the last person is gone', async () => {
    const repo = new DexieProgressRepository(`travel-talk-test-${crypto.randomUUID()}`)
    const first = await repo.load()
    const firstId = first.activePersonId ?? ''
    await repo.renamePerson(firstId, 'A')
    await repo.saveCard(firstId, card('de-vi:emergency.water'))
    expect(await repo.addPerson('B')).toBe(true)
    const both = await repo.load()
    const personB = both.people?.find((person) => person.name === 'B')
    await repo.deletePerson(personB?.id ?? '')
    const left = await repo.load()
    expect(left.people?.map((person) => person.name)).toEqual(['A'])
    expect(left.cards.map((item) => item.cardId)).toEqual(['de-vi:emergency.water'])
    await repo.deletePerson(firstId)
    const fresh = await repo.load()
    expect(fresh.people).toHaveLength(1)
    expect(fresh.people?.[0]?.name).toBe('')
    expect(fresh.cards).toEqual([])
    expect(fresh.people?.[0]?.id).not.toBe(firstId)
  })

  it('imports one person without removing the others, and replaces everyone only on import all', async () => {
    const repo = new DexieProgressRepository(`travel-talk-test-${crypto.randomUUID()}`)
    const first = await repo.load()
    const firstId = first.activePersonId ?? ''
    await repo.renamePerson(firstId, 'A')
    await repo.saveSettings(firstId, learning('de', 'vi'))
    await repo.saveCard(firstId, card('de-vi:emergency.water'))
    const older = JSON.stringify({
      app: 'travel-talk',
      format: 3,
      exportedAt: '2026-10-10T00:00:00.000Z',
      settings: learning('de', 'en'),
      cards: [card('de-en:meet.hello')],
    })
    const parsed = parseImport(older, concepts)
    expect(parsed.scope).toBe('person')
    expect(parsed.people[0]?.name).toBe('')
    expect(await repo.importPerson('replace', { ...parsed.people[0]!, name: 'A' })).toBe('ok')
    expect(await repo.addPerson('B')).toBe(true)
    const added = await repo.importPerson('add', {
      name: 'C',
      settings: learning('pt-BR', 'en'),
      cards: [card('pt-en:meet.hello')],
    })
    expect(added).toBe('ok')
    const three = await repo.load()
    expect(three.people?.map((person) => person.name).sort()).toEqual(['A', 'B', 'C'])
    expect(three.cards.map((item) => item.cardId)).toEqual(['pt-en:meet.hello'])
    await repo.switchPerson(firstId)
    expect((await repo.load()).cards.map((item) => item.cardId)).toEqual(['de-en:meet.hello'])
    const packed = toExport(await repo.load(), new Date('2026-10-11T00:00:00.000Z'), false, {
      scope: 'all',
      people: [
        { name: 'A', settings: learning('de', 'vi'), cards: [card('de-vi:emergency.water')] },
        { name: 'B', settings: learning('pt-BR', 'en'), cards: [] },
      ],
    })
    const everyone = parseImport(packed, concepts)
    expect(everyone.scope).toBe('all')
    expect(everyone.people).toHaveLength(2)
    await repo.importAll(everyone.people)
    const replaced = await repo.load()
    expect(replaced.people?.map((person) => person.name).sort()).toEqual(['A', 'B'])
    expect(replaced.cards.map((item) => item.cardId)).toEqual(['de-vi:emergency.water'])
    expect(JSON.parse(packed).people[0].level).toBe(0)
  })

  it('rejects an invisible name and keeps a joiner between emoji', () => {
    const family = '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}'
    const withSelector = '\u{1F468}\uFE0F\u200D\u{1F469}\uFE0F'
    expect(cleanPersonName('\u3164')).toBeNull()
    expect(cleanPersonName('\u2800')).toBeNull()
    expect(cleanPersonName('\u0301')).toBeNull()
    expect(cleanPersonName(' \u3164 ')).toBeNull()
    expect(cleanPersonName('\u200D')).toBeNull()
    expect(cleanPersonName('A\u200DB')).toBe('AB')
    expect(cleanPersonName('a\u0301')).toBe('\u00e1')
    expect(cleanPersonName('Anna')).toBe('Anna')
    expect(cleanPersonName(family)).toBe(family)
    expect(cleanPersonName(withSelector)).toBe(withSelector)
  })

  it('does not switch to an unknown person or create one', async () => {
    const name = `travel-talk-test-${crypto.randomUUID()}`
    const repo = new DexieProgressRepository(name)
    const first = await repo.load()
    const id = first.activePersonId ?? ''
    await repo.switchPerson('missing')
    const raw = new Dexie(name)
    raw.version(3).stores({ people: 'id', device: 'id', personCards: '[personId+cardId], personId' })
    const device = await raw.table('device').get('device')
    expect(device?.activePersonId).toBe(id)
    expect(await raw.table('people').count()).toBe(1)
    raw.close()
  })

  it('keeps the local note when the imported note is empty', async () => {
    const repo = new DexieProgressRepository(`travel-talk-test-${crypto.randomUUID()}`)
    const first = await repo.load()
    const id = first.activePersonId ?? ''
    await repo.renamePerson(id, 'A')
    const local: Settings = { ...learning('de', 'vi'), personalNote: 'Nur lokal', voiceHintSeen: true, highlightWords: false, voices: { vi: 'vais1000' } }
    await repo.saveSettings(id, local)
    await repo.importPerson('replace', { name: 'C', settings: { ...learning('de', 'en'), personalNote: '   ' }, cards: [] }, local, id)
    const kept = await repo.load()
    expect(kept.settings.personalNote).toBe('Nur lokal')
    expect(kept.settings.voiceHintSeen).toBe(true)
    expect(kept.settings.highlightWords).toBe(false)
    expect(kept.settings.voices?.vi).toBe('vais1000')
    expect(kept.people?.find((person) => person.id === id)?.name).toBe('A')
    await repo.importPerson('replace', { name: 'C', settings: { ...learning('de', 'en'), personalNote: 'Neu' }, cards: [] }, kept.settings, id)
    expect((await repo.load()).settings.personalNote).toBe('Neu')
  })

  it('does not drop a person with an invisible name while replacing everyone', async () => {
    const repo = new DexieProgressRepository(`travel-talk-test-${crypto.randomUUID()}`)
    const first = await repo.load()
    await repo.renamePerson(first.activePersonId ?? '', 'A')
    await expect(
      repo.importAll([
        { name: 'B', settings: learning('de', 'vi'), cards: [card('de-vi:emergency.water')] },
        { name: '\u3164', settings: learning('de', 'en'), cards: [card('de-en:meet.hello')] },
      ]),
    ).rejects.toThrow('IMPORT_REJECTED')
    const kept = await repo.load()
    expect(kept.people?.map((person) => person.name)).toEqual(['A'])
    expect(kept.cards).toEqual([])
  })

  it('does not write a row for a person who was just deleted', async () => {
    const name = `travel-talk-test-${crypto.randomUUID()}`
    const repo = new DexieProgressRepository(name)
    const first = await repo.load()
    const id = first.activePersonId ?? ''
    await repo.deletePerson(id)
    await repo.saveCard(id, card('de-vi:emergency.water'))
    await repo.saveSettings(id, learning('de', 'vi'))
    await repo.replaceAll(id, { settings: learning('de', 'en'), cards: [card('de-en:meet.hello')] })
    const raw = new Dexie(name)
    raw.version(3).stores({ people: 'id', device: 'id', personCards: '[personId+cardId], personId' })
    const rows = await raw.table('personCards').toArray()
    raw.close()
    expect(rows.some((row: { personId: string }) => row.personId === id)).toBe(false)
    const loaded = await repo.load()
    expect(loaded.people?.some((person) => person.id === id)).toBe(false)
    expect(loaded.cards).toEqual([])
  })

  it('writes a late save to the person it names, not whoever is active', async () => {
    const repo = new DexieProgressRepository(`travel-talk-test-${crypto.randomUUID()}`)
    const first = await repo.load()
    const firstId = first.activePersonId ?? ''
    await repo.renamePerson(firstId, 'A')
    expect(await repo.addPerson('C')).toBe(true)
    await repo.saveSettings(firstId, learning('pt-BR', 'en'))
    await repo.saveCard(firstId, card('pt-en:meet.hello'))
    const active = await repo.load()
    expect(active.people?.find((person) => person.id === active.activePersonId)?.name).toBe('C')
    expect(active.settings.appLang).toBeNull()
    expect(active.cards).toEqual([])
    await repo.switchPerson(firstId)
    const back = await repo.load()
    expect(back.settings.appLang).toBe('pt-BR')
    expect(back.cards.map((item) => item.cardId)).toEqual(['pt-en:meet.hello'])
  })

  it('does not go past ten people when two adds run together', async () => {
    const repo = new DexieProgressRepository(`travel-talk-test-${crypto.randomUUID()}`)
    const first = await repo.load()
    await repo.renamePerson(first.activePersonId ?? '', 'A')
    for (let index = 1; index < 9; index += 1) {
      expect(await repo.addPerson(String.fromCharCode(65 + index))).toBe(true)
    }
    const [left, right] = await Promise.all([repo.addPerson('Y'), repo.addPerson('Z')])
    expect([left, right].filter(Boolean)).toHaveLength(1)
    expect((await repo.load()).people).toHaveLength(10)
  })

  it('keeps the current name when a format 4 file replaces that person', async () => {
    const repo = new DexieProgressRepository(`travel-talk-test-${crypto.randomUUID()}`)
    const first = await repo.load()
    const firstId = first.activePersonId ?? ''
    await repo.renamePerson(firstId, 'A')
    expect(
      await repo.importPerson('replace', { name: 'C', settings: learning('de', 'en'), cards: [card('de-en:meet.hello')] }, undefined, firstId),
    ).toBe('ok')
    const loaded = await repo.load()
    expect(loaded.people?.find((person) => person.id === firstId)?.name).toBe('A')
    expect(loaded.settings.targetLang).toBe('en')
    expect(loaded.cards.map((item) => item.cardId)).toEqual(['de-en:meet.hello'])
  })

  it('refuses another person from a file once ten are stored, and import all keeps only ten', async () => {
    const repo = new DexieProgressRepository(`travel-talk-test-${crypto.randomUUID()}`)
    const first = await repo.load()
    await repo.renamePerson(first.activePersonId ?? '', 'A')
    for (let index = 1; index < 10; index += 1) {
      expect(await repo.addPerson(String.fromCharCode(65 + index))).toBe(true)
    }
    expect(await repo.importPerson('add', { name: 'K', settings: learning('de', 'en'), cards: [] })).toBe('full')
    expect((await repo.load()).people).toHaveLength(10)
    const crowd = Array.from({ length: 11 }, (_, index) => ({
      name: `P${index}`,
      settings: learning('de', 'vi'),
      cards: index === 0 ? [card('de-vi:emergency.water')] : [],
    }))
    await repo.importAll(crowd)
    const sliced = await repo.load()
    expect(sliced.people).toHaveLength(10)
    expect(sliced.people?.some((person) => person.name === 'P10')).toBe(false)
    expect(sliced.people?.some((person) => person.name === 'P0')).toBe(true)
    expect(sliced.cards.map((item) => item.cardId)).toEqual(['de-vi:emergency.water'])
  })

  it('rejects a broken file without showing its content', () => {
    const secret = 'SECRET_BODY_7c2e'
    expect(() => parseImport(`{"leaked":"${secret}"}`, concepts)).toThrow('IMPORT_REJECTED')
    try {
      parseImport(`{"leaked":"${secret}"}`, concepts)
    } catch (error) {
      expect((error as Error).message).toBe('IMPORT_REJECTED')
      expect((error as Error).message).not.toContain(secret)
    }
  })
})
