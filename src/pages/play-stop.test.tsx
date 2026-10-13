// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import { freshIndexedDb } from '../test-idb'
import { useEffect, type ReactNode } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { playClip } from '../audio/player'
import { AppProvider, useApp } from '../app/state'
import { seedPassedWords } from '../test-words'
import { PracticePage } from './Practice'
import { ShowPage } from './Show'

vi.mock('../audio/player', () => ({
  playClip: vi.fn(async () => 'file'),
  stopClip: vi.fn(),
  decodeContourFile: vi.fn(async () => null),
  loadManifest: vi.fn(async () => new Set()),
  clearManifestCache: vi.fn(),
}))

vi.mock('../audio/align', async () => {
  const actual = await vi.importActual<typeof import('../audio/align')>('../audio/align')
  return { ...actual, loadAlignment: vi.fn(async () => [{ start: 0.2, end: 0.5 }]) }
})

function Ready({ children }: { children: ReactNode }) {
  const { snapshot, saveSettings } = useApp()
  useEffect(() => {
    if (snapshot && (snapshot.settings.appLang !== 'de' || snapshot.settings.targetLang !== 'vi')) {
      void saveSettings({ ...snapshot.settings, appLang: 'de', targetLang: 'vi' })
    }
  }, [snapshot, saveSettings])
  if (snapshot?.settings.appLang !== 'de' || snapshot?.settings.targetLang !== 'vi') return null
  return children
}

beforeEach(async () => {
  freshIndexedDb()
  await seedPassedWords()
  vi.mocked(playClip).mockImplementation(async (_file, _speech, _lang, _rate, _onEnd, _onTime, _onDuration, onStop) => {
    onStop?.()
    return 'file'
  })
})

afterEach(() => {
  cleanup()
})

describe('stop signal on sentence playback', () => {
  it('returns the practice button when playback stops', async () => {
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
    await waitFor(() => expect(vi.mocked(playClip).mock.calls.length).toBeGreaterThan(0))
    expect(vi.mocked(playClip).mock.calls.every((call) => typeof call[7] === 'function')).toBe(true)
    expect(screen.queryByRole('button', { name: 'Läuft' })).toBeNull()
    const idle = screen.getByRole('button', { name: 'Anhören' })
    expect(idle.getAttribute('aria-pressed')).not.toBe('true')
  })

  it('returns Anhören in show mode when playback stops', async () => {
    render(
      <AppProvider>
        <Ready>
          <MemoryRouter initialEntries={['/show/emergency.help']}>
            <Routes>
              <Route path="/show/:conceptId" element={<ShowPage />} />
            </Routes>
          </MemoryRouter>
        </Ready>
      </AppProvider>,
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Anhören' }))
    const button = await screen.findByRole('button', { name: 'Anhören' })
    expect(button.getAttribute('aria-pressed')).not.toBe('true')
    expect(typeof vi.mocked(playClip).mock.calls.at(-1)?.[7]).toBe('function')
  })
})
