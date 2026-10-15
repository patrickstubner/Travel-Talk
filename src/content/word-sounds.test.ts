import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { WORDS, spokenCitation } from '../../content/words'
import { chaoTones, syllableTones, wordSound } from '../../content/word-sounds'
import { wordSteps } from '../srs/word-steps'
import type { Lang } from '../../content/phrase'

const langs: Lang[] = ['de', 'en', 'pt-BR', 'vi']

describe('word sounds', () => {
  it('has a reading and an IPA line for every word and every app language', () => {
    for (const word of WORDS) {
      for (const target of langs) {
        for (const app of langs) {
          for (const region of ['south', 'north'] as const) {
            const sound = wordSound(word, target, app, region)
            expect(sound.ipa.startsWith('/')).toBe(true)
            expect(sound.ipa.endsWith('/')).toBe(true)
            expect(sound.ipa).not.toContain('(en)')
            expect(sound.read.length).toBeGreaterThan(0)
          }
        }
      }
    }
  })

  it('names the written Vietnamese tone on every syllable', () => {
    for (const word of WORDS) {
      for (const region of ['south', 'north'] as const) {
        const spoken = spokenCitation(word, 'vi', region)
        const tones = syllableTones(spoken)
        const sound = wordSound(word, 'vi', 'de', region)
        const heard = chaoTones(sound.ipa).filter((tone, index, all) => tone !== 'ngang' || all[index - 1] !== 'ngang')
        expect(heard).toEqual(tones)
        const labels = sound.read.split(' · ').map((part) => part.split(', ').at(-1))
        expect(labels).toHaveLength(tones.length)
      }
    }
    expect(wordSound(WORDS.find((word) => word.id === 'w.days')!, 'vi', 'de', 'south').read).toBe('ngai, fallend')
    expect(wordSound(WORDS.find((word) => word.id === 'w.yes')!, 'vi', 'de', 'south').read).toBe('ja, schwer')
    expect(wordSound(WORDS.find((word) => word.id === 'w.yes')!, 'vi', 'de', 'north').read).toBe('wöng, eben')
    expect(wordSound(WORDS.find((word) => word.id === 'w.help')!, 'vi', 'en', 'south').read).toBe('koo, rising · voy, rising')
  })

  it('keeps không, đâu and đây, with a level IPA tone', () => {
    const pinned = [
      { id: 'w.not', spelling: 'không', points: [0x6b, 0x68, 0x00f4, 0x6e, 0x67], ipa: '/xəwŋ˧/' },
      { id: 'w.where', spelling: 'đâu', points: [0x0111, 0x00e2, 0x75], ipa: '/ɗəw˧/' },
      { id: 'w.here', spelling: 'đây', points: [0x0111, 0x00e2, 0x79], ipa: '/ɗəj˧/' },
    ] as const
    const lines = JSON.parse(readFileSync('tools/word-lines.json', 'utf8')) as { text: string; file: string }[]
    for (const row of pinned) {
      const word = WORDS.find((entry) => entry.id === row.id)!
      const points = [...word.citation.vi].map((ch) => ch.codePointAt(0))
      expect(word.citation.vi).toBe(row.spelling)
      expect(points).toEqual([...row.points])
      expect(syllableTones(spokenCitation(word, 'vi', 'south'))).toEqual(['ngang'])
      const sound = wordSound(word, 'vi', 'vi', 'south')
      expect(sound.ipa).toBe(row.ipa)
      expect(chaoTones(sound.ipa)).toEqual(['ngang'])
      expect(sound.read.startsWith(`${row.spelling},`)).toBe(true)
      const texts = lines.filter((line) => line.file.startsWith('vi/') && line.file.endsWith(`/${row.id}__any__base.m4a`)).map((line) => line.text)
      expect(texts).toEqual([row.spelling, row.spelling])
    }
  })

  it('opens a new word on the question', () => {
    expect(wordSteps(true)).toEqual(['word'])
    expect(wordSteps(false)).toEqual(['word'])
  })
})
