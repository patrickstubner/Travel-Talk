// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { de } from '../i18n/dictionary'
import { playSequence, stopSlices } from '../audio/slice'
import { scoreRepeat } from '../pitch/feedback'
import { RepeatFeedback } from './RepeatFeedback'

vi.mock('../audio/slice', () => ({
  playSequence: vi.fn(async () => undefined),
  stopSlices: vi.fn(),
}))

vi.mock('../pitch/feedback', async () => {
  const actual = await vi.importActual<typeof import('../pitch/feedback')>('../pitch/feedback')
  return {
    ...actual,
    scoreRepeat: vi.fn((input: Parameters<typeof actual.scoreRepeat>[0]) => actual.scoreRepeat(input)),
  }
})

function tone(startHz: number, endHz: number, seconds: number): Float32Array {
  const sampleRate = 16000
  const length = Math.floor(sampleRate * seconds)
  const samples = new Float32Array(length)
  let phase = 0
  for (let index = 0; index < length; index += 1) {
    const hz = startHz + (endHz - startHz) * (index / length)
    phase += (2 * Math.PI * hz) / sampleRate
    samples[index] = Math.sin(phase) * 0.8
  }
  return samples
}

const words = [
  { start: 0.15, end: 0.45 },
  { start: 0.5, end: 0.8 },
  { start: 0.85, end: 1.15 },
]

