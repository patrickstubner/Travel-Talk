// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import { freshIndexedDb } from '../test-idb'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Shell } from '../app/shell'
import { AppProvider } from '../app/state'
import { DexieProgressRepository } from '../storage/dexie-repository'
import { HomePage } from './Home'

beforeEach(() => {
  freshIndexedDb()
})

afterEach(() => {
  cleanup()
})

function pickIn(board: HTMLElement, group: string, language: string): void {
  fireEvent.click(within(within(board).getByRole('group', { name: group })).getByRole('button', { name: language }))
}

describe('home onboarding', () => {
  it('enables continue after both languages are chosen in the body, then shows them in the header', async () => {
    render(
      <AppProvider>
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<Shell />}>
              <Route index element={<HomePage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AppProvider>,
    )
    expect(await screen.findByTestId('name-ask')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Wie sollen wir dich nennen?'), { target: { value: 'A' } })
    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }))
    const board = await screen.findByTestId('onboarding')
    const groups = within(board).getAllByRole('group')
    expect(groups.map((group) => group.getAttribute('aria-label'))).toEqual(['Sprache der App', 'Sprache, die ich lernen will'])
    expect(within(board).getByText('Deine Sprache. Die Seiten und die Übersetzungen sind darin.')).toBeTruthy()
    expect(within(board).getByText('Die Sprache, die du lernen willst. Das ist nicht die Sprache der Seiten.')).toBeTruthy()
    expect(within(board).queryByText(/oben/)).toBeNull()
    const next = within(board).getByRole('button', { name: 'Weiter zu Heute lernen' })
    expect((next as HTMLButtonElement).disabled).toBe(true)
    pickIn(board, 'Sprache der App', 'Deutsch')
    expect((next as HTMLButtonElement).disabled).toBe(true)
    pickIn(board, 'Sprache, die ich lernen will', 'Deutsch')
    expect((next as HTMLButtonElement).disabled).toBe(true)
    pickIn(board, 'Sprache, die ich lernen will', 'Vietnamesisch')
    await waitFor(() => expect((next as HTMLButtonElement).disabled).toBe(false))
    await waitFor(async () => {
      const saved = await new DexieProgressRepository('travel-talk').load()
      expect(saved.settings.appLang).toBe('de')
      expect(saved.settings.targetLang).toBe('vi')
    })
    fireEvent.click(next)
    expect(await screen.findByRole('heading', { name: 'Heute lernen' })).toBeTruthy()
    expect(screen.queryByTestId('onboarding')).toBeNull()
    expect(screen.getByRole('button', { name: 'Wer lernt?: A' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Sprache, die ich lernen will: Vietnamesisch, Süd, Standard' }).textContent).toBe(
      'Vietnamesisch · Süd, Standard',
    )
  })

  it('stores the default voices when both languages are chosen and the page is left', async () => {
    const tree = (
      <AppProvider>
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<Shell />}>
              <Route index element={<HomePage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AppProvider>
    )
    const first = render(tree)
    expect(await screen.findByTestId('name-ask')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Wie sollen wir dich nennen?'), { target: { value: 'A' } })
    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }))
    const board = await screen.findByTestId('onboarding')
    pickIn(board, 'Sprache der App', 'Deutsch')
    pickIn(board, 'Sprache, die ich lernen will', 'Vietnamesisch')
    await waitFor(() => expect((screen.getByRole('button', { name: 'Weiter zu Heute lernen' }) as HTMLButtonElement).disabled).toBe(false))
    await waitFor(async () => {
      const saved = await new DexieProgressRepository('travel-talk').load()
      expect(saved.settings.voices).toEqual({ de: 'thorsten-high', vi: 'vivos-22' })
      expect(saved.settings.voiceHintSeen).toBe(true)
    })
    first.unmount()
    render(tree)
    expect(await screen.findByRole('heading', { name: 'Heute lernen' })).toBeTruthy()
    expect(screen.queryByTestId('onboarding')).toBeNull()
    expect(screen.queryByText(/Männerstimmen/)).toBeNull()
  })
})
