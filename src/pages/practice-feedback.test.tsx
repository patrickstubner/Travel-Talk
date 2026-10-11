// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import { freshIndexedDb } from '../test-idb'
import { useEffect, type ReactNode } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProvider, useApp } from '../app/state'
import { startMicrophone, type CaptureSession } from '../audio/recorder'
import { reviewCard } from '../srs/scheduler'
import { PracticePage } from './Practice'

vi.mock('../audio/player', () => ({
  playClip: vi.fn(async () => 'file'),
  decodeContourFile: vi.fn(async () => null),
}))

vi.mock('../audio/recorder', () => ({
  startMicrophone: vi.fn(),
}))

vi.mock('../srs/scheduler', async () => {
  const actual = await vi.importActual<typeof import('../srs/scheduler')>('../srs/scheduler')
  return { ...actual, reviewCard: vi.fn(actual.reviewCard) }
})

function ReadyPractice({ voice, children }: { voice?: string; children: ReactNode }) {
  const { snapshot, saveSettings } = useApp()
  useEffect(() => {
    if (!snapshot) return
    const ready =
      snapshot.settings.appLang === 'de' &&
      snapshot.settings.targetLang === 'vi' &&
      (voice == null || snapshot.settings.voices?.vi === voice)
    if (!ready) {
      void saveSettings({
        ...snapshot.settings,
        appLang: 'de',
        targetLang: 'vi',
        speed: 'auto',
        ...(voice ? { voices: { ...snapshot.settings.voices, vi: voice } } : {}),
      })
    }
  }, [snapshot, saveSettings, voice])
  if (snapshot?.settings.appLang !== 'de' || snapshot.settings.targetLang !== 'vi') return null
  if (voice != null && snapshot.settings.voices?.vi !== voice) return null
  return children
}

function sine(seconds: number): Float32Array {
  const sampleRate = 16000
  const samples = new Float32Array(Math.floor(sampleRate * seconds))
  let phase = 0
  for (let index = 0; index < samples.length; index += 1) {
    phase += (2 * Math.PI * 220) / sampleRate
    samples[index] = Math.sin(phase) * 0.8
  }
  return samples
}

beforeEach(() => {
  freshIndexedDb()
  vi.mocked(startMicrophone).mockReset()
  vi.mocked(reviewCard).mockClear()
})

afterEach(() => {
  cleanup()
})

async function openRepeat(voice?: string): Promise<void> {
  render(
    <AppProvider>
      <ReadyPractice voice={voice}>
        <MemoryRouter initialEntries={['/practice']}>
          <Routes>
            <Route path="/practice" element={<PracticePage />} />
          </Routes>
        </MemoryRouter>
      </ReadyPractice>
    </AppProvider>,
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Jetzt in normalem Tempo' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Weiter' }))
  await screen.findByRole('button', { name: 'Aufnehmen' })
}

describe('practice repeat feedback', () => {
  it('keeps the take, shows the result, and does not grade the card', async () => {
    const release = vi.fn()
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const samples = sine(1)
    vi.mocked(startMicrophone).mockImplementation(async (onStop) => {
      const session = {
        recorder: {
          stop: () => onStop({ url: 'blob:repeat-take', samples, sampleRate: 16000 }),
          state: 'recording',
          stream: { getTracks: () => [] },
        },
        release,
      }
      return session as unknown as CaptureSession
    })
    await openRepeat()
    fireEvent.click(screen.getByRole('button', { name: 'Aufnehmen' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Stopp' }))
    const view = await screen.findByTestId('repeat-feedback')
    expect(view.hidden).toBe(false)
    expect(screen.getByRole('button', { name: 'Nochmal' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Schwer' })).toBeNull()
    expect(vi.mocked(reviewCard)).not.toHaveBeenCalled()
    expect(screen.queryByText('Nördliche Stimme. Ein Hinweis, keine Note.')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }))
    expect(release).toHaveBeenCalled()
    expect(revoke).toHaveBeenCalledWith('blob:repeat-take')
    expect(screen.queryByTestId('repeat-feedback')).toBeNull()
    expect(screen.getByRole('heading', { name: 'Der Satz bleibt sichtbar' })).toBeTruthy()
    revoke.mockRestore()
  })

  it('shows the microphone note and still lets you continue', async () => {
    vi.mocked(startMicrophone).mockResolvedValue(null)
    await openRepeat()
    fireEvent.click(screen.getByRole('button', { name: 'Aufnehmen' }))
    expect(await screen.findByText('Ohne Mikrofon wird nichts aufgenommen. Du kannst weiter.')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Weiter' }) as HTMLButtonElement).disabled).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }))
    expect(screen.getByRole('heading', { name: 'Der Satz bleibt sichtbar' })).toBeTruthy()
  })

  it('shows the northern hint only for the selected voice vais1000', async () => {
    const samples = sine(1)
    vi.mocked(startMicrophone).mockImplementation(async (onStop) => {
      const session = {
        recorder: {
          stop: () => onStop({ url: 'blob:repeat-north', samples, sampleRate: 16000 }),
          state: 'recording',
          stream: { getTracks: () => [] },
        },
        release: vi.fn(),
      }
      return session as unknown as CaptureSession
    })
    await openRepeat('vais1000')
    fireEvent.click(screen.getByRole('button', { name: 'Aufnehmen' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Stopp' }))
    await screen.findByTestId('repeat-feedback')
    expect(screen.getByText('Nördliche Stimme. Ein Hinweis, keine Note.')).toBeTruthy()
  })

  it('hides the northern hint when the selected voice is vivos-22', async () => {
    const samples = sine(1)
    vi.mocked(startMicrophone).mockImplementation(async (onStop) => {
      const session = {
        recorder: {
          stop: () => onStop({ url: 'blob:repeat-south', samples, sampleRate: 16000 }),
          state: 'recording',
          stream: { getTracks: () => [] },
        },
        release: vi.fn(),
      }
      return session as unknown as CaptureSession
    })
    await openRepeat('vivos-22')
    fireEvent.click(screen.getByRole('button', { name: 'Aufnehmen' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Stopp' }))
    await screen.findByTestId('repeat-feedback')
    expect(screen.queryByText('Nördliche Stimme. Ein Hinweis, keine Note.')).toBeNull()
  })
})
