// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { InfoButton } from './InfoButton'
import { playClip } from '../audio/player'

vi.mock('../audio/player', () => ({
  playClip: vi.fn(async (_file: string, _speech: string, _lang: string, _rate: number, onEnd?: () => void) => {
    onEnd?.()
    return 'file'
  }),
  stopClip: vi.fn(),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function renderInfo(): void {
  render(
    <InfoButton
      label="Erklärungen zum Satz"
      title="Zum Satz"
      closeLabel="Schliessen"
      readLabel="Vorlesen"
      stopLabel="Stopp"
      lang="de"
      parts={[{ text: 'Das Mikrofon bleibt auf diesem Gerät.', clip: 'de/help/ui.mic__any__base.m4a' }]}
    />,
  )
}

describe('info button', () => {
  it('keeps the explanation behind the button until it is opened', () => {
    renderInfo()
    const button = screen.getByRole('button', { name: 'Erklärungen zum Satz' })
    expect(button.getAttribute('aria-haspopup')).toBe('dialog')
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByText('Das Mikrofon bleibt auf diesem Gerät.')).toBeNull()
    fireEvent.click(button)
    const dialog = screen.getByRole('dialog')
    expect(dialog.textContent).toContain('Das Mikrofon bleibt auf diesem Gerät.')
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Schliessen' }))
    fireEvent.mouseDown(screen.getByTestId('info-backdrop'))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('closes on Escape and reads the explanation from the bundled clip', async () => {
    renderInfo()
    fireEvent.click(screen.getByRole('button', { name: 'Erklärungen zum Satz' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Erklärungen zum Satz' }))
    fireEvent.click(screen.getByRole('button', { name: 'Vorlesen' }))
    expect(vi.mocked(playClip).mock.calls[0]?.[0]).toBe('de/help/ui.mic__any__base.m4a')
    expect(await screen.findByRole('button', { name: 'Vorlesen' })).toBeTruthy()
  })

  it('leaves Stopp when the clip is paused or another sound takes over', async () => {
    vi.mocked(playClip).mockImplementation(async (_file, _speech, _lang, _rate, _onEnd, _onTime, _onDuration, onStop) => {
      const stop = onStop as (() => void) | undefined
      stop?.()
      return 'file'
    })
    renderInfo()
    fireEvent.click(screen.getByRole('button', { name: 'Erklärungen zum Satz' }))
    fireEvent.click(screen.getByRole('button', { name: 'Vorlesen' }))
    expect(await screen.findByRole('button', { name: 'Vorlesen' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Stopp' })).toBeNull()
  })
})
