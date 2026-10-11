import type { Concept, Lang } from '../../content/phrase'
import { pickRealization } from '../content/resolve'
import { directionId } from '../domain/direction'
import type { Catalog } from '../domain/schema'
import type { StoredCard } from '../storage/types'

export const DAILY_NEW_CAP = 15
export const SESSION_NEW = 4
export const SESSION_REVIEW_CAP = 8

export type SessionKind = 'mix' | 'review' | 'new'
export type SessionItem = { id: string; isNew: boolean }
export type LearnStep = 'slow' | 'normal' | 'repeat' | 'understand' | 'recall' | 'rate'

export function cardIdFor(direction: string, conceptId: string): string {
  return `${direction}:${conceptId}`
}

export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** A card with no stored row is unknown, not due. */
export function isDueCard(card: StoredCard | undefined, now: Date): boolean {
  if (!card) return false
  return Date.parse(card.due) <= now.getTime()
}

/**
 * Introduced today: the first review landed on this calendar day.
 * A later review of an older card has elapsed_days above 0.
 */
export function introducedToday(card: StoredCard, now: Date): boolean {
  if (!card.last_review || card.reps < 1 || card.elapsed_days !== 0) return false
  return dayKey(new Date(card.last_review)) === dayKey(now)
}

/** At most four new phrases in a session, and at most 15 in a day. Fewer when reviews pile up. */
export function newCardBudget(dueCount: number, introduced: number): number {
  const room = Math.max(0, DAILY_NEW_CAP - introduced)
  let take = SESSION_NEW
  if (dueCount >= 20) take = 0
  else if (dueCount >= 12) take = 1
  else if (dueCount >= 8) take = 2
  return Math.min(take, room)
}

/** Rating sits on the recall screen, so it is not a separate step in the queue. */
export function stepsFor(isNew: boolean): LearnStep[] {
  if (isNew) return ['slow', 'normal', 'repeat', 'understand', 'recall']
  return ['understand', 'recall']
}

/**
 * New phrases keep the target script visible while the audio plays.
 * A later listening check may hide it until the answer, then shows it at once.
 * Saying it yourself hides the script until the solution.
 */
export function targetTextVisible(step: LearnStep, isNew: boolean, answered: boolean): boolean {
  if (step === 'slow' || step === 'normal' || step === 'repeat') return true
  if (step === 'understand') return isNew || answered
  if (step === 'recall') return answered
  return true
}

export function usableConcepts(concepts: readonly Concept[], app: Lang, target: Lang, viRegion: 'south' | 'north'): Concept[] {
  return concepts.filter((concept) => pickRealization(concept, app, viRegion) && pickRealization(concept, target, viRegion))
}

export function orderedConcepts(catalog: Catalog): Concept[] {
  const order = new Map(catalog.situations.map((situation) => [situation.id, situation.order]))
  return catalog.concepts.slice().sort((a, b) => {
    const left = Math.min(...a.situationIds.map((id) => order.get(id) ?? 99))
    const right = Math.min(...b.situationIds.map((id) => order.get(id) ?? 99))
    return left - right || a.priority - b.priority || a.id.localeCompare(b.id)
  })
}

function cardsFor(cards: readonly StoredCard[], direction: string): Map<string, StoredCard> {
  const map = new Map<string, StoredCard>()
  for (const card of cards) {
    if (card.cardId.startsWith(`${direction}:`)) map.set(card.cardId, card)
  }
  return map
}

export function dueConcepts(concepts: readonly { id: string }[], cards: readonly StoredCard[], direction: string, now: Date): { id: string }[] {
  const byId = cardsFor(cards, direction)
  return concepts.filter((concept) => isDueCard(byId.get(cardIdFor(direction, concept.id)), now))
}

export function buildSession(
  concepts: readonly { id: string }[],
  cards: readonly StoredCard[],
  direction: string,
  now: Date,
  kind: SessionKind = 'mix',
): SessionItem[] {
  const byId = cardsFor(cards, direction)
  const reviews: SessionItem[] = []
  const fresh: SessionItem[] = []
  let introduced = 0
  for (const card of byId.values()) {
    if (introducedToday(card, now)) introduced += 1
  }
  for (const concept of concepts) {
    const card = byId.get(cardIdFor(direction, concept.id))
    if (!card) fresh.push({ id: concept.id, isNew: true })
    else if (isDueCard(card, now)) reviews.push({ id: concept.id, isNew: false })
  }
  const dueCount = reviews.length
  const budget = newCardBudget(dueCount, introduced)
  const reviewSlice = reviews.slice(0, SESSION_REVIEW_CAP)
  const newSlice = fresh.slice(0, budget)
  if (kind === 'review') return reviewSlice
  if (kind === 'new') return newSlice
  return [...reviewSlice, ...newSlice]
}

export function sessionCanDo(catalog: Catalog, conceptIds: readonly string[], lang: Lang): string {
  const counts = new Map<string, number>()
  for (const id of conceptIds) {
    const concept = catalog.concepts.find((item) => item.id === id)
    const situationId = concept?.situationIds[0]
    if (!situationId) continue
    counts.set(situationId, (counts.get(situationId) ?? 0) + 1)
  }
  let best = ''
  let highest = 0
  for (const [id, count] of counts) {
    if (count > highest) {
      best = id
      highest = count
    }
  }
  return catalog.situations.find((situation) => situation.id === best)?.canDo[lang] ?? ''
}

export function gapLabel(due: Date, now: Date): { kind: 'minutes' | 'hours' | 'days' | 'tomorrow'; count: number } {
  const minutes = Math.max(1, Math.round((due.getTime() - now.getTime()) / 60_000))
  if (minutes < 90) return { kind: 'minutes', count: minutes }
  const hours = Math.max(1, Math.round(minutes / 60))
  if (hours < 20) return { kind: 'hours', count: hours }
  const days = Math.max(1, Math.round(hours / 24))
  if (days <= 1) return { kind: 'tomorrow', count: 1 }
  return { kind: 'days', count: days }
}

export function currentDirection(app: Lang | null, target: Lang | null): string | null {
  if (!app || !target) return null
  return directionId(app, target)
}

export function distractorConcepts(correctId: string, concepts: readonly { id: string }[], count: number): { id: string }[] {
  const copy = concepts.filter((concept) => concept.id !== correctId)
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const left = copy[i]
    const right = copy[j]
    if (left && right) {
      copy[i] = right
      copy[j] = left
    }
  }
  return copy.slice(0, count)
}
