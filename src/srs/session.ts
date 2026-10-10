import type { Concept } from '../../content/phrase'
import type { StoredCard } from '../storage/types'

export function cardIdFor(pairId: string, conceptId: string): string {
  return `${pairId}:${conceptId}`
}

export function dueConcepts(concepts: Concept[], cards: StoredCard[], pairId: string, now: Date): Concept[] {
  const byId = new Map(cards.map((card) => [card.cardId, card]))
  return concepts.filter((concept) => {
    const card = byId.get(cardIdFor(pairId, concept.id))
    if (!card) return true
    return Date.parse(card.due) <= now.getTime()
  })
}

export function buildSession(concepts: Concept[], cards: StoredCard[], pairId: string, now: Date): Concept[] {
  const byId = new Map(cards.map((card) => [card.cardId, card]))
  const reviews: Concept[] = []
  const fresh: Concept[] = []
  for (const concept of concepts) {
    const card = byId.get(cardIdFor(pairId, concept.id))
    if (!card) fresh.push(concept)
    else if (Date.parse(card.due) <= now.getTime()) reviews.push(concept)
  }
  return [...reviews, ...fresh.slice(0, 8)].slice(0, 12)
}

export function distractorConcepts(correct: Concept, concepts: Concept[], count: number): Concept[] {
  const pool = concepts.filter((concept) => concept.id !== correct.id)
  const copy = [...pool]
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
