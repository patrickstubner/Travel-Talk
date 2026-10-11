import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { describe, expect, it } from 'vitest'
import { DexieProgressRepository } from './dexie-repository'
import { parseImport, toExport } from './import'
import { defaultSettings, type Settings, type StoredCard } from './types'

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
    await repo.saveSettings(learning('de', 'vi', 'vivos-22'))
    await repo.saveCard(card('de-vi:emergency.water'))
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
    await repo.replaceAll({ settings: learning('de', 'vi'), cards: [] })
    const cleared = await repo.load()
    expect(cleared.cards).toEqual([])
    expect(cleared.people).toHaveLength(10)
  })

  it('deletes one person and starts again when the last person is gone', async () => {
    const repo = new DexieProgressRepository(`travel-talk-test-${crypto.randomUUID()}`)
    const first = await repo.load()
    const firstId = first.activePersonId ?? ''
    await repo.renamePerson(firstId, 'A')
    await repo.saveCard(card('de-vi:emergency.water'))
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
    await repo.saveSettings(learning('de', 'vi'))
    await repo.saveCard(card('de-vi:emergency.water'))
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
