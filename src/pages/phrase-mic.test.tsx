// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { useEffect, type ReactNode } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
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
})
