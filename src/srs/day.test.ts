import { describe, expect, it } from 'vitest'
import { FILLERS, WORDS, wordIds } from '../../content/words'
import { tryLoadCatalog } from '../content/load'
import { orderedConcepts, usableConcepts } from './session'
import { WORD_BLOCK, buildDay, meaningChoices, missingKeyword, newlyOpenSentences, wordBudget, wordPassed } from './day'
import { reviewCard, toStored, Rating, emptyCard } from './scheduler'
import type { StoredCard } from '../storage/types'

const now = new Date(2026, 9, 12, 9, 0, 0)

function concepts() {
  const loaded = tryLoadCatalog()
  if (!loaded.ok) throw new Error('catalog')
  return usableConcepts(orderedConcepts(loaded.catalog), 'de', 'vi', 'south')
}

function passed(direction: string, id: string): StoredCard {
  const card = reviewCard(emptyCard(now), Rating.Good, now, 0.9, false)
  return { ...toStored(`${direction}:${id}`, card), elapsed_days: 1, last_review: new Date(2026, 9, 11, 9, 0, 0).toISOString(), due: new Date(2026, 9, 14, 9, 0, 0).toISOString() }
}

describe('daily word block', () => {
  it('keeps fillers out and checks twenty words', () => {
    expect(WORDS).toHaveLength(20)
    expect(new Set(wordIds()).size).toBe(20)
    for (const id of wordIds()) expect(id).toMatch(/^w\.[a-z0-9-]+$/)
    const citations = new Set(WORDS.flatMap((word) => [word.citation.de, word.citation.en, word.citation['pt-BR'], word.citation.vi].map((text) => text.toLowerCase())))
    for (const filler of [...FILLERS.de, ...FILLERS.en, ...FILLERS.pt, ...FILLERS.vi]) {
      expect(citations.has(filler)).toBe(false)
    }
    expect(WORDS.filter((word) => word.sentences.includes('visa.days')).map((word) => word.id).sort()).toEqual(['w.days', 'w.stay'])
  })

  it('puts the six visa words ahead of their sentences', () => {
    const day = buildDay(concepts(), [], 'de-vi', now, 'mix')
    expect(day.items.map((item) => item.id)).toEqual(['w.days', 'w.stay', 'w.documents', 'w.evisa', 'w.extend', 'w.visa'])
    expect(day.items.every((item) => item.kind === 'word' && item.isNew)).toBe(true)
    expect(day.sentenceSlots).toBe(4)
    expect(missingKeyword('visa.days', [], 'de-vi', 'de', 'south')).toBe('Tage')
  })

  it('opens a sentence once each keyword was good, and keeps a wrong word shut', () => {
    const ids = ['w.days', 'w.stay']
    const cards = ids.map((id) => passed('de-vi', id))
    expect(wordPassed(cards[0])).toBe(true)
    expect(missingKeyword('visa.days', cards, 'de-vi', 'de', 'south')).toBeNull()
    const again = reviewCard(emptyCard(now), Rating.Again, now, 0.9, false)
    expect(wordPassed(toStored('de-vi:w.days', again))).toBe(false)
    const easy = reviewCard(emptyCard(now), Rating.Easy, now, 0.9, false)
    expect(wordPassed(toStored('de-vi:w.days', easy))).toBe(true)
    const day = buildDay(concepts(), cards, 'de-vi', now, 'new')
    const sentenceAt = day.items.findIndex((item) => item.id === 'visa.days')
    const wordAt = day.items.findIndex((item) => item.kind === 'word')
    expect(sentenceAt).toBeGreaterThan(wordAt)
    expect(day.items[sentenceAt]?.kind).toBe('sentence')
  })

  it('adds the sentence after the block when the last keyword is right', () => {
    const six = ['w.days', 'w.stay', 'w.documents', 'w.evisa', 'w.extend', 'w.visa']
    const cards = six.map((id) => passed('de-vi', id))
    const day = buildDay(concepts(), cards, 'de-vi', now, 'mix')
    expect(day.items.filter((item) => item.kind === 'word')).toEqual([])
    expect(day.items.map((item) => item.id)).toEqual(['visa.days', 'visa.documents', 'visa.evisa', 'visa.extend'])
    const queued = newlyOpenSentences(concepts(), cards, 'de-vi', [], day.sentenceSlots)
    expect(queued).toEqual(['visa.days', 'visa.documents', 'visa.evisa', 'visa.extend'])
  })

  it('stops new words and new sentences at twenty due cards', () => {
    expect(wordBudget(20, 0)).toBe(0)
    expect(wordBudget(0, 0)).toBe(WORD_BLOCK)
    expect(wordBudget(0, 14)).toBe(1)
    const list = concepts()
    const cards = list.slice(0, 20).map((concept) => ({ ...passed('de-vi', concept.id), due: now.toISOString() }))
    const day = buildDay(list, cards, 'de-vi', now, 'mix')
    expect(day.items.every((item) => !item.isNew)).toBe(true)
    expect(day.items.filter((item) => item.kind === 'word')).toEqual([])
    expect(day.items).toHaveLength(8)
  })

  it('gives each person a separate card and shares the daily cap across directions', () => {
    const introduced = passed('pt-en', 'w.water')
    const today = { ...introduced, elapsed_days: 0, last_review: now.toISOString() }
    const many = Array.from({ length: 15 }, (_, index) => ({ ...today, cardId: `pt-en:w.n${index}` }))
    const day = buildDay(concepts(), many, 'de-vi', now, 'new')
    expect(day.items).toEqual([])
    const mine = buildDay(concepts(), [passed('de-en', 'w.days')], 'de-vi', now, 'new')
    expect(mine.items[0]?.id).toBe('w.days')
  })

  it('picks four meanings from the block', () => {
    const choices = meaningChoices('w.days', ['w.days', 'w.stay', 'w.documents', 'w.evisa'])
    expect(choices).toHaveLength(4)
    expect(choices).toContain('w.days')
    expect(new Set(choices).size).toBe(4)
  })
})
