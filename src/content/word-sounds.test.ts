import { describe, expect, it } from 'vitest'
import { WORDS, spokenCitation } from '../../content/words'
import { chaoTones, syllableTones, wordSound } from '../../content/word-sounds'
import { WORD_INTRO_PASSES, wordSteps } from '../srs/session'
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
    expect(syllableTones(spokenCitation(WORDS.find((word) => word.id === 'w.not')!, 'vi', 'south'))).toEqual(['huyen'])
    expect(syllableTones(spokenCitation(WORDS.find((word) => word.id === 'w.where')!, 'vi', 'south'))).toEqual(['huyen'])
    expect(syllableTones(spokenCitation(WORDS.find((word) => word.id === 'w.here')!, 'vi', 'south'))).toEqual(['sac'])
    expect(wordSound(WORDS.find((word) => word.id === 'w.days')!, 'vi', 'de', 'south').read).toBe('ngai, fallend')
    expect(wordSound(WORDS.find((word) => word.id === 'w.yes')!, 'vi', 'de', 'south').read).toBe('ja, schwer')
    expect(wordSound(WORDS.find((word) => word.id === 'w.yes')!, 'vi', 'de', 'north').read).toBe('wöng, eben')
    expect(wordSound(WORDS.find((word) => word.id === 'w.help')!, 'vi', 'en', 'south').read).toBe('koo, rising · voy, rising')
  })

  it('hears a new word three times before the question', () => {
    expect(WORD_INTRO_PASSES).toBe(3)
    expect(wordSteps(true)).toEqual(['word-intro', 'word-intro', 'word-intro', 'word'])
    expect(wordSteps(false)).toEqual(['word'])
  })
})