function renderFeedback(
  lang: 'de' | 'en' | 'vi' = 'vi',
  samples = tone(140, 280, 1.2),
  timed: typeof words | null = words,
  voiceId = 'vais1000',
  timingsPending = false,
): void {
  render(
    <RepeatFeedback
      copy={de}
      lang={lang}
      region="south"
      speech="qua xin nha"
      words={timed}
      modelSamples={samples}
      modelRate={16000}
      userSamples={samples}
      userRate={16000}
      modelMissing={false}
      voiceId={voiceId}
      timingsPending={timingsPending}
    />,
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('repeat feedback view', () => {
  it('shows the curves, the word colours and the bars without an extra step', () => {
    renderFeedback()
    const view = screen.getByTestId('repeat-feedback')
    expect(view.hidden).toBe(false)
    expect(view.closest('details')).toBeNull()
    expect(screen.queryByTestId('repeat-stars')).toBeNull()
    expect(screen.getByTestId('melody-bar').getAttribute('data-state')).toBe('passt')
    expect(screen.getByTestId('rhythm-bar').getAttribute('data-state')).toBe('passt')
    expect(screen.getByRole('button', { name: 'qua' }).getAttribute('data-color')).toBe('green')
    expect(screen.getByText('Nördliche Stimme. Ein Hinweis, keine Note.')).toBeTruthy()
    expect(view.textContent ?? '').not.toMatch(/\d+\s*%/)
  })

  it('shows the northern hint only for vais1000', () => {
    renderFeedback('vi', tone(140, 280, 1.2), words, 'vivos-22')
    expect(screen.getByTestId('melody-bar').getAttribute('data-state')).toBe('passt')
    expect(screen.queryByTestId('repeat-stars')).toBeNull()
    expect(screen.queryByText('Nördliche Stimme. Ein Hinweis, keine Note.')).toBeNull()
  })

  it('stops playback when the view goes away', () => {
    const view = render(
      <RepeatFeedback
        copy={de}
        lang="de"
        region="south"
        speech="qua xin nha"
        words={words}
        modelSamples={tone(140, 280, 1.2)}
        modelRate={16000}
        userSamples={tone(140, 280, 1.2)}
        userRate={16000}
        modelMissing={false}
        voiceId="thorsten-high"
      />,
    )
    view.unmount()
    expect(stopSlices).toHaveBeenCalled()
  })

  it('plays the model word and then your word, and stays quiet for other languages', () => {
    renderFeedback('en')
    expect(screen.queryByText('Nördliche Stimme. Ein Hinweis, keine Note.')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'qua' }))
    expect(vi.mocked(playSequence)).toHaveBeenCalledTimes(1)
    const parts = vi.mocked(playSequence).mock.calls[0]?.[0] ?? []
    expect(parts).toHaveLength(2)
    expect(parts[0]?.start).toBe(0.15)
    expect(parts[1]?.start).toBeGreaterThanOrEqual(0)
    expect(screen.getByText('Nacheinander. Beide laufen nicht zugleich.')).toBeTruthy()
    expect(screen.queryByText(/sechs Formen/)).toBeNull()
  })

  it('keeps the word colour for joe when the take matches the file', () => {
    renderFeedback('en', tone(140, 280, 1.2), words, 'joe')
    expect(screen.getByRole('button', { name: 'qua' }).getAttribute('data-color')).toBe('green')
    expect(screen.getByTestId('melody-bar').getAttribute('data-state')).toBe('passt')
    expect(screen.queryByTestId('repeat-stars')).toBeNull()
  })

  it('passes the loudness of the model and the take into the score', () => {
    renderFeedback()
    const input = vi.mocked(scoreRepeat).mock.calls.at(-1)?.[0]
    expect(input?.modelEnergy?.length ?? 0).toBeGreaterThan(8)
    expect(input?.userEnergy?.length ?? 0).toBeGreaterThan(8)
    expect(input?.modelEnergy?.some((value) => value > 0)).toBe(true)
    expect(input?.userEnergy?.some((value) => value > 0)).toBe(true)
    expect(input?.modelBands?.length ?? 0).toBeGreaterThan(8)
    expect(input?.userBands?.length ?? 0).toBeGreaterThan(8)
    expect(input?.modelBands?.[0]?.length).toBe(12)
    expect(input?.userBands?.[0]?.length).toBe(12)
  })

  it('shows the missing-times line only once the timings are known to be absent', () => {
    renderFeedback('de', tone(220, 220, 1.2), words)
    expect(screen.queryByText('Keine Wortzeiten für diese Stimme.')).toBeNull()
    cleanup()
    renderFeedback('de', tone(220, 220, 1.2), null, 'thorsten-high', true)
    expect(screen.queryByText('Keine Wortzeiten für diese Stimme.')).toBeNull()
    cleanup()
    renderFeedback('de', tone(220, 220, 1.2), null)
    expect(screen.getByTestId('repeat-feedback').querySelector('canvas')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'qua' }).getAttribute('data-color')).toBe('none')
    expect(screen.getByRole('button', { name: 'qua' }).getAttribute('data-melody')).toBe('none')
    expect(screen.queryByTestId('melody-bar')).toBeNull()
    expect(screen.getByRole('status').textContent).toBe('Für diese Stimme gibt es keine Wortzeiten. Die Kurve bleibt, die Wörter bleiben grau.')
  })

  it('names a short take and a quiet take', () => {
    renderFeedback('de', tone(220, 220, 0.2), [{ start: 0, end: 0.2 }])
    expect(screen.getByRole('status').textContent).toBe('Zu kurz. Sprich den ganzen Satz.')
    expect(screen.getByRole('button', { name: 'qua' }).getAttribute('data-color')).toBe('none')
    expect(screen.queryByTestId('melody-bar')).toBeNull()
    cleanup()
    render(
      <RepeatFeedback
        copy={de}
        lang="de"
        region="south"
        speech="qua"
        words={[{ start: 0, end: 1 }]}
        modelSamples={tone(220, 220, 1)}
        voiceId="thorsten-high"
        modelRate={16000}
        userSamples={new Float32Array(16000)}
        userRate={16000}
        modelMissing={false}
      />,
    )
    expect(screen.getByRole('status').textContent).toBe('Zu leise. Geh näher ans Mikrofon und sprich noch einmal.')
    expect(screen.getByRole('button', { name: 'qua' })).toBeTruthy()
    expect(screen.queryByTestId('melody-bar')).toBeNull()
  })

  it('explains a thin colouring instead of leaving the bars empty', () => {
    const model = tone(140, 280, 1.6)
    const user = new Float32Array(model.length)
    let phase = 0
    for (let index = 0; index < user.length; index += 1) {
      const time = index / 16000
      if (time > 0.28 && time < 1.32) continue
      const hz = 140 + 140 * (index / user.length)
      phase += (2 * Math.PI * hz) / 16000
      user[index] = Math.sin(phase) * 0.8
    }
    render(
      <RepeatFeedback
        copy={de}
        lang="de"
        region="south"
        speech="eins zwei drei vier fünf"
        words={[
          { start: 0.05, end: 0.3 },
          { start: 0.35, end: 0.6 },
          { start: 0.65, end: 0.9 },
          { start: 0.95, end: 1.2 },
          { start: 1.25, end: 1.45 },
        ]}
        modelSamples={model}
        modelRate={16000}
        userSamples={user}
        userRate={16000}
        modelMissing={false}
        voiceId="thorsten-high"
      />,
    )
    const status = screen.getByRole('status')
    expect(status.textContent).toBe('Nur ein Teil der Wörter ist bewertet. Die Balken gelten für diesen Teil.')
    for (const bar of screen.queryAllByTestId(/bar$/)) {
      expect(bar.getAttribute('data-state')).toBeTruthy()
    }
    expect(screen.queryByTestId('repeat-stars')).toBeNull()
  })

  it('keeps the not-assessable sentence readable in show mode', () => {
    render(
      <div className="show-mode">
        <RepeatFeedback
          copy={de}
          lang="de"
          region="south"
          speech="qua"
          words={null}
          modelSamples={tone(220, 220, 1)}
          modelRate={16000}
          userSamples={tone(220, 220, 1)}
          userRate={16000}
          modelMissing={false}
          voiceId="thorsten-high"
        />
      </div>,
    )
    const status = screen.getByRole('status')
    expect(status.textContent).toBe('Für diese Stimme gibt es keine Wortzeiten. Die Kurve bleibt, die Wörter bleiben grau.')
    expect(status.closest('.show-mode')).toBeTruthy()
  })
})
