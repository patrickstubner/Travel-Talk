// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import { freshIndexedDb } from '../test-idb'
import { useEffect, type ReactNode } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProvider, useApp } from '../app/state'
import { DexieProgressRepository } from '../storage/dexie-repository'
import { PracticePage } from './Practice'

vi.mock('../audio/player', () => ({
  playClip: vi.fn(async () => 'file'),
  stopClip: vi.fn(),
}))

function ReadyPractice({ children }: { children: ReactNode }) {
  const { snapshot, saveSettings } = useApp()
  useEffect(() => {
    if (snapshot && (snapshot.settings.appLang !== 'de' || snapshot.settings.targetLang !== 'vi')) {
      void saveSettings({ ...snapshot.settings, appLang: 'de', targetLang: 'vi', speed: 'auto' })
    }
  }, [snapshot, saveSettings])
  if (snapshot?.settings.appLang !== 'de' || snapshot?.settings.targetLang !== 'vi') return null
  return children
}

beforeEach(() => {
  freshIndexedDb()
})

afterEach(() => {
  cleanup()
})

describe('word block', () => {
  it('asks for the meaning and stores Gut on the word card', async () => {
    render(
      <AppProvider>
        <ReadyPractice>
          <MemoryRouter initialEntries={['/practice?kind=new']}>
            <Routes>
              <Route path="/practice" element={<PracticePage />} />
            </Routes>
          </MemoryRouter>
        </ReadyPractice>
      </AppProvider>,
    )
    expect(await screen.findByText('Zuerst die Wörter von heute.')).toBeTruthy()
    expect(screen.getByTestId('target-line').textContent).toBe('ngày')
    expect(screen.queryByRole('button', { name: 'Aufnehmen' })).toBeNull()
    fireEvent.click(await screen.findByRole('button', { name: 'Tage' }))
    expect(await screen.findByText('Das stimmt.')).toBeTruthy()
    const repo = new DexieProgressRepository('travel-talk')
    await waitFor(async () => {
      const saved = (await repo.load()).cards.find((card) => card.cardId === 'de-vi:w.days')
      expect(saved?.reps).toBe(1)
      expect(saved?.learning_steps).toBe(1)
    })
  })

  it('stores Nochmal when the meaning is wrong and keeps the sentence shut', async () => {
    render(
      <AppProvider>
        <ReadyPractice>
          <MemoryRouter initialEntries={['/practice?kind=new']}>
            <Routes>
              <Route path="/practice" element={<PracticePage />} />
            </Routes>
          </MemoryRouter>
        </ReadyPractice>
      </AppProvider>,
    )
    fireEvent.click(await screen.findByRole('button', { name: 'bleiben' }))
    expect(await screen.findByText('Gemeint ist «Tage».')).toBeTruthy()
    const repo = new DexieProgressRepository('travel-talk')
    await waitFor(async () => {
      const saved = (await repo.load()).cards.find((card) => card.cardId === 'de-vi:w.days')
      expect(saved?.learning_steps).toBe(0)
    })
    expect(screen.queryByRole('button', { name: 'Aufnehmen' })).toBeNull()
  })
})
