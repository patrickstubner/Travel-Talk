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

describe('home onboarding', () => {
  it('enables continue after the app language and the target language at the top', async () => {
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
    fireEvent.change(await screen.findByLabelText('Wie sollen wir dich nennen?'), { target: { value: 'A' } })
    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Deutsch' }))
    fireEvent.click(screen.getByRole('button', { name: /^Sprache, die du lernst/ }))
    const groups = await screen.findAllByRole('group', { name: 'Sprache, die du lernst' })
    fireEvent.click(within(groups[groups.length - 1]!).getByRole('button', { name: 'Vietnamesisch' }))
    const next = await screen.findByRole('button', { name: 'Weiter zu Heute lernen' })
    await waitFor(() => expect((next as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(next)
    expect(await screen.findByRole('heading', { name: 'Heute lernen' })).toBeTruthy()
    expect(screen.queryByTestId('onboarding')).toBeNull()
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
    fireEvent.change(await screen.findByLabelText('Wie sollen wir dich nennen?'), { target: { value: 'A' } })
    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Deutsch' }))
    fireEvent.click(screen.getByRole('button', { name: /^Sprache, die du lernst/ }))
    const groups = await screen.findAllByRole('group', { name: 'Sprache, die du lernst' })
    fireEvent.click(within(groups[groups.length - 1]!).getByRole('button', { name: 'Vietnamesisch' }))
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
