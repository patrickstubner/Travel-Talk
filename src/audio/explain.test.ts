import { afterEach, describe, expect, it, vi } from 'vitest'
import { helpFile, speakExplanation } from './explain'
import { playClip } from './player'

vi.mock('./player', () => ({
  playClip: vi.fn(),
  stopClip: vi.fn(),
}))

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

describe('help files', () => {
  it('versions only the respoken Vietnamese show clip', () => {
    expect(helpFile('vi', 'ui.show')).toBe('vi/help/ui.show__any__base.v2.m4a')
    expect(helpFile('de', 'ui.show')).toBe('de/help/ui.show__any__base.m4a')
    expect(helpFile('en', 'ui.show')).toBe('en/help/ui.show__any__base.m4a')
    expect(helpFile('pt-BR', 'ui.show')).toBe('pt-BR/help/ui.show__any__base.m4a')
  })
})

describe('speakExplanation', () => {
  it('plays the Piper clip and does not call speechSynthesis', async () => {
    const speak = vi.fn()
    vi.stubGlobal('speechSynthesis', { speak, cancel: vi.fn() })
    vi.mocked(playClip).mockImplementation(async (_file, _speech, _lang, _rate, onEnd) => {
      onEnd?.()
      return 'file'
    })
    const token = { current: 1 }
    await speakExplanation('de', [{ text: 'Vorlesen.', clip: 'de/help/ui.mic__any__base.m4a' }], token, 1)
    expect(playClip).toHaveBeenCalledWith(
      'de/help/ui.mic__any__base.m4a',
      '',
      'de',
      1,
      expect.any(Function),
      undefined,
      undefined,
      expect.any(Function),
    )
    expect(speak).not.toHaveBeenCalled()
  })

  it('uses speechSynthesis in the app language when the clip is offline', async () => {
    const speak = vi.fn()
    vi.stubGlobal('speechSynthesis', { speak, cancel: vi.fn() })
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        lang = ''
        text = ''
        onend: (() => void) | null = null
        onerror: (() => void) | null = null
        constructor(text: string) {
          this.text = text
        }
      },
    )
    vi.mocked(playClip).mockResolvedValue('offline')
    speak.mockImplementation((utterance: { onend: (() => void) | null }) => utterance.onend?.())
    const token = { current: 1 }
    await speakExplanation('de', [{ text: 'Vorlesen.', clip: 'de/help/ui.mic__any__base.m4a' }], token, 1)
    expect(speak).toHaveBeenCalledOnce()
    const utterance = speak.mock.calls[0]?.[0] as { lang: string; text: string }
    expect(utterance.lang).toBe('de-CH')
    expect(utterance.text).toBe('Vorlesen.')
  })

  it('stops after an abort and does not play the next paragraph', async () => {
    vi.mocked(playClip).mockImplementation(async (_file, _speech, _lang, _rate, _onEnd, _onTime, _onDuration, onStop) => {
      onStop?.()
      return 'file'
    })
    const token = { current: 1 }
    await speakExplanation(
      'de',
      [
        { text: 'Eins.', clip: 'de/help/ui.mic__any__base.m4a' },
        { text: 'Zwei.', clip: 'de/help/ui.show__any__base.m4a' },
      ],
      token,
      1,
    )
    expect(playClip).toHaveBeenCalledTimes(1)
  })

  it('uses en-US and stops when speechSynthesis reports an error', async () => {
    const speak = vi.fn()
    vi.stubGlobal('speechSynthesis', { speak, cancel: vi.fn() })
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        lang = ''
        text = ''
        onend: (() => void) | null = null
        onerror: (() => void) | null = null
        constructor(text: string) {
          this.text = text
        }
      },
    )
    vi.mocked(playClip).mockResolvedValue('offline')
    speak.mockImplementation((utterance: { onerror: (() => void) | null }) => utterance.onerror?.())
    const token = { current: 1 }
    await speakExplanation(
      'en',
      [
        { text: 'One.', clip: 'en/help/ui.mic__any__base.m4a' },
        { text: 'Two.', clip: 'en/help/ui.show__any__base.m4a' },
      ],
      token,
      1,
    )
    expect(speak).toHaveBeenCalledOnce()
    const utterance = speak.mock.calls[0]?.[0] as { lang: string }
    expect(utterance.lang).toBe('en-US')
  })
})
