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

/** No checked keyword means the sentence is already open. A keyword still has to be passed. */
export function sentenceOpen(conceptId: string, cards: readonly StoredCard[], direction: string): boolean {
  return keywordsOfPassed(conceptId, cards, direction)
}

function keywordsOfPassed(conceptId: string, cards: readonly StoredCard[], direction: string): boolean {
  const keys = keywords(conceptId)
  if (keys.length === 0) return true
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

/** At 20 due cards the new pile is empty: no block and no new sentence. Six words is a day, not a sitting. */
export function wordBudget(dueCount: number, introduced: number, wordsToday = 0): number {
  if (dueCount >= 20) return 0
  const dailyRoom = Math.max(0, DAILY_NEW_CAP - introduced)
  const blockRoom = Math.max(0, WORD_BLOCK - wordsToday)
  return Math.min(blockRoom, dailyRoom)
}

function wordsIntroducedToday(cards: readonly StoredCard[], now: Date): number {
  const ids = new Set(WORDS.map((word) => word.id))
  let count = 0
  for (const card of cards) {
    if (!introducedToday(card, now)) continue
    const id = card.cardId.slice(card.cardId.indexOf(':') + 1)
    if (ids.has(id)) count += 1
  }
  return count
}

/**
 * The next sentences that still have a word with no card.
 * A sentence with no keyword is not a source. A sentence whose words already
 * have cards is not a source either, even while it stays shut.
 */
function wordSourceIds(concepts: readonly { id: string }[], cards: readonly StoredCard[], direction: string, limit: number): string[] {
  if (limit <= 0) return []
  const ids: string[] = []
  for (const concept of concepts) {
    if (cardFor(cards, direction, concept.id)) continue
    const keys = keywords(concept.id)
    if (keys.length === 0) continue
    if (keys.every((word) => cardFor(cards, direction, word.id))) continue
    ids.push(concept.id)
    if (ids.length >= limit) break
  }
  return ids
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

function passedOnDay(card: StoredCard | undefined, now: Date): boolean {
  return wordPassed(card) && card != null && introducedToday(card, now)
}

/** Open, and at least one keyword was passed today. A sentence with no keyword is not in this set. */
function openedByToday(conceptId: string, cards: readonly StoredCard[], direction: string, now: Date): boolean {
  const keys = keywords(conceptId)
  if (keys.length === 0) return false
  if (!keys.every((word) => wordPassed(cardFor(cards, direction, word.id)))) return false
  return keys.some((word) => passedOnDay(cardFor(cards, direction, word.id), now))
}

/** Still shut, but every missing keyword is in the words this sitting will introduce. */
function waitingOnWords(conceptId: string, cards: readonly StoredCard[], direction: string, todayWordIds: ReadonlySet<string>): boolean {
  const keys = keywords(conceptId)
  if (keys.length === 0 || cardFor(cards, direction, conceptId)) return false
  if (keys.every((word) => wordPassed(cardFor(cards, direction, word.id)))) return false
  return keys.every((word) => wordPassed(cardFor(cards, direction, word.id)) || todayWordIds.has(word.id))
}

/**
 * Reviews, then at most six new words for the day, then sentences.
 * Slots go first to sentences whose keywords were passed today.
 * Slots stay free for sentences this sitting's words will open.
 * A sentence with no keyword fills only what remains.
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
  const windowIds = wordSourceIds(concepts, cards, direction, lookAhead)
  const ranked = rankWindow(windowIds, cards, direction)
  const wordsToday = wordsIntroducedToday(cards, now)
  const wordsTaken = Math.min(wordBudget(dueCount, introduced, wordsToday), ranked.length)
  const sentenceSlots = newCardBudget(dueCount, introduced + wordsTaken)
  const wordSlice = ranked.slice(0, wordsTaken).map((word): DayItem => ({ id: word.id, isNew: true, kind: 'word' }))
  const todayWordIds = new Set(wordSlice.map((item) => item.id))
  const openedToday = freshSentences.filter((concept) => openedByToday(concept.id, cards, direction, now))
  const takenToday = openedToday.slice(0, sentenceSlots)
  const reserved = Math.min(
    freshSentences.filter((concept) => waitingOnWords(concept.id, cards, direction, todayWordIds)).length,
    sentenceSlots - takenToday.length,
  )
  const earlier = freshSentences.filter(
    (concept) => keywords(concept.id).length > 0 && keywordsOfPassed(concept.id, cards, direction) && !openedByToday(concept.id, cards, direction, now),
  )
  const keywordFree = freshSentences.filter((concept) => keywords(concept.id).length === 0)
  const sentenceSlice = [...takenToday, ...earlier, ...keywordFree]
    .slice(0, sentenceSlots - reserved)
    .map((concept): DayItem => ({ id: concept.id, isNew: true, kind: 'sentence' }))
  if (kind === 'review') return { items: reviewSlice, sentenceSlots: 0 }
  if (kind === 'new') return { items: [...wordSlice, ...sentenceSlice], sentenceSlots }
  return { items: [...reviewSlice, ...wordSlice, ...sentenceSlice], sentenceSlots }
}

/** Due sentences are already in the queue. They do not spend the slots held for sentences this sitting opens. */
export function newSentenceIds(items: readonly DayItem[]): string[] {
  return items.filter((item) => item.kind === 'sentence' && item.isNew).map((item) => item.id)
}

/** Sentences that became free after a word, still inside the slots fixed at the start. */
export function newlyOpenSentences(
  concepts: readonly { id: string }[],
  cards: readonly StoredCard[],
  direction: string,
  queuedSentenceIds: readonly string[],
  sentenceSlots: number,
  now?: Date,
): string[] {
  const queued = new Set(queuedSentenceIds)
  const open = concepts.filter((concept) => {
    if (queued.has(concept.id) || cardFor(cards, direction, concept.id)) return false
    if (keywords(concept.id).length === 0 || !keywordsOfPassed(concept.id, cards, direction)) return false
    if (now && !openedByToday(concept.id, cards, direction, now)) return false
    return true
  })
  return open.slice(0, Math.max(0, sentenceSlots - queuedSentenceIds.length)).map((concept) => concept.id)
}

/**
 * Four meanings. The block first, then the other checked words, in a stable order.
 * A distractor with the same spoken form as the answer is skipped, so two buttons
 * cannot both be right.
 */
/** Four ids. A pool entry with the same spoken form as the answer is not a choice. */
export function meaningChoiceIds(correctId: string, poolIds: readonly string[], formOf: (id: string) => string | undefined): string[] {
  const correctForm = (formOf(correctId) ?? '').toLocaleLowerCase()
  const others: string[] = []
  for (const id of poolIds) {
    if (id === correctId || others.includes(id)) continue
    const form = formOf(id)
    if (!form) continue
    if (correctForm && form.toLocaleLowerCase() === correctForm) continue
    others.push(id)
    if (others.length === 3) break
  }
  return [correctId, ...others].sort((left, right) => left.localeCompare(right))
}

export function meaningChoices(correctId: string, blockIds: readonly string[], lang: Lang, viRegion: 'south' | 'north'): string[] {
  const pool = [...blockIds, ...WORDS.map((word) => word.id)]
  return meaningChoiceIds(correctId, pool, (id) => {
    const word = wordById(id)
    return word ? spokenCitation(word, lang, viRegion) : undefined
  })
}
