// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import { freshIndexedDb } from '../test-idb'
import { useEffect, type ReactNode } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProvider, useApp } from '../app/state'
import { splitWords } from '../../content/gloss'
import { loadAlignment } from '../audio/align'
import { decodeContourFile, stopClip } from '../audio/player'
import { startMicrophone, type CaptureSession } from '../audio/recorder'
import * as slice from '../audio/slice'
import { PhrasePage } from './Phrase'

vi.mock('../audio/player', () => ({
  playClip: vi.fn(async () => 'file'),
  stopClip: vi.fn(),
  decodeContourFile: vi.fn(async () => null),
}))

vi.mock('../audio/align', async () => {
  const actual = await vi.importActual<typeof import('../audio/align')>('../audio/align')
  return { ...actual, loadAlignment: vi.fn(async () => null) }
})

vi.mock('../audio/recorder', () => ({
  startMicrophone: vi.fn(),
}))

function ReadyPhrase({ lang, children }: { lang: 'en' | 'pt-BR' | 'de'; children: ReactNode }) {
  const { snapshot, saveSettings } = useApp()
  const app = lang === 'de' ? 'en' : 'de'
  useEffect(() => {
    if (snapshot && (snapshot.settings.appLang !== app || snapshot.settings.targetLang !== lang)) {
      void saveSettings({ ...snapshot.settings, appLang: app, targetLang: lang, speed: 'auto' })
    }
  }, [app, lang, snapshot, saveSettings])
  if (snapshot?.settings.appLang !== app || snapshot?.settings.targetLang !== lang) return null
  return children
}

function sine(): Float32Array {
  const samples = new Float32Array(16000)
  let phase = 0
  for (let index = 0; index < samples.length; index += 1) {
    phase += (2 * Math.PI * 180) / 16000
    samples[index] = Math.sin(phase) * 0.5
  }
  return samples
}

