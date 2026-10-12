import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { AUDIO_FILE, voiceFile } from '../content/resolve'
import { defaultSettings } from '../storage/types'
import { filesForVoice, selectedVoice, spokenFile, spokenWordFile, voicesFor, voicesKeptByOthers, withDefaultVoices } from './voices'

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

  it('plays a missing legacy word clip on the default voice and leaves the sentence file', () => {
    const manifest = JSON.parse(readFileSync(fileURLToPath(new URL('../../public/audio/manifest.json', import.meta.url)), 'utf8')) as string[]
    const cases = [
      ['de', 'thorsten', 'thorsten-high'],
      ['en', 'ljspeech', 'joe'],
      ['pt-BR', 'faber', 'cadu'],
      ['vi', 'vais1000', 'vivos-22'],
    ] as const
    for (const [lang, legacy, fallback] of cases) {
      const settings = { ...defaultSettings, voices: { [lang]: legacy } }
      const word = spokenWordFile(settings, lang, `${lang}/w.water__any__base.m4a`)
      expect(word).toBe(`${lang}/${fallback}/w.water__any__base.m4a`)
      expect(manifest).toContain(word)
      expect(spokenFile(settings, lang, `${lang}/emergency.help__any__base.m4a`)).toBe(`${lang}/emergency.help__any__base.m4a`)
    }
    const north = { ...defaultSettings, voices: { vi: 'vivos-32' } }
    expect(spokenWordFile(north, 'vi', 'vi/w.yes__north__base.m4a')).toBe('vi/vivos-32/w.yes__north__base.m4a')
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
      'de/emergency.help__any__base.align.json',
      'de/thorsten-high/emergency.help__any__base.m4a',
      'de/thorsten-high/emergency.help__any__base.align.json',
      'en/joe/emergency.help__any__base.m4a',
      'en/joe/emergency.help__any__base.align.json',
    ]
    const high = voicesFor('de').find((voice) => voice.id === 'thorsten-high')
    const legacy = voicesFor('de').find((voice) => voice.legacy)
    expect(filesForVoice(listed, 'de', high!)).toEqual([
      'de/thorsten-high/emergency.help__any__base.m4a',
      'de/thorsten-high/emergency.help__any__base.align.json',
    ])
    expect(filesForVoice(listed, 'de', legacy!)).toEqual([
      'de/emergency.help__any__base.m4a',
      'de/emergency.help__any__base.align.json',
    ])
  })

  it('keeps another person voice and not the active person own voice', () => {
    const people = [
      { id: 'a', settings: { ...defaultSettings, appLang: 'de' as const, targetLang: 'vi' as const, voices: { vi: 'vivos-22' } } },
      { id: 'b', settings: { ...defaultSettings, appLang: 'pt-BR' as const, targetLang: 'vi' as const, voices: { vi: 'vivos-32' } } },
    ]
    expect(voicesKeptByOthers(people, 'a', 'vi')).toEqual(['vivos-32'])
    expect(voicesKeptByOthers(people, 'b', 'vi')).toEqual(['vivos-22'])
  })
})
