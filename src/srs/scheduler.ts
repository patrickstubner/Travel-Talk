import { createEmptyCard, fsrs, generatorParameters, Rating, type Card, type Grade } from 'ts-fsrs'
import type { StoredCard } from '../storage/types'

export function emptyCard(now: Date): Card {
  return createEmptyCard(now)
}

/** A last review dated after this clock would schedule the card years ahead. Pin it to now. */
export function capReviewedCard(card: Card, now: Date): Card {
  const reviewed = card.last_review
  if (reviewed && reviewed.getTime() > now.getTime()) return { ...card, last_review: new Date(now.getTime()) }
  return card
}

function duesOf(card: Card, now: Date, retention: number): Record<Grade, Date> {
  const scheduler = fsrs(generatorParameters({ request_retention: retention, enable_fuzz: false }))
  const preview = scheduler.repeat(card, now)
  return {
    [Rating.Again]: preview[Rating.Again].card.due,
    [Rating.Hard]: preview[Rating.Hard].card.due,
    [Rating.Good]: preview[Rating.Good].card.due,
    [Rating.Easy]: preview[Rating.Easy].card.due,
  }
}

export function reviewCard(card: Card, grade: Grade, now: Date, retention: number, fuzz: boolean): Card {
  const ready = capReviewedCard(card, now)
  try {
    const scheduler = fsrs(generatorParameters({ request_retention: retention, enable_fuzz: fuzz }))
    return scheduler.next(ready, now, grade).card
  } catch {
    return emptyCard(now)
  }
}

/** Next due date for each button. Fuzz is off so the label matches the stored card. */
export function previewDue(card: Card, now: Date, retention: number): Record<Grade, Date> {
  const ready = capReviewedCard(card, now)
  try {
    return duesOf(ready, now, retention)
  } catch {
    try {
      return duesOf(emptyCard(now), now, retention)
    } catch {
      return {
        [Rating.Again]: now,
        [Rating.Hard]: now,
        [Rating.Good]: now,
        [Rating.Easy]: now,
      }
    }
  }
}

export function toStored(cardId: string, card: Card): StoredCard {
  return {
    cardId,
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review ? card.last_review.toISOString() : null,
  }
}

export function fromStored(stored: StoredCard): Card {
  return {
    due: new Date(stored.due),
    stability: stored.stability,
    difficulty: stored.difficulty,
    elapsed_days: stored.elapsed_days,
    scheduled_days: stored.scheduled_days,
    learning_steps: stored.learning_steps,
    reps: stored.reps,
    lapses: stored.lapses,
    state: stored.state,
    ...(stored.last_review ? { last_review: new Date(stored.last_review) } : {}),
  }
}

export { Rating }
export type { Card, Grade }
