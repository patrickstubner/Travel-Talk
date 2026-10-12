import type { Lang } from '../../content/phrase'
import { spokenCitation, WORDS, wordById, type WordEntry } from '../../content/words'
import type { StoredCard } from '../storage/types'
import { DAILY_NEW_CAP, cardIdFor, introducedToday, isDueCard, newCardBudget, type SessionKind } from './session'

/** A word is a tap. Six fit beside the four new sentences, and both stay under the daily 15. */
export const WORD_BLOCK = 6

export type DayItem = { id: string; isNew: boolean; kind: 'word' | 'sentence' }

export type DayPlan = {
  items: DayItem[]
  /** New sentences that may join after a word in this sitting, including ones already queued. */
  sentenceSlots: number
}

/**
 * «Gut» stays in learning with `learning_steps` 1. «Leicht» is already a review.
 * A later miss during that first learning step asks for the word again.
 * Review and relearning stay open: the word was right once.
 */
export function wordPassed(card: StoredCard | undefined): boolean {
  if (!card || card.reps < 1) return false
  if (card.state === 2 || card.state === 3) return true
  return card.learning_steps >= 1
}

function cardFor(cards: readonly StoredCard[], direction: string, id: string): StoredCard | undefined {
  const cardId = cardIdFor(direction, id)
  return cards.find((card) => card.cardId === cardId)
}

/** A sentence with no checked keyword stays shut. Unchecked gloss is not a key. */
export function sentenceOpen(conceptId: string, cards: readonly StoredCard[], direction: string): boolean {
  return keywordsOfPassed(conceptId, cards, direction)
}

function keywordsOfPassed(conceptId: string, cards: readonly StoredCard[], direction: string): boolean {
  const keys = keywords(conceptId)
  if (keys.length === 0) return false
  return keys.every((word) => wordPassed(cardFor(cards, direction, word.id)))
}

function keywords(conceptId: string): WordEntry[] {
  return WORDS.filter((word) => word.sentences.includes(conceptId))
}

export function missingKeyword(conceptId: string, cards: readonly StoredCard[], direction: string, app: Lang, viRegion: 'south' | 'north'): string | null {
  const missing = keywords(conceptId).find((word) => !wordPassed(cardFor(cards, direction, word.id)))
  if (!missing) return null
  return spokenCitation(missing, app, viRegion)
}

function introducedCount(cards: readonly StoredCard[], now: Date): number {
  let introduced = 0
  for (const card of cards) {
    if (introducedToday(card, now)) introduced += 1
  }
  return introduced
}

function dueCountOf(concepts: readonly { id: string }[], cards: readonly StoredCard[], direction: string, now: Date): number {
  let due = 0
  for (const word of WORDS) {
    if (isDueCard(cardFor(cards, direction, word.id), now)) due += 1
  }
  for (const concept of concepts) {
    if (isDueCard(cardFor(cards, direction, concept.id), now)) due += 1
  }
  return due
}

/** At 20 due cards the new pile is empty: no block and no new sentence. */
export function wordBudget(dueCount: number, introduced: number): number {
  if (dueCount >= 20) return 0
  return Math.min(WORD_BLOCK, Math.max(0, DAILY_NEW_CAP - introduced))
}

function rankWindow(windowIds: readonly string[], cards: readonly StoredCard[], direction: string): WordEntry[] {
  const wanted = new Set(windowIds)
  const fresh = WORDS.filter((word) => word.sentences.some((id) => wanted.has(id)) && !cardFor(cards, direction, word.id))
  fresh.sort((left, right) => {
    if (left.hand !== right.hand) return left.hand ? -1 : 1
    const leftCount = left.sentences.filter((id) => wanted.has(id)).length
    const rightCount = right.sentences.filter((id) => wanted.has(id)).length
    if (leftCount !== rightCount) return rightCount - leftCount
    const leftAt = windowIds.findIndex((id) => left.sentences.includes(id))
    const rightAt = windowIds.findIndex((id) => right.sentences.includes(id))
    return leftAt - rightAt || left.id.localeCompare(right.id)
  })
  return fresh
}

/**
 * Reviews, then at most six new words from the sentences this day would open,
 * then the sentences whose keywords were already «Gut» or «Leicht».
 */
export function buildDay(
  concepts: readonly { id: string }[],
  cards: readonly StoredCard[],
  direction: string,
  now: Date,
  kind: SessionKind = 'mix',
): DayPlan {
  const introduced = introducedCount(cards, now)
  const dueCount = dueCountOf(concepts, cards, direction, now)
  const reviews: DayItem[] = []
  for (const word of WORDS) {
    const card = cardFor(cards, direction, word.id)
    if (isDueCard(card, now)) reviews.push({ id: word.id, isNew: false, kind: 'word' })
  }
  for (const concept of concepts) {
    if (isDueCard(cardFor(cards, direction, concept.id), now)) reviews.push({ id: concept.id, isNew: false, kind: 'sentence' })
  }
  const reviewSlice = reviews.slice(0, 8)
  const freshSentences = concepts.filter((concept) => !cardFor(cards, direction, concept.id))
  const lookAhead = newCardBudget(dueCount, introduced)
  const windowIds = freshSentences.slice(0, Math.max(lookAhead, 0)).map((concept) => concept.id)
  const ranked = rankWindow(windowIds, cards, direction)
  const wordsTaken = Math.min(wordBudget(dueCount, introduced), ranked.length)
  const sentenceSlots = newCardBudget(dueCount, introduced + wordsTaken)
  const wordSlice = ranked.slice(0, wordsTaken).map((word): DayItem => ({ id: word.id, isNew: true, kind: 'word' }))
  const sentenceSlice = freshSentences
    .filter((concept) => keywordsOfPassed(concept.id, cards, direction))
    .slice(0, sentenceSlots)
    .map((concept): DayItem => ({ id: concept.id, isNew: true, kind: 'sentence' }))
  if (kind === 'review') return { items: reviewSlice, sentenceSlots: 0 }
  if (kind === 'new') return { items: [...wordSlice, ...sentenceSlice], sentenceSlots }
  return { items: [...reviewSlice, ...wordSlice, ...sentenceSlice], sentenceSlots }
}

/** Sentences that became free after a word, still inside the slots fixed at the start. */
export function newlyOpenSentences(
  concepts: readonly { id: string }[],
  cards: readonly StoredCard[],
  direction: string,
  queuedSentenceIds: readonly string[],
  sentenceSlots: number,
): string[] {
  const queued = new Set(queuedSentenceIds)
  const open = concepts.filter(
    (concept) => !queued.has(concept.id) && !cardFor(cards, direction, concept.id) && keywordsOfPassed(concept.id, cards, direction),
  )
  return open.slice(0, Math.max(0, sentenceSlots - queuedSentenceIds.length)).map((concept) => concept.id)
}

/** Four meanings. The block first, then the other checked words, in a stable order. */
export function meaningChoices(correctId: string, blockIds: readonly string[]): string[] {
  const pool = [...blockIds, ...WORDS.map((word) => word.id)]
  const others: string[] = []
  for (const id of pool) {
    if (id === correctId || others.includes(id) || !wordById(id)) continue
    others.push(id)
    if (others.length === 3) break
  }
  return [correctId, ...others].sort((left, right) => left.localeCompare(right))
}
