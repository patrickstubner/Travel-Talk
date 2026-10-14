// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import { freshIndexedDb } from '../test-idb'
import { useEffect, type ReactNode } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { playClip } from '../audio/player'
import { AppProvider, useApp } from '../app/state'
import { DexieProgressRepository } from '../storage/dexie-repository'
import { seedPassedWords } from '../test-words'
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
  if (snapshot?.settings.appLang !== 'de' || snapshot?.settings.targetLang !== 'vi' || snapshot.settings.speed !== 'auto') return null
  return children
}

beforeEach(async () => {
  freshIndexedDb()
  await seedPassedWords()
})

afterEach(() => {
  cleanup()
  vi.mocked(playClip).mockClear()
})

function renderPractice(): void {
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
}

describe('listening practice speed', () => {
  it('plays the 70 % file for a new card while automatic is on', async () => {
    renderPractice()
    expect(await screen.findByTestId('target-line')).toBeTruthy()
    await waitFor(() => expect(playClip).toHaveBeenCalled())
    expect(vi.mocked(playClip).mock.calls[0]?.[0]).toMatch(/\.r70\.m4a$/)
    expect(vi.mocked(playClip).mock.calls[0]?.[3]).toBe(0.7)
  })

  it('switches tempo both ways and keeps Weiter visible', async () => {
    renderPractice()
    const next = await screen.findByRole('button', { name: 'Weiter' })
    const slow = await screen.findByRole('radio', { name: 'Langsam' })
    const mid = screen.getByRole('radio', { name: '85 %' })
    const normal = screen.getByRole('radio', { name: 'Normal' })
    expect(screen.getByRole('radiogroup', { name: 'Tempo' })).toBeTruthy()
    expect(slow.getAttribute('aria-pressed')).toBe('true')
    expect(slow.getAttribute('aria-checked')).toBe('true')
    expect(normal.getAttribute('aria-pressed')).toBe('false')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Läuft' })).toBeTruthy())
    expect(next.isConnected).toBe(true)
    expect(vi.mocked(playClip).mock.calls.at(-1)?.[3]).toBe(0.7)

    fireEvent.click(normal)
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Normal' }).getAttribute('aria-pressed')).toBe('true'))
    expect(screen.getByRole('radio', { name: 'Langsam' }).getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByRole('button', { name: 'Weiter' })).toBeTruthy()
    await waitFor(() => expect(vi.mocked(playClip).mock.calls.at(-1)?.[3]).toBe(1))
    expect(String(vi.mocked(playClip).mock.calls.at(-1)?.[0])).not.toMatch(/\.r70\.m4a$/)
    expect(String(vi.mocked(playClip).mock.calls.at(-1)?.[0])).not.toMatch(/\.r85\.m4a$/)

    fireEvent.click(screen.getByRole('radio', { name: '85 %' }))
    await waitFor(() => expect(screen.getByRole('radio', { name: '85 %' }).getAttribute('aria-pressed')).toBe('true'))
    expect(screen.getByRole('button', { name: 'Weiter' })).toBeTruthy()
    await waitFor(() => expect(vi.mocked(playClip).mock.calls.at(-1)?.[3]).toBe(0.85))
    expect(String(vi.mocked(playClip).mock.calls.at(-1)?.[0])).toMatch(/\.r85\.m4a$/)

    fireEvent.click(screen.getByRole('radio', { name: 'Langsam' }))
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Langsam' }).getAttribute('aria-pressed')).toBe('true'))
    expect(screen.getByRole('radio', { name: 'Normal' }).getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByRole('button', { name: 'Weiter' })).toBeTruthy()
    await waitFor(() => expect(vi.mocked(playClip).mock.calls.at(-1)?.[3]).toBe(0.7))
    expect(String(vi.mocked(playClip).mock.calls.at(-1)?.[0])).toMatch(/\.r70\.m4a$/)
    fireEvent.click(screen.getByRole('button', { name: 'Läuft' }))
    await waitFor(() => expect(vi.mocked(playClip).mock.calls.filter((call) => call[3] === 0.7).length).toBeGreaterThan(1))
    expect(mid.getAttribute('aria-pressed')).toBe('false')
  })

  it('remembers the tempo for this person and still shows Weiter', async () => {
    const view = render(
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
    fireEvent.click(await screen.findByRole('radio', { name: 'Normal' }))
    await waitFor(async () => {
      const loaded = await new DexieProgressRepository('travel-talk').load()
      expect(loaded.settings.learnTempo).toBe(1)
    })
    expect(screen.getByRole('button', { name: 'Weiter' })).toBeTruthy()
    view.unmount()
    vi.mocked(playClip).mockClear()
    renderPractice()
    expect((await screen.findByRole('radio', { name: 'Normal' })).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Weiter' })).toBeTruthy()
    await waitFor(() => expect(vi.mocked(playClip).mock.calls.at(-1)?.[3]).toBe(1))
  })

  it('moves the tempo with the arrow keys', async () => {
    renderPractice()
    const group = await screen.findByRole('radiogroup', { name: 'Tempo' })
    fireEvent.keyDown(group, { key: 'ArrowRight' })
    await waitFor(() => expect(screen.getByRole('radio', { name: '85 %' }).getAttribute('aria-pressed')).toBe('true'))
    expect(screen.getByRole('button', { name: 'Weiter' })).toBeTruthy()
    fireEvent.keyDown(group, { key: 'ArrowLeft' })
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Langsam' }).getAttribute('aria-pressed')).toBe('true'))
    expect(screen.getByRole('radio', { name: '85 %' }).getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByRole('button', { name: 'Weiter' })).toBeTruthy()
  })
})
