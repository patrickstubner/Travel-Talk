import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { AUDIO_FILE, voiceFile } from '../content/resolve'
import { defaultSettings } from '../storage/types'
import { filesForVoice, previewFile, selectedVoice, spokenFile, spokenWordFile, VOICE_SAMPLE, VOICES, voicesFor, voicesKeptByOthers, withDefaultVoices } from './voices'

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

  it('gives every voice a normal-tempo sample of at least two seconds', () => {
    const manifest = JSON.parse(readFileSync(fileURLToPath(new URL('../../public/audio/manifest.json', import.meta.url)), 'utf8')) as string[]
    const bundled = VOICES.filter((voice) => voice.bundled)
    expect(bundled.length).toBeGreaterThan(0)
    for (const voice of bundled) {
      const file = previewFile(voice.lang, voice)
      expect(file.endsWith(VOICE_SAMPLE)).toBe(true)
      expect(file).not.toMatch(/\.r70\.m4a$|\.r85\.m4a$/)
      expect(manifest).toContain(file)
      expect(filesForVoice(manifest, voice.lang, voice)).toContain(file)
      const bytes = readFileSync(fileURLToPath(new URL(`../../public/audio/${file}`, import.meta.url)))
      expect(bytes.length).toBeLessThan(40_000)
      expect(mp4Seconds(bytes)).toBeGreaterThanOrEqual(2)
    }
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

/** Movie header duration. These clips are one audio track, so it is the sample length. */
function mp4Seconds(bytes: Uint8Array): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  function u32(at: number): number {
    return view.getUint32(at)
  }
  function walk(start: number, end: number): number | null {
    let offset = start
    while (offset + 8 <= end) {
      let size = u32(offset)
      const type = String.fromCharCode(bytes[offset + 4] ?? 0, bytes[offset + 5] ?? 0, bytes[offset + 6] ?? 0, bytes[offset + 7] ?? 0)
      let header = 8
      if (size === 1) {
        if (offset + 16 > end) return null
        size = Number(view.getBigUint64(offset + 8))
        header = 16
      }
      if (size < header || offset + size > end) return null
      const body = offset + header
      const next = offset + size
      if (type === 'mvhd') {
        const version = bytes[body] ?? 0
        if (version === 0) {
          const timescale = u32(body + 12)
          const duration = u32(body + 16)
          return timescale > 0 ? duration / timescale : null
        }
        const timescale = u32(body + 20)
        const duration = Number(view.getBigUint64(body + 24))
        return timescale > 0 ? duration / timescale : null
      }
      if (type === 'moov' || type === 'trak' || type === 'mdia') {
        const found = walk(body, next)
        if (found != null) return found
      }
      offset = next
    }
    return null
  }
  const seconds = walk(0, bytes.length)
  if (seconds == null) throw new Error('MP4_DURATION')
  return seconds
}
