// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { IDBFactory } from 'fake-indexeddb'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AppProvider } from '../app/state'
import { DexieProgressRepository } from '../storage/dexie-repository'
import { defaultSettings } from '../storage/types'
import { HomePage } from './Home'

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
})

afterEach(() => {
  cleanup()
})

describe('home hints', () => {
  it('shows the reset count and the voice hint once, and keeps the dismissal', async () => {
    const repo = new DexieProgressRepository('travel-talk')
    await repo.load()
    const raw = new Dexie('travel-talk')
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
    await raw.table('settings').put({ id: 'app', ...defaultSettings, appLang: 'de', targetLang: 'vi' })
    await raw.table('cards').put({ ...base, cardId: 'de-vi:emergency.help', stability: Number.NaN })
    await raw.table('cards').put({ ...base, cardId: 'de-vi:meet.hello', difficulty: 40 })
    raw.close()

    function page() {
      return render(
        <AppProvider>
          <MemoryRouter>
            <HomePage />
          </MemoryRouter>
        </AppProvider>,
      )
    }

    page()
    expect(await screen.findByText('2 Karten zurückgesetzt.')).toBeTruthy()
    expect(screen.getByText('Vietnamesisch')).toBeTruthy()
    expect(screen.queryByText('Deutsch')).toBeNull()
    expect(await screen.findByText('Für offline noch nicht vollständig geladen')).toBeTruthy()
    expect(screen.getByText(/Männerstimmen/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Verstanden' }))
    expect(screen.queryByText(/Männerstimmen/)).toBeNull()
    cleanup()

    page()
    expect(await screen.findByRole('heading', { name: 'Heute lernen' })).toBeTruthy()
    expect(screen.queryByText(/Männerstimmen/)).toBeNull()
    expect(screen.queryByText(/zurückgesetzt/)).toBeNull()
  })
})