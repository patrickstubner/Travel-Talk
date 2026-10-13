// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { KaraokeLine } from './KaraokeLine'

afterEach(() => {
  cleanup()
})

const links = [
  { target: [3, 4, 5], gloss: [4] },
  { target: [0, 1, 2], gloss: [0] },
]

describe('karaoke line', () => {
  it('marks the linked words on both lines and the word that is playing', () => {
    render(
      <KaraokeLine
        heading
        speech="Làm ơn gọi xe cấp cứu."
        gloss="Rufen Sie bitte einen Krankenwagen."
        links={links}
        times={[
          { start: 0, end: 0.2 },
          { start: 0.2, end: 0.3 },
          { start: 0.3, end: 0.5 },
          { start: 0.5, end: 0.7 },
          { start: 0.7, end: 0.9 },
          { start: 0.9, end: 1.2 },
        ]}
        seconds={0.8}
        note="Die Wortzuordnung ist nicht geprüft."
      />,
    )
    expect(screen.getByRole('heading', { name: 'Làm ơn gọi xe cấp cứu.' })).toBeTruthy()
    expect(screen.getByTestId('word-now').textContent).toBe('cấp')
    fireEvent.click(screen.getByRole('button', { name: 'xe' }))
    expect(screen.getByRole('button', { name: 'xe' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'cấp' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'cứu.' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Krankenwagen.' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Rufen' }).getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(screen.getByRole('button', { name: 'Rufen' }))
    expect(screen.getByRole('button', { name: 'Làm' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Krankenwagen.' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('does not mark a current word when there are no timings', () => {
    render(
      <KaraokeLine
        speech="Help!"
        gloss="Hilfe!"
        links={[{ target: [0], gloss: [0] }]}
        times={null}
        seconds={0.2}
      />,
    )
    expect(screen.queryByTestId('word-now')).toBeNull()
    expect(screen.getByRole('button', { name: 'Help!' }).className).not.toContain('now')
    expect(screen.getByTestId('target-line').tagName).toBe('P')
  })
})
