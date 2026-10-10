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
    const settings = { ...defaultSettings, pairId: 'pt-vi' as const, personalNote: 'Nur lokal' }
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
    expect(loaded.settings.pairId).toBe('pt-vi')
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
    raw.close()
  })
})
