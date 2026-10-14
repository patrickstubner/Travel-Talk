// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { State } from 'ts-fsrs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { de } from '../i18n/dictionary'
import type { StoredCard } from '../storage/types'
import { StudyProgress } from './StudyProgress'

function card(partial: Partial<StoredCard> & Pick<StoredCard, 'cardId'>): StoredCard {
  return {
    due: '2026-10-20T12:00:00.000Z',
    stability: 2,
    difficulty: 5,
    elapsed_days: 4,
    scheduled_days: 1,
    learning_steps: 0,
    reps: 2,
    lapses: 0,
    state: State.Review,
    last_review: new Date(2026, 9, 13, 15, 0, 0).toISOString(),
    ...partial,
  }
}

const today = new Date(2026, 9, 13, 15, 0, 0)

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('study progress', () => {
  it('draws learned, reviewed and kept bars and keeps the explanation on the device', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    render(
      <StudyProgress
        cards={[
          card({ cardId: 'de-vi:meet.hello' }),
          card({ cardId: 'de-vi:w.water', state: State.Learning, elapsed_days: 0, last_review: today.toISOString() }),
        ]}
        copy={de}
        variant="compact"
        lang="de"
        now={today}
      />,
    )
    const learned = screen.getByTestId('study-learned')
    expect(learned.getAttribute('data-sentences')).toBe('1')
    expect(learned.getAttribute('data-words')).toBe('1')
    expect(learned.getAttribute('aria-label')).toBe('1 Satz und 1 Wort gelernt')
    expect((learned.querySelector('.sentences') as HTMLElement).style.width).toBe('50%')
    expect((learned.querySelector('.words') as HTMLElement).style.width).toBe('50%')
    expect(screen.getByTestId('study-reviewed').getAttribute('data-count')).toBe('1')
    expect(screen.getByTestId('study-kept').getAttribute('data-percent')).toBe('50')
    expect(screen.getByTestId('study-progress').getAttribute('data-variant')).toBe('compact')
    expect(screen.getByTestId('study-progress').textContent ?? '').not.toMatch(/Sätze und/)
    fireEvent.click(screen.getByRole('button', { name: 'Was die Balken bedeuten' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog.textContent ?? '').toMatch(/Nichts davon verlässt das Gerät/)
    expect(dialog.textContent ?? '').toMatch(/erste Kontakt/)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('uses the taller layout on the overview', () => {
    render(<StudyProgress cards={[]} copy={de} variant="full" lang="de" now={today} />)
    const view = screen.getByTestId('study-progress')
    expect(view.getAttribute('data-variant')).toBe('full')
    expect(view.classList.contains('full')).toBe(true)
    expect(screen.getByTestId('study-learned').getAttribute('data-sentences')).toBe('0')
    expect(screen.getByTestId('study-kept').getAttribute('data-percent')).toBe('0')
  })
})
