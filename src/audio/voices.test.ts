import { describe, expect, it } from 'vitest'
import { AUDIO_FILE, voiceFile } from '../content/resolve'
import { defaultSettings } from '../storage/types'
import { filesForVoice, selectedVoice, voicesFor, withDefaultVoices } from './voices'

describe('voices', () => {
  it('keeps the old files when no voice is stored and writes a male voice for a new user', () => {
    const settings = { ...defaultSettings, appLang: 'de' as const, targetLang: 'vi' as const }
    expect(selectedVoice(settings, 'vi').id).toBe('vais1000')
    expect(selectedVoice(settings, 'de').id).toBe('thorsten')
    const next = withDefaultVoices(settings)
    expect(next.voices).toEqual({ de: 'thorsten-high', vi: 'vivos-22' })
    expect(next.voiceHintSeen).toBe(true)
    expect(selectedVoice(next, 'vi').legacy).toBe(false)
  })

  it('puts a voice id in the path and leaves the legacy file alone', () => {
    const base = 'vi/emergency.peanut__south__base.m4a'
    expect(voiceFile(base, 'vivos-22', false)).toBe('vi/vivos-22/emergency.peanut__south__base.m4a')
    expect(voiceFile(base, 'vais1000', true)).toBe(base)
    for (const voice of voicesFor('en')) {
      const file = voiceFile('en/emergency.help__any__base.r70.m4a', voice.id, voice.legacy)
      expect(file).toMatch(AUDIO_FILE)
    }
  })

  it('lists only the files of one voice', () => {
    const listed = [
      'de/emergency.help__any__base.m4a',
      'de/thorsten-high/emergency.help__any__base.m4a',
      'en/joe/emergency.help__any__base.m4a',
    ]
    const high = voicesFor('de').find((voice) => voice.id === 'thorsten-high')
    const legacy = voicesFor('de').find((voice) => voice.legacy)
    expect(filesForVoice(listed, 'de', high!)).toEqual(['de/thorsten-high/emergency.help__any__base.m4a'])
    expect(filesForVoice(listed, 'de', legacy!)).toEqual(['de/emergency.help__any__base.m4a'])
  })
})
