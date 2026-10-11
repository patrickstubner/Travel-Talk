// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { useEffect, type ReactNode } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProvider, useApp } from '../app/state'
import { PhrasePage } from './Phrase'

class FakeRecorder extends EventTarget {
  state = 'inactive'
  mimeType = 'audio/webm'
  stream: { getTracks: () => Array<{ stop: () => void }> }

  constructor(stream: { getTracks: () => Array<{ stop: () => void }> }) {
    super()
    this.stream = stream
  }

  start(): void {
    this.state = 'recording'
  }

  stop(): void {
    this.state = 'inactive'
    this.dispatchEvent(new Event('stop'))
  }
}

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
  globalThis.indexedDB = new IDBFactory()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('phrase microphone', () => {
  it('stops the track when the page goes away during a recording', async () => {
    const track = { stop: vi.fn() }
    const stream = { getTracks: () => [track] }
    vi.stubGlobal('MediaRecorder', FakeRecorder)
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn(async () => stream) },
    })
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
    fireEvent.click(await screen.findByRole('button', { name: 'Aufnehmen' }))
    await screen.findByRole('button', { name: 'Stopp' })
    cleanup()
    expect(track.stop).toHaveBeenCalled()
  })

  it('stops the track when the tab is hidden or the page hides', async () => {
    const track = { stop: vi.fn() }
    const stream = { getTracks: () => [track] }
    vi.stubGlobal('MediaRecorder', FakeRecorder)
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn(async () => stream) },
    })
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
    fireEvent.click(await screen.findByRole('button', { name: 'Aufnehmen' }))
    await screen.findByRole('button', { name: 'Stopp' })
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
    document.dispatchEvent(new Event('visibilitychange'))
    await waitFor(() => expect(track.stop).toHaveBeenCalled())
    await screen.findByRole('button', { name: 'Aufnehmen' })
    track.stop.mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'Aufnehmen' }))
    await screen.findByRole('button', { name: 'Stopp' })
    window.dispatchEvent(new Event('pagehide'))
    await waitFor(() => expect(track.stop).toHaveBeenCalled())
  })

  it('releases a microphone that starts after the next phrase', async () => {
    const track = { stop: vi.fn() }
    const stream = { getTracks: () => [track] }
    let resolveStream: (value: typeof stream) => void = () => undefined
    const pending = new Promise<typeof stream>((resolve) => {
      resolveStream = resolve
    })
    vi.stubGlobal('MediaRecorder', FakeRecorder)
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn(() => pending) },
    })
    render(
      <AppProvider>
        <ReadyPhrase>
          <MemoryRouter initialEntries={['/phrase/emergency.help']}>
            <NextPhrase />
            <Routes>
              <Route path="/phrase/:conceptId" element={<PhrasePage />} />
            </Routes>
          </MemoryRouter>
        </ReadyPhrase>
      </AppProvider>,
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Aufnehmen' }))
    expect(track.stop).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Nächster Satz' }))
    expect(await screen.findByRole('heading', { name: 'Chào anh.' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Situation' })).toBeNull()
    expect(track.stop).not.toHaveBeenCalled()
    resolveStream(stream)
    await waitFor(() => expect(track.stop).toHaveBeenCalled())
  })

  it('drops a recording whose stop arrives after the phrase changed', async () => {
    const track = { stop: vi.fn() }
    const stream = { getTracks: () => [track] }
    const revoked: string[] = []
    let rejectDecode: (error: Error) => void = () => undefined
    let decoding = false
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mine')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation((url) => {
      revoked.push(String(url))
    })
    vi.stubGlobal(
      'AudioContext',
      class {
        decodeAudioData(): Promise<AudioBuffer> {
          decoding = true
          return new Promise((_resolve, reject) => {
            rejectDecode = reject
          })
        }
        close(): Promise<void> {
          return Promise.resolve()
        }
      },
    )
    vi.stubGlobal('MediaRecorder', FakeRecorder)
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn(async () => stream) },
    })
    render(
      <AppProvider>
        <ReadyPhrase>
          <MemoryRouter initialEntries={['/phrase/emergency.help']}>
            <NextPhrase />
            <Routes>
              <Route path="/phrase/:conceptId" element={<PhrasePage />} />
            </Routes>
          </MemoryRouter>
        </ReadyPhrase>
      </AppProvider>,
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Aufnehmen' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Stopp' }))
    await waitFor(() => expect(decoding).toBe(true))
    fireEvent.click(screen.getByRole('button', { name: 'Nächster Satz' }))
    expect(await screen.findByRole('heading', { name: 'Chào anh.' })).toBeTruthy()
    rejectDecode(new Error('stale'))
    await waitFor(() => expect(revoked).toContain('blob:mine'))
    expect(screen.queryByRole('button', { name: 'Meine Aufnahme' })).toBeNull()
  })
})

function NextPhrase() {
  const navigate = useNavigate()
  return (
    <button type="button" onClick={() => navigate('/phrase/meet.hello')}>
      Nächster Satz
    </button>
  )
}
