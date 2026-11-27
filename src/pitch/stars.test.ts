import { describe, expect, it } from 'vitest'
import { fiveStars, weightedRhythm, wordsBar } from './stars'

describe('wordsBar', () => {
  it('maps the word error rate to a bar', () => {
    expect(wordsBar(null)).toBeNull()
    expect(wordsBar(Number.NaN)).toBeNull()
    expect(wordsBar(0)).toBe('passt')
    expect(wordsBar(0.34)).toBe('passt')
    expect(wordsBar(0.4)).toBe('teilweise')
    expect(wordsBar(0.5)).toBe('daneben')
    expect(wordsBar(1)).toBe('daneben')
  })
})

describe('weightedRhythm', () => {
  it('keeps German and English bars', () => {
    expect(weightedRhythm('teilweise', 'de')).toBe('teilweise')
    expect(weightedRhythm('daneben', 'en')).toBe('daneben')
  })
  it('softens Portuguese and Vietnamese', () => {
    expect(weightedRhythm('daneben', 'pt-BR')).toBe('teilweise')
    expect(weightedRhythm('teilweise', 'pt-BR')).toBe('teilweise')
    expect(weightedRhythm('teilweise', 'vi')).toBe('passt')
    expect(weightedRhythm('daneben', 'vi')).toBe('teilweise')
  })
  it('passes null through', () => {
    expect(weightedRhythm(null, 'de')).toBeNull()
  })
})

describe('fiveStars with recognised words', () => {
  const base = { verdict: 'passt' as const, lang: 'de' as const }
  it('gives 5 only when all three bars fit', () => {
    expect(fiveStars({ ...base, melody: 'passt', rhythm: 'passt', words: 'passt' })).toBe(5)
  })
  it('gives 4 for two of three with the rest partial', () => {
    expect(fiveStars({ ...base, melody: 'passt', rhythm: 'teilweise', words: 'passt' })).toBe(4)
    expect(fiveStars({ ...base, melody: 'passt', rhythm: 'passt', words: 'teilweise' })).toBe(4)
  })
  it('gives 3 for recognised words with partial melody and rhythm', () => {
    expect(fiveStars({ ...base, melody: 'teilweise', rhythm: 'teilweise', words: 'passt' })).toBe(3)
  })
  it('gives 2 for partial words or one bar off', () => {
    expect(fiveStars({ ...base, melody: 'teilweise', rhythm: 'teilweise', words: 'teilweise' })).toBe(2)
    expect(fiveStars({ ...base, melody: 'daneben', rhythm: 'passt', words: 'passt' })).toBe(2)
  })
  it('gives 1 for barely recognised words, even with a green melody', () => {
    expect(fiveStars({ ...base, melody: 'passt', rhythm: 'passt', words: 'daneben' })).toBe(1)
  })
  it('gives 1 for partial words on a wrong sentence', () => {
    expect(fiveStars({ ...base, verdict: 'daneben', melody: 'passt', rhythm: 'passt', words: 'teilweise' })).toBe(1)
  })
  it('trusts recognised words over the pitch sentence check', () => {
    expect(fiveStars({ ...base, verdict: 'daneben', melody: 'passt', rhythm: 'passt', words: 'passt' })).toBe(5)
  })
  it('gives 1 for a reversed take', () => {
    expect(fiveStars({ ...base, backwards: true, melody: 'passt', rhythm: 'passt', words: 'passt' })).toBe(1)
  })
  it('gives no stars without bars', () => {
    expect(fiveStars({ ...base, melody: null, rhythm: 'passt', words: 'passt' })).toBeNull()
  })
})

describe('fiveStars without recognised words', () => {
  it('caps at 4', () => {
    expect(fiveStars({ verdict: 'passt', lang: 'en', melody: 'passt', rhythm: 'passt', words: null })).toBe(4)
  })
  it('maps partial bars', () => {
    expect(fiveStars({ verdict: 'passt', lang: 'en', melody: 'passt', rhythm: 'teilweise', words: null })).toBe(3)
    expect(fiveStars({ verdict: 'teilweise', lang: 'en', melody: 'teilweise', rhythm: 'teilweise', words: null })).toBe(2)
  })
  it('gives 1 for a wrong sentence', () => {
    expect(fiveStars({ verdict: 'daneben', lang: 'de', melody: 'passt', rhythm: 'passt', words: null })).toBe(1)
  })
  it('ignores Vietnamese words, so Vietnamese stays at most 4', () => {
    expect(fiveStars({ verdict: 'passt', lang: 'vi', melody: 'passt', rhythm: 'passt', words: 'passt' })).toBe(4)
    expect(fiveStars({ verdict: 'passt', lang: 'vi', melody: 'passt', rhythm: 'passt', words: 'daneben' })).toBe(4)
  })
  it('lets a yellow Vietnamese rhythm count as green', () => {
    expect(fiveStars({ verdict: 'passt', lang: 'vi', melody: 'passt', rhythm: 'teilweise', words: null })).toBe(4)
  })
})
