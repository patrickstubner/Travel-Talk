// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { IDBFactory } from 'fake-indexeddb'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProvider } from '../app/state'
import { DexieProgressRepository } from '../storage/dexie-repository'
import { defaultSettings } from '../storage/types'
import { PracticePage } from './Practice'

vi.mock('../audio/player', () => ({
  playClip: vi.fn(async () => 'file'),
}))

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
})

afterEach(() => {
  cleanup()
})

describe('rating buttons', () => {
  it('shows a capped gap and saves the card from now', async () => {
    const now = Date.now()
    const far = new Date(now + 400 * 86_400_000).toISOString()
    const repo = new DexieProgressRepository('travel-talk')
    await repo.saveSettings({ ...defaultSettings, appLang: 'de', targetLang: 'vi' })
    await repo.saveCard({
      cardId: 'de-vi:emergency.help',
      due: new Date(now - 86_400_000).toISOString(),
      stability: 2,
      difficulty: 5,
      elapsed_days: 1,
      scheduled_days: 1,
      learning_steps: 0,
      reps: 3,
      lapses: 0,
      state: 2,
      last_review: far,
    })
    render(
      <AppProvider>
        <MemoryRouter initialEntries={['/practice?kind=review']}>
          <Routes>
            <Route path="/practice" element={<PracticePage />} />
          </Routes>
        </MemoryRouter>
      </AppProvider>,
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Hilfe!' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Weiter' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Ich habe es gesagt' }))
    const again = await screen.findByRole('button', { name: /Gleich noch einmal/ })
    const later = screen.getByRole('button', { name: /Später wieder/ })
    expect(again.textContent ?? '').not.toMatch(/\b\d{3,}\b/)
    expect(later.textContent ?? '').not.toMatch(/\b\d{3,}\b/)
    expect(screen.getByRole('button', { name: /Viel später/ }).textContent ?? '').not.toMatch(/\b\d{3,}\b/)
    fireEvent.click(again)
    const db = new Dexie('travel-talk')
    db.version(1).stores({ settings: 'id', cards: 'cardId' })
    await waitFor(async () => {
      const saved = await db.table('cards').get('de-vi:emergency.help')
      expect(saved.last_review).not.toBe(far)
      expect(Math.abs(Date.parse(saved.last_review) - Date.now())).toBeLessThan(15_000)
    })
    db.close()
  })
})
