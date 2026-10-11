// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import { freshIndexedDb } from '../test-idb'
import { useEffect, type ReactNode } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProvider, useApp } from '../app/state'
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

describe('meaning step', () => {
  it('hides the word gloss until the meaning is chosen', async () => {
    render(
      <AppProvider>
        <ReadyPractice>
          <MemoryRouter initialEntries={['/practice']}>
            <Routes>
              <Route path="/practice" element={<PracticePage />} />
            </Routes>
          </MemoryRouter>
        </ReadyPractice>
      </AppProvider>,
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Jetzt in normalem Tempo' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Weiter' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Weiter' }))
    expect(await screen.findByText('Was bedeutet der Satz?')).toBeTruthy()
    expect(document.querySelector('.word-gloss')).toBeNull()
    expect(screen.queryByText('Die Wortzuordnung ist nicht geprüft.')).toBeNull()
    const choice = document.querySelector('.choices button')
    expect(choice).toBeTruthy()
    fireEvent.click(choice as HTMLButtonElement)
    expect(document.querySelector('.word-gloss')).toBeTruthy()
    expect(screen.getByText('Die Wortzuordnung ist nicht geprüft.')).toBeTruthy()
  })
})
