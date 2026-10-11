import { createEmptyCard, fsrs, generatorParameters, Rating, type Card, type Grade } from 'ts-fsrs'
import type { StoredCard } from '../storage/types'

export function emptyCard(now: Date): Card {
  return createEmptyCard(now)
}

/** A clock set back, or a last review dated after the import, must not reach FSRS as a negative gap. */
export function schedulingNow(card: Card, now: Date): Date {
  const reviewed = card.last_review
  if (reviewed && reviewed.getTime() > now.getTime()) return new Date(reviewed.getTime())
  return now
}

function later(when: Date): Date {
  return new Date(when.getTime() + 86_400_000)
}

function fallbackCard(card: Card, when: Date): Card {
  return { ...card, due: later(when), last_review: when }
}

export function reviewCard(card: Card, grade: Grade, now: Date, retention: number, fuzz: boolean): Card {
  const when = schedulingNow(card, now)
  try {
    const scheduler = fsrs(generatorParameters({ request_retention: retention, enable_fuzz: fuzz }))
    return scheduler.next(card, when, grade).card
  } catch {
    return fallbackCard(card, when)
  }
}

/** Next due date for each button. Fuzz is off so the label matches the stored card. */
export function previewDue(card: Card, now: Date, retention: number): Record<Grade, Date> {
  const when = schedulingNow(card, now)
  try {
    const scheduler = fsrs(generatorParameters({ request_retention: retention, enable_fuzz: false }))
    const preview = scheduler.repeat(card, when)
    return {
      [Rating.Again]: preview[Rating.Again].card.due,
      [Rating.Hard]: preview[Rating.Hard].card.due,
      [Rating.Good]: preview[Rating.Good].card.due,
      [Rating.Easy]: preview[Rating.Easy].card.due,
    }
  } catch {
    const due = later(when)
    return {
      [Rating.Again]: due,
      [Rating.Hard]: due,
      [Rating.Good]: due,
      [Rating.Easy]: due,
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
