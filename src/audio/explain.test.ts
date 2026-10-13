import { afterEach, describe, expect, it, vi } from 'vitest'
import { speakExplanation } from './explain'
import { playClip } from './player'

vi.mock('./player', () => ({
  playClip: vi.fn(),
  stopClip: vi.fn(),
}))

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
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
    expect(playClip).toHaveBeenCalledWith('de/help/ui.mic__any__base.m4a', '', 'de', 1, expect.any(Function))
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
})
