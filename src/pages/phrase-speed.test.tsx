// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import { freshIndexedDb } from '../test-idb'
import { useEffect, type ReactNode } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { playClip } from '../audio/player'
import { AppProvider, useApp } from '../app/state'
import { PhrasePage } from './Phrase'

vi.mock('../audio/player', () => ({
  playClip: vi.fn(async () => 'file'),
  stopClip: vi.fn(),
  decodeContourFile: vi.fn(async () => null),
}))

function ReadyPhrase({ children }: { children: ReactNode }) {
  const { snapshot, saveSettings } = useApp()
  useEffect(() => {
    if (snapshot && (snapshot.settings.appLang !== 'de' || snapshot.settings.targetLang !== 'vi')) {
      void saveSettings({ ...snapshot.settings, appLang: 'de', targetLang: 'vi' })
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

describe('phrase speed', () => {
  it('shows one tempo control and keeps a fixed choice', async () => {
    render(
      <AppProvider>
        <ReadyPhrase>
          <MemoryRouter initialEntries={['/phrase/emergency.help']}>
            <Routes>
              <Route path="/phrase/:conceptId" element={<PhrasePage />} />
            </Routes>
          </MemoryRouter>
        </ReadyPhrase>
      </AppProvider>,
    )
    const control = await screen.findByTestId('speed-control')
    expect(control.querySelectorAll('button')).toHaveLength(4)
    expect(screen.getByRole('button', { name: 'Automatisch', pressed: true })).toBeTruthy()
    expect(screen.getByTestId('speed-now').textContent).toBe('Tempo 70 %')
    expect(screen.queryByRole('button', { name: 'Langsam anhören' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Anhören' }))
    expect(vi.mocked(playClip).mock.calls[0]?.[0]).toMatch(/\.r70\.m4a$/)
    fireEvent.click(screen.getByRole('button', { name: '100 %' }))
    expect(await screen.findByRole('button', { name: '100 %', pressed: true })).toBeTruthy()
    expect(screen.getByTestId('speed-now').textContent).toBe('Tempo 100 %')
    expect(screen.getByText('Fest 100 % für die Sätze, bis du wieder Automatisch wählst. Einzelne Wörter haben ihr eigenes Tempo.')).toBeTruthy()
  })
})
