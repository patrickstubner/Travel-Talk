// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import { freshIndexedDb } from '../test-idb'
import { useEffect, type ReactNode } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProvider, useApp } from '../app/state'
import { startMicrophone, type CaptureSession } from '../audio/recorder'
import { PracticePage } from './Practice'

vi.mock('../audio/player', () => ({
  playClip: vi.fn(async () => 'file'),
}))

vi.mock('../audio/recorder', () => ({
  startMicrophone: vi.fn(),
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

function deferredMic(): { promise: Promise<CaptureSession | null>; resolve: (session: CaptureSession | null) => void } {
  let resolve: (session: CaptureSession | null) => void = () => undefined
  const promise = new Promise<CaptureSession | null>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

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

async function openRepeat(): Promise<void> {
  renderPractice()
  fireEvent.click(await screen.findByRole('button', { name: 'Jetzt in normalem Tempo' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Weiter' }))
  await screen.findByRole('button', { name: 'Aufnehmen' })
}

beforeEach(() => {
  freshIndexedDb()
  vi.mocked(startMicrophone).mockReset()
})

afterEach(() => {
  cleanup()
})

describe('practice microphone', () => {
  it('blocks Weiter while the microphone is starting, and releases the track on Weiter', async () => {
    const pending = deferredMic()
    vi.mocked(startMicrophone).mockImplementation(() => pending.promise)
    const release = vi.fn()
    await openRepeat()
    fireEvent.click(screen.getByRole('button', { name: 'Aufnehmen' }))
    expect((screen.getByRole('button', { name: 'Weiter' }) as HTMLButtonElement).disabled).toBe(true)
    pending.resolve({
      recorder: { stop: vi.fn(), state: 'recording', stream: { getTracks: () => [] } } as unknown as CaptureSession['recorder'],
      release,
    })
    await screen.findByRole('button', { name: 'Stopp' })
    expect(screen.getByRole('heading', { name: 'Nachsprechen · 1 von 4' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }))
    expect(release).toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'Der Satz bleibt sichtbar' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Stopp' })).toBeNull()
  })

  it('releases a microphone that resolves after the tab was already hidden', async () => {
    const pending = deferredMic()
    vi.mocked(startMicrophone).mockImplementation(() => pending.promise)
    const release = vi.fn()
    await openRepeat()
    fireEvent.click(screen.getByRole('button', { name: 'Aufnehmen' }))
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
    document.dispatchEvent(new Event('visibilitychange'))
    pending.resolve({
      recorder: { stop: vi.fn(), state: 'recording', stream: { getTracks: () => [] } } as unknown as CaptureSession['recorder'],
      release,
    })
    await waitFor(() => expect(release).toHaveBeenCalled())
    expect(screen.queryByRole('button', { name: 'Stopp' })).toBeNull()
    expect(screen.getByRole('heading', { name: 'Nachsprechen · 1 von 4' })).toBeTruthy()
  })

  it('releases a mic that starts after the exercise is left', async () => {
    const pending = deferredMic()
    vi.mocked(startMicrophone).mockImplementation(() => pending.promise)
    const release = vi.fn()
    await openRepeat()
    fireEvent.click(screen.getByRole('button', { name: 'Aufnehmen' }))
    cleanup()
    pending.resolve({
      recorder: { stop: vi.fn(), state: 'recording', stream: { getTracks: () => [] } } as unknown as CaptureSession['recorder'],
      release,
    })
    await waitFor(() => expect(release).toHaveBeenCalled())
  })

  it('stops the recording when the tab is hidden or the page is left', async () => {
    const release = vi.fn()
    vi.mocked(startMicrophone).mockResolvedValue({
      recorder: { stop: vi.fn(), state: 'recording', stream: { getTracks: () => [] } } as unknown as CaptureSession['recorder'],
      release,
    })
    await openRepeat()
    fireEvent.click(screen.getByRole('button', { name: 'Aufnehmen' }))
    await screen.findByRole('button', { name: 'Stopp' })
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
    document.dispatchEvent(new Event('visibilitychange'))
    await waitFor(() => expect(release).toHaveBeenCalled())
    release.mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'Aufnehmen' }))
    await screen.findByRole('button', { name: 'Stopp' })
    window.dispatchEvent(new Event('pagehide'))
    await waitFor(() => expect(release).toHaveBeenCalled())
  })
})
