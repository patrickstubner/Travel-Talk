import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { describe, expect, it } from 'vitest'
import { DexieProgressRepository } from './dexie-repository'
import { defaultSettings } from './types'

describe('dexie repository', () => {
  it('stores settings and cards in the port', async () => {
    const repo = new DexieProgressRepository(`travel-talk-test-${crypto.randomUUID()}`)
    const empty = await repo.load()
    expect(empty.settings).toEqual(defaultSettings)
    expect(empty.cards).toEqual([])
    const settings = { ...defaultSettings, appLang: 'pt-BR' as const, targetLang: 'vi' as const, personalNote: 'Nur lokal' }
    await repo.saveSettings(settings)
    await repo.saveCard({
      cardId: 'pt-vi:meet.hello',
      due: '2026-10-12T00:00:00.000Z',
      stability: 2,
      difficulty: 4,
      elapsed_days: 0,
      scheduled_days: 1,
      learning_steps: 1,
      reps: 1,
      lapses: 0,
      state: 1,
      last_review: null,
    })
    const loaded = await repo.load()
    expect(loaded.settings.appLang).toBe('pt-BR')
    expect(loaded.settings.targetLang).toBe('vi')
    expect(loaded.settings).not.toHaveProperty('pairId')
    expect(loaded.cards).toHaveLength(1)
    await repo.replaceAll({ settings: defaultSettings, cards: [] })
    const cleared = await repo.load()
    expect(cleared.cards).toEqual([])
  })

  it('reads a stored 0.1.0 slow flag as automatic unless it was on', async () => {
    const name = `travel-talk-test-${crypto.randomUUID()}`
    const repo = new DexieProgressRepository(name)
    await repo.load()
    const raw = new Dexie(name)
    raw.version(1).stores({ settings: 'id', cards: 'cardId' })
    const { speed: _speed, ...rest } = defaultSettings
    await raw.table('settings').put({ id: 'app', ...rest, slow: false })
    expect((await repo.load()).settings.speed).toBe('auto')
    await raw.table('settings').put({ id: 'app', ...rest, slow: true })
    expect((await repo.load()).settings.speed).toBe(0.85)
    const missing = { id: 'app', ...rest }
    await raw.table('settings').put(missing)
    expect((await repo.load()).settings.speed).toBe('auto')
    await raw.table('settings').put({ id: 'app', ...rest, pairId: 'pt-en', uiLang: 'de' })
    const migrated = (await repo.load()).settings
    expect(migrated.appLang).toBe('pt-BR')
    expect(migrated.targetLang).toBe('en')
    expect(migrated).not.toHaveProperty('pairId')
    raw.close()
  })

  it('resets a stored card that fails the import schema and saves the new card', async () => {
    const name = `travel-talk-test-${crypto.randomUUID()}`
    const repo = new DexieProgressRepository(name)
    await repo.load()
    const raw = new Dexie(name)
    raw.version(1).stores({ settings: 'id', cards: 'cardId' })
    const base = {
      due: '2026-10-11T00:00:00.000Z',
      stability: 2,
      difficulty: 5,
      elapsed_days: 0,
      scheduled_days: 1,
      learning_steps: 0,
      reps: 3,
      lapses: 0,
      state: 2,
      last_review: '2026-10-10T00:00:00.000Z',
    }
    await raw.table('cards').put({ ...base, cardId: 'de-vi:emergency.help', stability: Number.NaN })
    await raw.table('cards').put({ ...base, cardId: 'de-vi:meet.hello', difficulty: 40 })
    await raw.table('cards').put({ ...base, cardId: 'de-vi:food.water', state: 9 })
    const loaded = await repo.load()
    expect(loaded.cards).toHaveLength(3)
    for (const card of loaded.cards) {
      expect(card.state).toBe(0)
      expect(card.reps).toBe(0)
      expect(card.stability).toBe(0)
    }
    raw.close()
    const again = await repo.load()
    expect(again.cards).toHaveLength(3)
    expect(again.cards.every((card) => card.state === 0 && card.reps === 0 && card.stability === 0)).toBe(true)
  })
})
