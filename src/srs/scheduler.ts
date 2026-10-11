import { createEmptyCard, fsrs, generatorParameters, Rating, type Card, type Grade } from 'ts-fsrs'
import type { StoredCard } from '../storage/types'

export function emptyCard(now: Date): Card {
  return createEmptyCard(now)
}

/** A due date further than this past the last review (or now) is capped. About 100 years. */
export const DUE_LIMIT_DAYS = 36_500

const DAY_MS = 86_400_000

/** Keeps `due` when it is already inside the horizon. The anchor is `lastReview`, or `nowMs` when there is none. */
export function capDueIso(due: string, lastReview: string | null, nowMs: number): string {
  const dueMs = Date.parse(due)
  if (!Number.isFinite(dueMs)) return due
  const reviewed = lastReview ? Date.parse(lastReview) : Number.NaN
  const anchor = Number.isFinite(reviewed) ? reviewed : nowMs
  const limit = anchor + DUE_LIMIT_DAYS * DAY_MS
  if (dueMs <= limit) return due
  return new Date(limit).toISOString()
}

function capDueDate(due: Date, lastReview: Date | undefined, now: Date): Date {
  const capped = capDueIso(due.toISOString(), lastReview ? lastReview.toISOString() : null, now.getTime())
  return capped === due.toISOString() ? due : new Date(capped)
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
    const next = scheduler.next(ready, now, grade).card
    return { ...next, due: capDueDate(next.due, next.last_review, now) }
  } catch {
    return emptyCard(now)
  }
}

/** Next due date for each button. Fuzz is off so the label matches the stored card. */
export function previewDue(card: Card, now: Date, retention: number): Record<Grade, Date> {
  const ready = capReviewedCard(card, now)
  try {
    const dues = duesOf(ready, now, retention)
    return {
      [Rating.Again]: capDueDate(dues[Rating.Again], ready.last_review, now),
      [Rating.Hard]: capDueDate(dues[Rating.Hard], ready.last_review, now),
      [Rating.Good]: capDueDate(dues[Rating.Good], ready.last_review, now),
      [Rating.Easy]: capDueDate(dues[Rating.Easy], ready.last_review, now),
    }
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
