// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import { freshIndexedDb } from '../test-idb'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Shell } from '../app/shell'
import { AppProvider } from '../app/state'
import { DexieProgressRepository } from '../storage/dexie-repository'
import { defaultSettings } from '../storage/types'
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
    expect(groups.map((group) => group.getAttribute('aria-label'))).toEqual(['Sprache der App', 'Sprache, die du lernen willst'])
    expect(within(board).getByText('Deine Sprache. Die Seiten und die Übersetzungen sind darin.')).toBeTruthy()
    expect(within(board).getByText('Die Sprache, die du lernen willst. Das ist nicht die Sprache der Seiten.')).toBeTruthy()
    expect(within(board).queryByText(/oben/)).toBeNull()
    const next = within(board).getByRole('button', { name: 'Weiter zu Heute lernen' })
    expect((next as HTMLButtonElement).disabled).toBe(true)
    expect(screen.queryByRole('button', { name: /^Sprache, die du lernen willst/ })).toBeNull()
    pickIn(board, 'Sprache der App', 'Deutsch')
    expect((next as HTMLButtonElement).disabled).toBe(true)
    pickIn(board, 'Sprache, die du lernen willst', 'Vietnamesisch')
    await waitFor(() => expect((next as HTMLButtonElement).disabled).toBe(false))
    pickIn(board, 'Sprache, die du lernen willst', 'Deutsch')
    expect((next as HTMLButtonElement).disabled).toBe(true)
    expect(within(within(board).getByRole('group', { name: 'Sprache der App' })).getByRole('button', { name: 'Deutsch' }).getAttribute('aria-pressed')).toBe('true')
    expect(within(within(board).getByRole('group', { name: 'Sprache, die du lernen willst' })).getByRole('button', { name: 'Deutsch' }).getAttribute('aria-pressed')).toBe('true')
    expect(within(board).getByText('Das ist dieselbe Sprache. Wähl eine andere.')).toBeTruthy()
    await waitFor(async () => {
      const saved = await new DexieProgressRepository('travel-talk').load()
      expect(saved.settings.appLang).toBe('de')
      expect(saved.settings.targetLang).not.toBe('vi')
      expect(saved.settings.onboarded).toBe(false)
    })
    pickIn(board, 'Sprache, die du lernen willst', 'Vietnamesisch')
    await waitFor(() => expect((next as HTMLButtonElement).disabled).toBe(false))
    await waitFor(async () => {
      const saved = await new DexieProgressRepository('travel-talk').load()
      expect(saved.settings.appLang).toBe('de')
      expect(saved.settings.targetLang).toBe('vi')
      expect(saved.settings.onboarded).toBe(false)
    })
    expect(screen.queryByRole('button', { name: /^Sprache, die du lernen willst/ })).toBeNull()
    fireEvent.click(next)
    expect(await screen.findByRole('heading', { name: 'Heute lernen' })).toBeTruthy()
    expect(screen.queryByTestId('onboarding')).toBeNull()
    expect(screen.getByRole('button', { name: 'Wer lernt?: A' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Sprache, die du lernen willst: Vietnamesisch, Süd, Standard' }).textContent).toBe(
      'Vietnamesisch · Süd, Standard',
    )
  })

  it('keeps onboarding across a reload until Continue, and stores the default voices', async () => {
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
    pickIn(board, 'Sprache, die du lernen willst', 'Vietnamesisch')
    await waitFor(() => expect((screen.getByRole('button', { name: 'Weiter zu Heute lernen' }) as HTMLButtonElement).disabled).toBe(false))
    await waitFor(async () => {
      const saved = await new DexieProgressRepository('travel-talk').load()
      expect(saved.settings.voices).toEqual({ de: 'thorsten-high', vi: 'vivos-22' })
      expect(saved.settings.voiceHintSeen).toBe(true)
      expect(saved.settings.onboarded).toBe(false)
    })
    first.unmount()
    render(tree)
    const again = await screen.findByTestId('onboarding')
    expect(screen.queryByRole('heading', { name: 'Heute lernen' })).toBeNull()
    const resume = within(again).getByRole('button', { name: 'Weiter zu Heute lernen' })
    await waitFor(() => expect((resume as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(resume)
    expect(await screen.findByRole('heading', { name: 'Heute lernen' })).toBeTruthy()
    expect(screen.queryByTestId('onboarding')).toBeNull()
    await waitFor(async () => {
      const saved = await new DexieProgressRepository('travel-talk').load()
      expect(saved.settings.onboarded).toBe(true)
    })
    cleanup()
    render(tree)
    expect(await screen.findByRole('heading', { name: 'Heute lernen' })).toBeTruthy()
    expect(screen.queryByTestId('onboarding')).toBeNull()
    expect(screen.queryByText(/Männerstimmen/)).toBeNull()
  })

  it('treats an older person with both languages and no flag as already onboarded', async () => {
    const repo = new DexieProgressRepository('travel-talk')
    const id = (await repo.load()).activePersonId ?? ''
    await repo.renamePerson(id, 'A')
    await repo.saveSettings(id, { ...defaultSettings, appLang: 'de', targetLang: 'vi' })
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
    expect(await screen.findByRole('heading', { name: 'Heute lernen' })).toBeTruthy()
    expect(screen.queryByTestId('onboarding')).toBeNull()
    expect(screen.getByRole('button', { name: /Sprache, die du lernen willst: Vietnamesisch/ })).toBeTruthy()
  })
})
