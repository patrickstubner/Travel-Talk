import { describe, expect, it } from 'vitest'
import { State } from 'ts-fsrs'
import { Rating, emptyCard, reviewCard } from '../srs/scheduler'
import { FULL_SPEED_STABILITY, effectiveSpeed, speedPercent, suggestedSpeed, tempoFile } from './speed'

describe('suggested speed', () => {
  it('starts slow and reaches 100 % only for a stable review', () => {
    expect(suggestedSpeed(null)).toBe(0.7)
    expect(suggestedSpeed(undefined)).toBe(0.7)
    expect(suggestedSpeed({ state: State.New, stability: 100 })).toBe(0.7)
    expect(suggestedSpeed({ state: State.Learning, stability: 100 })).toBe(0.7)
    expect(suggestedSpeed({ state: State.Relearning, stability: 100 })).toBe(0.7)
    expect(suggestedSpeed({ state: State.Review, stability: 0 })).toBe(0.85)
    expect(suggestedSpeed({ state: State.Review, stability: FULL_SPEED_STABILITY - 0.01 })).toBe(0.85)
    expect(suggestedSpeed({ state: State.Review, stability: FULL_SPEED_STABILITY })).toBe(1)
    expect(suggestedSpeed({ state: State.Review, stability: 400 })).toBe(1)
  })

  it('steps 70, 85, then 100 across several Good ratings and drops after a lapse', () => {
    const start = new Date('2026-01-01T00:00:00.000Z')
    let card = emptyCard(start)
    expect(suggestedSpeed(card)).toBe(0.7)
    card = reviewCard(card, Rating.Good, start, 0.9, false)
    expect(card.state).toBe(State.Learning)
    expect(suggestedSpeed(card)).toBe(0.7)
    let now = new Date(card.due)
    card = reviewCard(card, Rating.Good, now, 0.9, false)
    expect(card.state).toBe(State.Review)
    expect(card.stability).toBeLessThan(FULL_SPEED_STABILITY)
    expect(suggestedSpeed(card)).toBe(0.85)
    now = new Date(card.due)
    card = reviewCard(card, Rating.Good, now, 0.9, false)
    expect(suggestedSpeed(card)).toBe(0.85)
    now = new Date(card.due)
    card = reviewCard(card, Rating.Good, now, 0.9, false)
    expect(card.stability).toBeGreaterThanOrEqual(FULL_SPEED_STABILITY)
    expect(suggestedSpeed(card)).toBe(1)
    now = new Date(card.due)
    card = reviewCard(card, Rating.Again, now, 0.9, false)
    expect(card.state).toBe(State.Relearning)
    expect(suggestedSpeed(card)).toBe(0.7)
  })

  it('lets a fixed choice override the suggestion, including a well-known card', () => {
    const known = { state: State.Review, stability: 80 }
    expect(effectiveSpeed('auto', null)).toBe(0.7)
    expect(effectiveSpeed('auto', known)).toBe(1)
    expect(effectiveSpeed(0.7, known)).toBe(0.7)
    expect(effectiveSpeed(0.85, null)).toBe(0.85)
    expect(effectiveSpeed(1, null)).toBe(1)
    expect(speedPercent(0.7)).toBe(70)
    expect(speedPercent(0.85)).toBe(85)
    expect(speedPercent(1)).toBe(100)
  })

  it('names the pre-generated file for each step', () => {
    const file = 'vi/emergency.help__any__base.m4a'
    expect(tempoFile(file, 1)).toBe(file)
    expect(tempoFile(file, 0.7)).toBe('vi/emergency.help__any__base.r70.m4a')
    expect(tempoFile(file, 0.85)).toBe('vi/emergency.help__any__base.r85.m4a')
  })
})
