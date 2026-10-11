import { describe, expect, it } from 'vitest'
import { rawCatalog } from '../../content'
import { GLOSS, GLOSS_CHECKED, expandTokens, linkWords, splitWords } from '../../content/gloss'
import type { Lang } from '../../content/phrase'
import { resolvePlayback } from './resolve'
import { defaultSettings, prefsFromSettings } from '../storage/types'
import { addressInsert, linksFor } from './word-links'

const LANGS: Lang[] = ['de', 'en', 'pt-BR', 'vi']

function misses(conceptId: string, lang: Lang, region: 'south' | 'north'): string[] {
  const concept = rawCatalog.concepts.find((item) => item.id === conceptId)
  if (!concept) return [`missing concept ${conceptId}`]
  const settings = { ...defaultSettings, viRegion: region }
  const line = resolvePlayback(concept, lang, region, prefsFromSettings(lang, settings))
  if (!line) return []
  const words = splitWords(line.speech)
  const problems: string[] = []
  for (const group of GLOSS[conceptId] ?? []) {
    const key = lang === 'pt-BR' ? 'pt' : lang === 'vi' && region === 'north' ? 'viN' : lang
    const raw = key === 'viN' ? (group.viN ?? group.vi) : group[key]
    if (!raw || raw.length === 0) continue
    const pattern = expandTokens(raw, addressInsert(lang, settings))
    const at = words.join('\n')
    let found = false
    for (let start = 0; start + pattern.length <= words.length; start += 1) {
      if (pattern.every((token, offset) => words[start + offset] === token)) found = true
    }
    if (!found) problems.push(`${conceptId} ${lang} ${region} missing ${pattern.join(' ')} in ${at.replaceAll('\n', ' ')}`)
  }
  return problems
}

describe('word gloss', () => {
  it('marks every link unchecked', () => {
    expect(GLOSS_CHECKED).toBe(false)
  })

  it('covers every concept and matches the spoken words', () => {
    const problems: string[] = []
    for (const concept of rawCatalog.concepts) {
      if (!GLOSS[concept.id]) problems.push(`no gloss ${concept.id}`)
      for (const lang of LANGS) problems.push(...misses(concept.id, lang, 'south'))
      problems.push(...misses(concept.id, 'vi', 'north'))
    }
    expect(problems).toEqual([])
  })

  it('links several Vietnamese syllables to one German word', () => {
    const links = linkWords(
      'emergency.ambulance',
      'vi',
      'south',
      'Làm ơn gọi xe cấp cứu.',
      'anh',
      'de',
      'south',
      'Rufen Sie bitte einen Krankenwagen.',
      'Sie',
    )
    expect(links).toContainEqual({ target: [3, 4, 5], gloss: [4] })
  })

  it('uses the northern word and expands a two-word address', () => {
    const north = linksFor('emergency.peanut', 'vi', 'de', 'Tôi bị dị ứng với lạc.', 'Ich bin allergisch gegen Erdnüsse.', {
      ...defaultSettings,
      viRegion: 'north',
    })
    expect(north.some((link) => link.target.length === 1)).toBe(true)
    const formal = linkWords(
      'meet.your-name',
      'pt-BR',
      'south',
      'Como o senhor se chama?',
      'o senhor',
      'en',
      'south',
      'What is your name?',
      '',
    )
    expect(formal.some((link) => link.target.length === 2)).toBe(true)
  })

  it('leaves a greeting variant without a forced link', () => {
    const links = linkWords('meet.hello', 'de', 'south', 'Hallo.', 'Sie', 'en', 'south', 'Hello.', '')
    expect(links).toEqual([])
  })
})
