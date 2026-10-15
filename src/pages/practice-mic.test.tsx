// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import { freshIndexedDb } from '../test-idb'
import { useEffect, type ReactNode } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProvider, useApp } from '../app/state'
import { startMicrophone, type CaptureSession } from '../audio/recorder'
import { seedPassedWords } from '../test-words'
import { PracticePage } from './Practice'

vi.mock('../audio/player', () => ({
  playClip: vi.fn(async () => 'file'),
  stopClip: vi.fn(),
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
  fireEvent.click(await screen.findByRole('button', { name: 'Weiter' }))
  await screen.findByRole('button', { name: 'Aufnehmen' })
}

beforeEach(async () => {
  freshIndexedDb()
  await seedPassedWords()
  vi.mocked(startMicrophone).mockReset()
})

afterEach(() => {
  cleanup()
})

describe('practice microphone', () => {
  it('hides Weiter while recording and shows it again only after Stopp', async () => {
    const pending = deferredMic()
    let finish: ((recording: { url: string; samples: Float32Array | null; sampleRate: number }) => void) | undefined
    vi.mocked(startMicrophone).mockImplementation((onStop) => {
      finish = onStop
      return pending.promise
    })
    const release = vi.fn()
    const stop = vi.fn(() => finish?.({ url: '', samples: null, sampleRate: 0 }))
    await openRepeat()
    fireEvent.click(screen.getByRole('button', { name: 'Aufnehmen' }))
    const nextWhileStarting = screen.getByRole('button', { name: 'Weiter' }) as HTMLButtonElement
    expect(nextWhileStarting.disabled).toBe(true)
    pending.resolve({
      recorder: { stop, state: 'recording', stream: { getTracks: () => [] } } as unknown as CaptureSession['recorder'],
      release,
    })
    const stopButton = await screen.findByRole('button', { name: 'Stopp' })
    expect(screen.queryByRole('button', { name: 'Weiter' })).toBeNull()
    expect(screen.getByTestId('speak-actions').contains(stopButton)).toBe(true)
    expect(screen.getByRole('heading', { name: 'Nachsprechen · 1 von 4' })).toBeTruthy()
    fireEvent.click(stopButton)
    expect(stop).toHaveBeenCalled()
    const next = await screen.findByRole('button', { name: 'Weiter' })
    expect(screen.queryByRole('button', { name: 'Stopp' })).toBeNull()
    expect(screen.getByTestId('speak-actions').contains(next)).toBe(true)
    expect(screen.getByTestId('speak-actions').contains(screen.getByRole('button', { name: 'Nochmal' }))).toBe(true)
    fireEvent.click(next)
    expect(release).toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'Der Satz bleibt sichtbar' })).toBeTruthy()
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