beforeEach(() => {
  freshIndexedDb()
  vi.mocked(startMicrophone).mockReset()
  vi.mocked(decodeContourFile).mockReset()
  vi.mocked(decodeContourFile).mockResolvedValue(null)
  vi.mocked(loadAlignment).mockReset()
  vi.mocked(loadAlignment).mockResolvedValue(null)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

async function record(lang: 'en' | 'pt-BR' | 'de'): Promise<void> {
  const samples = sine()
  vi.mocked(startMicrophone).mockImplementation(async (onStop) => {
    const session = {
      recorder: {
        stop: () => onStop({ url: 'blob:phrase-take', samples, sampleRate: 16000 }),
        state: 'recording',
        stream: { getTracks: () => [] },
      },
      release: vi.fn(),
    }
    return session as unknown as CaptureSession
  })
  render(
    <AppProvider>
      <ReadyPhrase lang={lang}>
        <MemoryRouter initialEntries={['/phrase/emergency.doctor']}>
          <Routes>
            <Route path="/phrase/:conceptId" element={<PhrasePage />} />
          </Routes>
        </MemoryRouter>
      </ReadyPhrase>
    </AppProvider>,
  )
  const recordName = lang === 'de' ? 'Record' : 'Aufnehmen'
  const stopName = lang === 'de' ? 'Stop' : 'Stopp'
  fireEvent.click(await screen.findByRole('button', { name: recordName }))
  fireEvent.click(await screen.findByRole('button', { name: stopName }))
}

function glide(seconds: number): Float32Array {
  const sampleRate = 16000
  const length = Math.floor(sampleRate * seconds)
  const samples = new Float32Array(length)
  let phase = 0
  for (let index = 0; index < length; index += 1) {
    const hz = 140 + 140 * (index / length)
    phase += (2 * Math.PI * hz) / sampleRate
    samples[index] = Math.sin(phase) * 0.8
  }
  return samples
}

describe('phrase repeat feedback', () => {
  it('keeps colours and both bars across three takes of Nochmal', async () => {
    const samples = glide(1.2)
    vi.mocked(decodeContourFile).mockResolvedValue({ samples, sampleRate: 16000 })
    vi.mocked(loadAlignment).mockImplementation(async (_file, speech) => {
      const count = Math.max(1, splitWords(speech).length)
      const width = 1.05 / count
      return Array.from({ length: count }, (_, index) => ({ start: 0.05 + index * width, end: 0.05 + (index + 1) * width - 0.02 }))
    })
    vi.mocked(startMicrophone).mockImplementation(async (onStop) => {
      const session = {
        recorder: {
          stop: () => onStop({ url: 'blob:phrase-again', samples, sampleRate: 16000 }),
          state: 'recording',
          stream: { getTracks: () => [] },
        },
        release: vi.fn(),
      }
      return session as unknown as CaptureSession
    })
    render(
      <AppProvider>
        <ReadyPhrase lang="en">
          <MemoryRouter initialEntries={['/phrase/emergency.doctor']}>
            <Routes>
              <Route path="/phrase/:conceptId" element={<PhrasePage />} />
            </Routes>
          </MemoryRouter>
        </ReadyPhrase>
      </AppProvider>,
    )
    for (let take = 0; take < 3; take += 1) {
      fireEvent.click(await screen.findByRole('button', { name: take === 0 ? 'Aufnehmen' : 'Nochmal' }))
      fireEvent.click(await screen.findByRole('button', { name: 'Stopp' }))
      const melody = await screen.findByTestId('melody-bar')
      expect(melody.getAttribute('data-state')).toBeTruthy()
      expect(screen.getByTestId('rhythm-bar').getAttribute('data-state')).toBeTruthy()
      expect(document.querySelector('.word-chip[data-color="green"], .word-chip[data-color="yellow"], .word-chip[data-color="red"]')).toBeTruthy()
    }
  })

  it('shows the result for English, Portuguese and German', async () => {
    await record('en')
    const english = await screen.findByTestId('repeat-feedback')
    expect(english.hidden).toBe(false)
    expect(screen.queryByText('Nördliche Stimme. Ein Hinweis, keine Note.')).toBeNull()
    cleanup()
    await record('pt-BR')
    expect((await screen.findByTestId('repeat-feedback')).hidden).toBe(false)
    cleanup()
    await record('de')
    expect((await screen.findByTestId('repeat-feedback')).hidden).toBe(false)
    expect(screen.queryByText('Northern voice. A hint, not a grade.')).toBeNull()
    expect(screen.queryByText('Tap the tone hint if you want to see the six forms.')).toBeNull()
  })

  it('passes the selected Vietnamese voice to the result', async () => {
    async function take(voice: string): Promise<void> {
      const samples = sine()
      vi.mocked(startMicrophone).mockImplementation(async (onStop) => {
        const session = {
          recorder: {
            stop: () => onStop({ url: 'blob:phrase-take', samples, sampleRate: 16000 }),
            state: 'recording',
            stream: { getTracks: () => [] },
          },
          release: vi.fn(),
        }
        return session as unknown as CaptureSession
      })
      function ReadyVoice({ children }: { children: ReactNode }) {
        const { snapshot, saveSettings } = useApp()
        useEffect(() => {
          if (!snapshot) return
          if (snapshot.settings.appLang === 'de' && snapshot.settings.targetLang === 'vi' && snapshot.settings.voices?.vi === voice) return
          void saveSettings({
            ...snapshot.settings,
            appLang: 'de',
            targetLang: 'vi',
            speed: 'auto',
            voices: { ...snapshot.settings.voices, vi: voice },
          })
        }, [snapshot, saveSettings])
        if (snapshot?.settings.appLang !== 'de' || snapshot.settings.targetLang !== 'vi' || snapshot.settings.voices?.vi !== voice) return null
        return children
      }
      render(
        <AppProvider>
          <ReadyVoice>
            <MemoryRouter initialEntries={['/phrase/emergency.doctor']}>
              <Routes>
                <Route path="/phrase/:conceptId" element={<PhrasePage />} />
              </Routes>
            </MemoryRouter>
          </ReadyVoice>
        </AppProvider>,
      )
      fireEvent.click(await screen.findByRole('button', { name: 'Aufnehmen' }))
      fireEvent.click(await screen.findByRole('button', { name: 'Stopp' }))
      await screen.findByTestId('repeat-feedback')
    }
    await take('vivos-22')
    expect(screen.queryByText('Nördliche Stimme. Ein Hinweis, keine Note.')).toBeNull()
    cleanup()
    await take('vais1000')
    expect(screen.getByText('Nördliche Stimme. Ein Hinweis, keine Note.')).toBeTruthy()
  })

  it('drops the previous recording when the phrase changes', async () => {
    function Jump(): ReactNode {
      const navigate = useNavigate()
      return (
        <button type="button" onClick={() => navigate('/phrase/emergency.help')}>
          Andere Phrase
        </button>
      )
    }
    const samples = sine()
    vi.mocked(startMicrophone).mockImplementation(async (onStop) => {
      const session = {
        recorder: {
          stop: () => onStop({ url: 'blob:phrase-take', samples, sampleRate: 16000 }),
          state: 'recording',
          stream: { getTracks: () => [] },
        },
        release: vi.fn(),
      }
      return session as unknown as CaptureSession
    })
    render(
      <AppProvider>
        <ReadyPhrase lang="en">
          <MemoryRouter initialEntries={['/phrase/emergency.doctor']}>
            <Routes>
              <Route
                path="/phrase/:conceptId"
                element={
                  <>
                    <PhrasePage />
                    <Jump />
                  </>
                }
              />
            </Routes>
          </MemoryRouter>
        </ReadyPhrase>
      </AppProvider>,
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Aufnehmen' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Stopp' }))
    expect(await screen.findByTestId('repeat-feedback')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Andere Phrase' }))
    expect(await screen.findByRole('heading', { level: 1 })).toBeTruthy()
    expect(screen.queryByTestId('repeat-feedback')).toBeNull()
  })

  it('shows a note when the microphone is refused and leaves the sentence up', async () => {
    vi.mocked(startMicrophone).mockResolvedValue(null)
    render(
      <AppProvider>
        <ReadyPhrase lang="en">
          <MemoryRouter initialEntries={['/phrase/emergency.doctor']}>
            <Routes>
              <Route path="/phrase/:conceptId" element={<PhrasePage />} />
            </Routes>
          </MemoryRouter>
        </ReadyPhrase>
      </AppProvider>,
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Aufnehmen' }))
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Das Mikrofon ist nicht verfügbar. Es wurde nichts aufgenommen.')
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy()
  })

  it('stops the model and disables listen and my recording while the microphone is open', async () => {
    const samples = sine()
    vi.mocked(startMicrophone).mockImplementation(async (onStop) => {
      const session = {
        recorder: {
          stop: () => onStop({ url: 'blob:phrase-take', samples, sampleRate: 16000 }),
          state: 'recording',
          stream: { getTracks: () => [] },
        },
        release: vi.fn(),
      }
      return session as unknown as CaptureSession
    })
    render(
      <AppProvider>
        <ReadyPhrase lang="en">
          <MemoryRouter initialEntries={['/phrase/emergency.doctor']}>
            <Routes>
              <Route path="/phrase/:conceptId" element={<PhrasePage />} />
            </Routes>
          </MemoryRouter>
        </ReadyPhrase>
      </AppProvider>,
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Aufnehmen' }))
    expect(vi.mocked(stopClip)).toHaveBeenCalled()
    await waitFor(() => expect((screen.getByRole('button', { name: 'Anhören' }) as HTMLButtonElement).disabled).toBe(true))
    fireEvent.click(await screen.findByRole('button', { name: 'Stopp' }))
    expect((await screen.findByRole('button', { name: 'Meine Aufnahme' }) as HTMLButtonElement).disabled).toBe(false)
    vi.mocked(stopClip).mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'Nochmal' }))
    expect(vi.mocked(stopClip)).toHaveBeenCalled()
    await waitFor(() => {
      expect((screen.getByRole('button', { name: 'Anhören' }) as HTMLButtonElement).disabled).toBe(true)
      expect((screen.getByRole('button', { name: 'Meine Aufnahme' }) as HTMLButtonElement).disabled).toBe(true)
    })
  })

  it('hides the feedback and stops a playing word when recording starts again', async () => {
    const samples = sine()
    vi.mocked(startMicrophone).mockImplementation(async (onStop) => {
      const session = {
        recorder: {
          stop: () => onStop({ url: 'blob:phrase-take', samples, sampleRate: 16000 }),
          state: 'recording',
          stream: { getTracks: () => [] },
        },
        release: vi.fn(),
      }
      return session as unknown as CaptureSession
    })
    render(
      <AppProvider>
        <ReadyPhrase lang="en">
          <MemoryRouter initialEntries={['/phrase/emergency.doctor']}>
            <Routes>
              <Route path="/phrase/:conceptId" element={<PhrasePage />} />
            </Routes>
          </MemoryRouter>
        </ReadyPhrase>
      </AppProvider>,
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Aufnehmen' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Stopp' }))
    expect(await screen.findByTestId('repeat-feedback')).toBeTruthy()
    const stopWords = vi.spyOn(slice, 'stopSlices').mockImplementation(() => undefined)
    let releaseMic: (session: CaptureSession) => void = () => undefined
    vi.mocked(startMicrophone).mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseMic = resolve
        }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Nochmal' }))
    expect(stopWords).toHaveBeenCalled()
    await waitFor(() => expect(screen.queryByTestId('repeat-feedback')).toBeNull())
    releaseMic({
      recorder: { stop: vi.fn(), state: 'recording', stream: { getTracks: () => [] } },
      release: vi.fn(),
    } as unknown as CaptureSession)
    expect(await screen.findByRole('button', { name: 'Stopp' })).toBeTruthy()
    expect(screen.queryByTestId('repeat-feedback')).toBeNull()
    stopWords.mockRestore()
  })

  it('disables listen while the microphone is still starting', async () => {
    let releaseMic: (session: CaptureSession | null) => void = () => undefined
    vi.mocked(startMicrophone).mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseMic = resolve
        }),
    )
    render(
      <AppProvider>
        <ReadyPhrase lang="en">
          <MemoryRouter initialEntries={['/phrase/emergency.doctor']}>
            <Routes>
              <Route path="/phrase/:conceptId" element={<PhrasePage />} />
            </Routes>
          </MemoryRouter>
        </ReadyPhrase>
      </AppProvider>,
    )
    expect((await screen.findByRole('button', { name: 'Anhören' }) as HTMLButtonElement).disabled).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Aufnehmen' }))
    await waitFor(() => expect((screen.getByRole('button', { name: 'Anhören' }) as HTMLButtonElement).disabled).toBe(true))
    expect(screen.queryByRole('button', { name: 'Stopp' })).toBeNull()
    releaseMic({
      recorder: { stop: vi.fn(), state: 'recording', stream: { getTracks: () => [] } },
      release: vi.fn(),
    } as unknown as CaptureSession)
    expect(await screen.findByRole('button', { name: 'Stopp' })).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Anhören' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('pauses and resets my recording when a new take starts', async () => {
    const samples = sine()
    vi.mocked(startMicrophone).mockImplementation(async (onStop) => {
      const session = {
        recorder: {
          stop: () => onStop({ url: 'blob:phrase-take', samples, sampleRate: 16000 }),
          state: 'recording',
          stream: { getTracks: () => [] },
        },
        release: vi.fn(),
      }
      return session as unknown as CaptureSession
    })
    const played: Array<{ src: string; currentTime: number; pause: ReturnType<typeof vi.fn>; play: ReturnType<typeof vi.fn> }> = []
    class MineAudio {
      currentTime = 0
      pause = vi.fn()
      play = vi.fn(async () => undefined)
      constructor(public src: string) {
        played.push(this)
      }
    }
    vi.stubGlobal('Audio', MineAudio)
    render(
      <AppProvider>
        <ReadyPhrase lang="en">
          <MemoryRouter initialEntries={['/phrase/emergency.doctor']}>
            <Routes>
              <Route path="/phrase/:conceptId" element={<PhrasePage />} />
            </Routes>
          </MemoryRouter>
        </ReadyPhrase>
      </AppProvider>,
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Aufnehmen' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Stopp' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Meine Aufnahme' }))
    expect(played).toHaveLength(1)
    expect(played[0]?.play).toHaveBeenCalled()
    const mine = played[0]
    if (!mine) throw new Error('missing playback')
    mine.currentTime = 1.4
    let releaseMic: (session: CaptureSession) => void = () => undefined
    vi.mocked(startMicrophone).mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseMic = resolve
        }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Nochmal' }))
    expect(mine.pause).toHaveBeenCalled()
    expect(mine.currentTime).toBe(0)
    expect(played).toHaveLength(1)
    releaseMic({
      recorder: { stop: vi.fn(), state: 'recording', stream: { getTracks: () => [] } },
      release: vi.fn(),
    } as unknown as CaptureSession)
    expect(await screen.findByRole('button', { name: 'Stopp' })).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Meine Aufnahme' }) as HTMLButtonElement).disabled).toBe(true)
  })
})