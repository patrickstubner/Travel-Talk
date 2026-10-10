import 'fake-indexeddb/auto'
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
})
