// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import { freshIndexedDb } from '../test-idb'
import { useEffect, type ReactNode } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadAlignment } from '../audio/align'
import { AppProvider, useApp } from '../app/state'
import { PhrasePage } from './Phrase'

vi.mock('../audio/player', () => ({
  playClip: vi.fn(async () => 'file'),
  stopClip: vi.fn(),
  decodeContourFile: vi.fn(async () => null),
}))

vi.mock('../audio/align', async () => {
  const actual = await vi.importActual<typeof import('../audio/align')>('../audio/align')
  return {
    ...actual,
    loadAlignment: vi.fn(async () => [{ start: 0.2, end: 0.5 }]),
  }
})

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
  vi.mocked(loadAlignment).mockClear()
})

afterEach(() => {
  cleanup()
})

describe('phrase alignment', () => {
  it('loads the timings of the file that is playing', async () => {
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
    expect((await screen.findByTestId('speed-now')).textContent).toBe('Tempo 70 %')
    await waitFor(() => {
      const file = vi.mocked(loadAlignment).mock.calls.at(-1)?.[0]
      expect(file).toMatch(/\.r70\.m4a$/)
    })
    fireEvent.click(screen.getByRole('button', { name: '100 %' }))
    await waitFor(() => {
      const file = vi.mocked(loadAlignment).mock.calls.at(-1)?.[0]
      expect(file).toMatch(/\.m4a$/)
      expect(file).not.toMatch(/\.r(?:70|85)\.m4a$/)
    })
  })

  it('keeps the timings of the file that already started', async () => {
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
    expect((await screen.findByTestId('speed-now')).textContent).toBe('Tempo 70 %')
    await waitFor(() => {
      expect(String(vi.mocked(loadAlignment).mock.calls.at(-1)?.[0])).toMatch(/\.r70\.m4a$/)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Anhören' }))
    expect(await screen.findByRole('button', { name: 'Läuft' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '100 %' }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '100 %' }).getAttribute('aria-pressed')).toBe('true')
    })
    expect(vi.mocked(loadAlignment).mock.calls.every(([file]) => String(file).endsWith('.r70.m4a'))).toBe(true)
  })
})
