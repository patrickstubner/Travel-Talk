// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import { freshIndexedDb } from '../test-idb'
import { useEffect, type ReactNode } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadAlignment } from '../audio/align'
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
  return (
    <>
      <button type="button" onClick={() => void saveSettings({ ...snapshot.settings, speed: 1 })}>
        Tempo 100
      </button>
      {children}
    </>
  )
}

beforeEach(async () => {
  freshIndexedDb()
  await seedPassedWords()
  vi.mocked(loadAlignment).mockClear()
})

afterEach(() => {
  cleanup()
})

describe('remembered file', () => {
  it('keeps the show timings of the file that already started', async () => {
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
    expect(await screen.findByText('Tempo 70 %')).toBeTruthy()
    await waitFor(() => expect(String(vi.mocked(loadAlignment).mock.calls.at(-1)?.[0])).toMatch(/\.r70\.m4a$/))
    fireEvent.click(screen.getByRole('button', { name: 'Anhören' }))
    expect(await screen.findByRole('button', { name: 'Läuft' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Tempo 100' }))
    expect(await screen.findByText('Tempo 100 %')).toBeTruthy()
    expect(vi.mocked(loadAlignment).mock.calls.every(([file]) => String(file).endsWith('.r70.m4a'))).toBe(true)
  })

  it('keeps the practice timings of the file that already started', async () => {
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
    expect(await screen.findByRole('button', { name: 'Läuft langsam.' })).toBeTruthy()
    await waitFor(() => expect(String(vi.mocked(loadAlignment).mock.calls.at(-1)?.[0])).toMatch(/\.r70\.m4a$/))
    fireEvent.click(screen.getByRole('button', { name: 'Tempo 100' }))
    await waitFor(() => expect(vi.mocked(loadAlignment).mock.calls.length).toBeGreaterThan(0))
    expect(vi.mocked(loadAlignment).mock.calls.every(([file]) => String(file).endsWith('.r70.m4a'))).toBe(true)
  })
})

describe('N15c-01', () => {
  it('keeps the written slot next to the spoken line in show mode', async () => {
    render(
      <AppProvider>
        <Ready>
          <MemoryRouter initialEntries={['/show/meet.name']}>
            <Routes>
              <Route path="/show/:conceptId" element={<ShowPage />} />
            </Routes>
          </MemoryRouter>
        </Ready>
      </AppProvider>,
    )
    expect((await screen.findByTestId('placeholder-line')).textContent).toContain('[tên]')
    expect(screen.getByTestId('karaoke')).toBeTruthy()
  })

  it('keeps the spoken line next to the words once the keywords are known', async () => {
    render(
      <AppProvider>
        <Ready>
          <MemoryRouter initialEntries={['/practice?kind=new']}>
            <Routes>
              <Route path="/practice" element={<PracticePage />} />
            </Routes>
          </MemoryRouter>
        </Ready>
      </AppProvider>,
    )
    expect(await screen.findByTestId('karaoke')).toBeTruthy()
    expect(screen.queryByTestId('practice-word')).toBeNull()
  })
})
