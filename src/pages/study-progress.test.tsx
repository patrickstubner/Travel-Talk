// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import { freshIndexedDb } from '../test-idb'
import { useEffect, type ReactNode } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { State } from 'ts-fsrs'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { WORDS } from '../../content/words'
import { AppProvider, useApp } from '../app/state'
import { DexieProgressRepository } from '../storage/dexie-repository'
import { defaultSettings, type StoredCard } from '../storage/types'
import { seedPassedWords } from '../test-words'
import { HomePage } from './Home'
import { PracticePage } from './Practice'

function Ready({ children }: { children: ReactNode }) {
  const { snapshot, saveSettings } = useApp()
  useEffect(() => {
    if (snapshot && (snapshot.settings.appLang !== 'de' || snapshot.settings.targetLang !== 'vi')) {
      void saveSettings({ ...snapshot.settings, appLang: 'de', targetLang: 'vi', voiceHintSeen: true })
    }
  }, [snapshot, saveSettings])
  if (snapshot?.settings.appLang !== 'de' || snapshot?.settings.targetLang !== 'vi') return null
  return children
}

function card(cardId: string, at: Date, state: number, elapsed: number): StoredCard {
  return {
    cardId,
    due: '2026-10-20T12:00:00.000Z',
    stability: 4,
    difficulty: 5,
    elapsed_days: elapsed,
    scheduled_days: 1,
    learning_steps: 0,
    reps: 2,
    lapses: 0,
    state,
    last_review: at.toISOString(),
  }
}

beforeEach(() => {
  freshIndexedDb()
})

afterEach(() => {
  cleanup()
})

describe('study progress on the pages', () => {
  it('shows the compact bars on the learn page for this person', async () => {
    await seedPassedWords()
    render(
      <AppProvider>
        <Ready>
          <MemoryRouter initialEntries={['/practice']}>
            <Routes>
              <Route path="/practice" element={<PracticePage />} />
            </Routes>
          </MemoryRouter>
        </Ready>
      </AppProvider>,
    )
    expect(await screen.findByRole('button', { name: 'Weiter' })).toBeTruthy()
    const view = screen.getByTestId('study-progress')
    expect(view.getAttribute('data-variant')).toBe('compact')
    expect(screen.getByTestId('study-learned').getAttribute('data-words')).toBe(String(WORDS.length))
    expect(screen.getByTestId('study-learned').getAttribute('data-sentences')).toBe('0')
  })

  it('shows the fuller bars on the start page', async () => {
    const repo = new DexieProgressRepository('travel-talk')
    const personId = (await repo.load()).activePersonId ?? ''
    const today = new Date()
    await repo.saveSettings(personId, { ...defaultSettings, appLang: 'de', targetLang: 'vi', voiceHintSeen: true })
    await repo.saveCard(personId, card('de-vi:meet.hello', today, State.Review, 3))
    await repo.saveCard(personId, card('de-vi:w.water', today, State.Learning, 0))
    render(
      <AppProvider>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </AppProvider>,
    )
    const view = await screen.findByTestId('study-progress')
    expect(view.getAttribute('data-variant')).toBe('full')
    expect(screen.getByTestId('study-learned').getAttribute('data-sentences')).toBe('1')
    expect(screen.getByTestId('study-learned').getAttribute('data-words')).toBe('1')
    expect(screen.getByTestId('study-reviewed').getAttribute('data-count')).toBe('1')
    expect(screen.getByTestId('study-kept').getAttribute('data-percent')).toBe('50')
  })
})
