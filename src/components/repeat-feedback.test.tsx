// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { de, en, pt, vi as viCopy } from '../i18n/dictionary'
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
    expect(screen.getByTestId('repeat-stars').getAttribute('data-stars')).toBe('5')
    expect(screen.getByRole('img', { name: '5 von 5 Sternen' })).toBeTruthy()
    expect(screen.getAllByText('★')).toHaveLength(5)
    expect(screen.getByTestId('melody-bar').getAttribute('data-state')).toBe('passt')
    expect(screen.getByTestId('rhythm-bar').getAttribute('data-state')).toBe('passt')
    expect(screen.getByRole('button', { name: 'qua' }).getAttribute('data-color')).toBe('green')
    for (const text of ['qua', 'xin', 'nha']) {
      const card = screen.getByRole('button', { name: text })
      expect(card.classList.contains('word-card')).toBe(true)
      expect(card.querySelector('.word-chip-text')?.textContent).toBe(text)
      expect(card.querySelectorAll('canvas')).toHaveLength(1)
    }
    expect(screen.getByText('Nördliche Stimme. Ein Hinweis, keine Note.')).toBeTruthy()
    expect(screen.queryByTestId('bars-fit')).toBeNull()
    expect(view.textContent ?? '').not.toMatch(/\d+\s*%/)
  })

  it('shows the northern hint only for vais1000', () => {
    renderFeedback('vi', tone(140, 280, 1.2), words, 'vivos-22')
    expect(screen.getByTestId('melody-bar').getAttribute('data-state')).toBe('passt')
    expect(screen.getByTestId('repeat-stars').getAttribute('data-stars')).toBe('5')
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
    expect(screen.getByTestId('repeat-stars').getAttribute('data-stars')).toBe('5')
  })

  it('passes another voice contour into the score and keeps the played file', async () => {
    const played = tone(140, 280, 1.2)
    const other = tone(180, 120, 1.2)
    render(
      <RepeatFeedback
        copy={de}
        lang="pt-BR"
        region="south"
        speech="qua xin nha"
        words={words}
        modelSamples={played}
        modelRate={16000}
        userSamples={played}
        userRate={16000}
        modelMissing={false}
        voiceId="cadu"
        referenceClips={[{ samples: other, sampleRate: 16000 }]}
      />,
    )
    await waitFor(() => {
      const input = vi.mocked(scoreRepeat).mock.calls.at(-1)?.[0]
      expect(input?.references?.length).toBe(1)
    })
    const input = vi.mocked(scoreRepeat).mock.calls.at(-1)?.[0]
    expect(input?.model.length ?? 0).toBeGreaterThan(8)
    expect(input?.references?.[0]).not.toEqual(input?.model)
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
    expect(input?.modelBands?.find((frame) => frame.length > 0)?.length).toBe(12)
    expect(input?.userBands?.find((frame) => frame.length > 0)?.length).toBe(12)
    expect(input?.modelSpeechBands?.length ?? 0).toBeGreaterThan(8)
    expect(input?.userSpeechBands?.length ?? 0).toBeGreaterThan(8)
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
    expect(screen.getByTestId('repeat-stars').getAttribute('data-stars')).toMatch(/^[0-5]$/)
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

  it('paints the melody mark and the rhythm mark with the word colour', () => {
    renderFeedback('de')
    const chip = screen.getByRole('button', { name: 'qua' })
    expect(chip.getAttribute('data-melody')).toBe('green')
    expect(chip.getAttribute('data-rhythm')).toBe('green')
    const marks = chip.querySelectorAll('.mark')
    expect(marks[0]?.textContent).toBe('Melodie')
    expect(marks[0]?.className).toBe('mark green')
    expect(marks[1]?.textContent).toBe('Rhythmus')
    expect(marks[1]?.className).toBe('mark green')
  })

  it('draws no bars when every word stays grey', async () => {
    const actual = await vi.importActual<typeof import('../pitch/feedback')>('../pitch/feedback')
    vi.mocked(scoreRepeat).mockImplementationOnce((input) => {
      const score = actual.scoreRepeat(input)
      return {
        ...score,
        melodyBar: 'passt',
        rhythmBar: 'passt',
        unclear: false,
        otherSentence: false,
        fewWords: false,
        words: score.words?.map((word) => ({ ...word, color: null, melody: null, rhythm: null })) ?? null,
      }
    })
    renderFeedback('de')
    expect(screen.getByRole('button', { name: 'qua' }).getAttribute('data-color')).toBe('none')
    expect(screen.queryByTestId('melody-bar')).toBeNull()
    expect(screen.queryByTestId('rhythm-bar')).toBeNull()
  })

  it('hides unklar while coloured bars are on the page', async () => {
    const actual = await vi.importActual<typeof import('../pitch/feedback')>('../pitch/feedback')
    vi.mocked(scoreRepeat).mockImplementationOnce((input) => ({
      ...actual.scoreRepeat(input),
      unclear: true,
    }))
    renderFeedback('de')
    expect(screen.getByTestId('melody-bar')).toBeTruthy()
    expect(screen.getByTestId('rhythm-bar')).toBeTruthy()
    expect(screen.queryByText('Das lässt sich nicht zuordnen. Sprich in derselben Richtung wie die Datei, ohne lange Pause davor.')).toBeNull()
  })

  it('calls a reversed recording unklar and draws no bars', () => {
    const sampleRate = 16000
    const seconds = 1.4
    const length = Math.floor(sampleRate * seconds)
    const forward = new Float32Array(length)
    const freqs = [180, 420, 140, 320, 220, 500]
    let phase = 0
    for (let index = 0; index < length; index += 1) {
      const hz = freqs[Math.floor((index / length) * freqs.length)] ?? 180
      phase += (2 * Math.PI * hz) / sampleRate
      const envelope = 0.5 + 0.5 * Math.sin((2 * Math.PI * index) / (sampleRate * 0.07))
      forward[index] = Math.sin(phase) * 0.8 * envelope
    }
    const backward = new Float32Array(forward.length)
    for (let index = 0; index < forward.length; index += 1) backward[index] = forward[forward.length - 1 - index] ?? 0
    render(
      <RepeatFeedback
        copy={de}
        lang="de"
        region="south"
        speech="eins zwei drei"
        words={[
          { start: 0.1, end: 0.45 },
          { start: 0.5, end: 0.85 },
          { start: 0.9, end: 1.25 },
        ]}
        modelSamples={forward}
        modelRate={16000}
        userSamples={backward}
        userRate={16000}
        modelMissing={false}
        voiceId="thorsten-high"
      />,
    )
    expect(screen.getByRole('status').textContent).toBe(
      'Das lässt sich nicht zuordnen. Sprich in derselben Richtung wie die Datei, ohne lange Pause davor.',
    )
    expect(screen.getByRole('button', { name: 'eins' }).getAttribute('data-color')).toBe('none')
    expect(screen.queryByTestId('melody-bar')).toBeNull()
    expect(screen.queryByTestId('rhythm-bar')).toBeNull()
  })

  it('names a thin model file instead of a quiet take', () => {
    render(
      <RepeatFeedback
        copy={de}
        lang="de"
        region="south"
        speech="Hilfe"
        words={[{ start: 0.1, end: 0.8 }]}
        modelSamples={new Float32Array(16000)}
        modelRate={16000}
        userSamples={tone(160, 220, 1)}
        userRate={16000}
        modelMissing={false}
        voiceId="joe"
      />,
    )
    expect(screen.getByRole('status').textContent).toBe('In dieser Datei ist zu wenig Stimme. Nochmal ändert daran nichts.')
    expect(screen.queryByText('Zu leise. Geh näher ans Mikrofon und sprich noch einmal.')).toBeNull()
    expect(screen.queryByTestId('melody-bar')).toBeNull()
  })

  it('does not hint at another sentence while the bars are coloured', async () => {
    const actual = await vi.importActual<typeof import('../pitch/feedback')>('../pitch/feedback')
    vi.mocked(scoreRepeat).mockImplementationOnce((input) => ({
      ...actual.scoreRepeat(input),
      otherSentence: true,
    }))
    renderFeedback('de')
    expect(screen.queryByText('Das klingt nach einem anderen Satz. Hör die Datei noch einmal und sprich denselben.')).toBeNull()
    expect(screen.getByTestId('melody-bar')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'qua' }).getAttribute('data-color')).not.toBe('none')
  })

  it('names the word that has too little voice in the file', async () => {
    const actual = await vi.importActual<typeof import('../pitch/feedback')>('../pitch/feedback')
    vi.mocked(scoreRepeat).mockImplementationOnce((input) => {
      const score = actual.scoreRepeat(input)
      return {
        ...score,
        words:
          score.words?.map((word, index) =>
            index === 1 ? { ...word, scorable: false, color: null, melody: null, rhythm: null } : word,
          ) ?? null,
      }
    })
    renderFeedback('de')
    expect(screen.getByRole('status').textContent).toBe('In der Datei hat «xin» zu wenig Stimme. Nochmal ändert daran nichts.')
    expect(screen.getByTestId('melody-bar')).toBeTruthy()
  })

  it('keeps five stars off a wrong sentence and three on a fitting sentence with a weak melody', async () => {
    const actual = await vi.importActual<typeof import('../pitch/feedback')>('../pitch/feedback')
    vi.mocked(scoreRepeat).mockImplementationOnce((input) => ({
      ...actual.scoreRepeat(input),
      melodyBar: 'passt',
      rhythmBar: 'passt',
      verdict: 'daneben',
      sentenceCheck: {
        correlation: -0.2,
        opposedShare: 0.8,
        order: 0.2,
        bands: 0.4,
        backwards: false,
      },
    }))
    renderFeedback('de')
    expect(screen.getByTestId('repeat-stars').getAttribute('data-stars')).toBe('1')
    expect(screen.getAllByText('★')).toHaveLength(5)
    expect(screen.getAllByText('★').filter((node) => node.classList.contains('on'))).toHaveLength(1)
    expect(screen.queryByTestId('bars-fit')).toBeNull()
    cleanup()
    vi.mocked(scoreRepeat).mockImplementationOnce((input) => ({
      ...actual.scoreRepeat(input),
      melodyBar: 'passt',
      rhythmBar: 'passt',
      verdict: 'teilweise',
      sentenceCheck: {
        correlation: 0.3,
        opposedShare: 0.2,
        order: 1,
        bands: 0.3,
        backwards: false,
      },
    }))
    renderFeedback('de')
    expect(screen.getByTestId('repeat-stars').getAttribute('data-stars')).toBe('4')
    expect(screen.getAllByText('★').filter((node) => node.classList.contains('on'))).toHaveLength(4)
    expect(screen.getByTestId('bars-fit').textContent).toBe('Vier Sterne. Die Balken passen, der Satz noch nicht ganz.')
    cleanup()
    vi.mocked(scoreRepeat).mockImplementationOnce((input) => ({
      ...actual.scoreRepeat(input),
      melodyBar: 'daneben',
      rhythmBar: 'passt',
      verdict: 'passt',
    }))
    renderFeedback('de')
    expect(screen.getByTestId('repeat-stars').getAttribute('data-stars')).toBe('3')
    expect(screen.queryByTestId('bars-fit')).toBeNull()
    cleanup()
    vi.mocked(scoreRepeat).mockImplementationOnce((input) => ({
      ...actual.scoreRepeat(input),
      melodyBar: 'daneben',
      rhythmBar: 'teilweise',
      verdict: 'daneben',
    }))
    renderFeedback('de')
    expect(screen.getByTestId('repeat-stars').getAttribute('data-stars')).toBe('1')
    cleanup()
    vi.mocked(scoreRepeat).mockImplementationOnce((input) => ({
      ...actual.scoreRepeat(input),
      melodyBar: 'daneben',
      rhythmBar: 'daneben',
      verdict: 'daneben',
      sentenceCheck: {
        correlation: null,
        opposedShare: 1,
        order: null,
        bands: null,
        backwards: true,
      },
    }))
    renderFeedback('de')
    expect(screen.getByTestId('repeat-stars').getAttribute('data-stars')).toBe('0')
    expect(screen.getAllByText('★').filter((node) => node.classList.contains('on'))).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: 'Was die Sterne bedeuten' }))
    expect(screen.getByRole('dialog').textContent ?? '').toMatch(/Ein falscher Satz bekommt nie fünf/)
  })

  it('gives two German stars when the pitches are close and three when the take is far above', async () => {
    const actual = await vi.importActual<typeof import('../pitch/feedback')>('../pitch/feedback')
    const paint = () => {
      vi.mocked(scoreRepeat).mockImplementationOnce((input) => {
        const score = actual.scoreRepeat(input)
        const painted = ['qua', 'xin', 'nha'].map((text, index) => ({
          text,
          start: words[index]?.start ?? 0,
          end: words[index]?.end ?? 0,
          color: 'yellow' as const,
          melody: 'yellow' as const,
          rhythm: 'yellow' as const,
          melodyDistance: 2,
          rawRatio: 1,
          userStart: words[index]?.start ?? 0,
          userEnd: words[index]?.end ?? 0,
          modelFrame: 0,
          modelFrameEnd: 1,
          userFrame: 0,
          userFrameEnd: 1,
          tone: null,
          userShape: 'level' as const,
          sentence: null,
          scorable: true,
        }))
        return {
          ...score,
          words: painted,
          melodyBar: 'teilweise' as const,
          rhythmBar: 'teilweise' as const,
          verdict: 'teilweise' as const,
          unclear: false,
          tooShort: false,
          tooLittleVoice: false,
          sentenceCheck: {
            correlation: 0.4,
            opposedShare: 0.2,
            order: 1,
            bands: 0.3,
            backwards: false,
          },
        }
      })
    }
    const show = (modelHz: number, userHz: number) => {
      render(
        <RepeatFeedback
          copy={de}
          lang="de"
          region="south"
          speech="qua xin nha"
          words={words}
          modelSamples={tone(modelHz, modelHz, 1.2)}
          modelRate={16000}
          userSamples={tone(userHz, userHz, 1.2)}
          userRate={16000}
          modelMissing={false}
          voiceId="thorsten-high"
        />,
      )
    }
    // 120 against 140 is about 2.7 semitones, inside the cut. The page sets no gender.
    paint()
    show(120, 140)
    expect(screen.getByTestId('repeat-stars').getAttribute('data-stars')).toBe('2')
    cleanup()
    // 110 against 280 is about 16 semitones. thorsten-high is male.
    // A mutant that defaults the user gender to male would score this 2.
    paint()
    show(110, 280)
    expect(screen.getByTestId('repeat-stars').getAttribute('data-stars')).toBe('3')
    fireEvent.click(screen.getByRole('button', { name: 'Was die Sterne bedeuten' }))
    const dialog = screen.getByRole('dialog').textContent ?? ''
    expect(dialog).toMatch(/Ein falscher Satz bekommt nie fünf/)
    expect(dialog).not.toMatch(/Geschlecht|gender|gênero|giới/i)
    for (const hint of [de, en, pt, viCopy].map((copy) => copy.repeatFeedback.starsHint)) {
      expect(hint).not.toMatch(/Geschlecht|gender|gênero|giới/i)
    }
  })

  it('draws no stars when the bars are absent', () => {
    renderFeedback('de', tone(220, 220, 0.2), [{ start: 0, end: 0.2 }])
    expect(screen.queryByTestId('melody-bar')).toBeNull()
    expect(screen.queryByTestId('repeat-stars')).toBeNull()
  })
})
