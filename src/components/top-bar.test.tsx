// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import { freshIndexedDb } from '../test-idb'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Shell } from '../app/shell'
import { AppContext, AppProvider } from '../app/state'
import { defaultSettings, LEVEL_PLACEHOLDER, type PersonRecord } from '../storage/types'
import { SettingsPage } from '../pages/Settings'
import { TopBar, withTarget } from './TopBar'

beforeEach(() => {
  freshIndexedDb()
})

afterEach(() => {
  cleanup()
})

function person(id: string, name: string): PersonRecord {
  return {
    id,
    name,
    level: LEVEL_PLACEHOLDER,
    settings: { ...defaultSettings, appLang: 'de', targetLang: 'en' },
  }
}

describe('top bar', () => {
  it('moves the previous target into the other learning languages', () => {
    const start = { ...defaultSettings, appLang: 'de' as const, targetLang: 'vi' as const }
    const next = withTarget(start, 'en')
    expect(next.targetLang).toBe('en')
    expect(next.appLang).toBe('de')
    expect(next.moreTargets).toEqual(['vi'])
    const swapped = withTarget(next, 'de')
    expect(swapped.appLang).toBe('en')
    expect(swapped.targetLang).toBe('de')
    expect(swapped.moreTargets).toEqual(['vi'])
  })

  it('shows the person and the target language, and switches both in place', async () => {
    render(
      <AppProvider>
        <TopBar />
        <SettingsPage />
      </AppProvider>,
    )
    const ask = await screen.findByRole('button', { name: /^Wer lernt\?/ })
    const language = screen.getByRole('button', { name: /^Sprache, die du lernst/ })
    expect(ask.compareDocumentPosition(language) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.queryByRole('group', { name: 'Sprache, die du lernst' })).toBeNull()
    fireEvent.click(ask)
    const name = await screen.findByLabelText('Wie sollen wir dich nennen?')
    await waitFor(() => expect(document.activeElement).toBe(name))
    fireEvent.change(name, { target: { value: 'A' } })
    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }))
    const named = await screen.findByRole('button', { name: 'Wer lernt?: A' })
    fireEvent.click(language)
    const groups = await screen.findAllByRole('group', { name: 'Sprache, die du lernst' })
    fireEvent.click(within(groups[groups.length - 1]!).getByRole('button', { name: 'Vietnamesisch' }))
    const learning = await screen.findByRole('button', { name: 'Sprache, die du lernst: Vietnamesisch, Süd, Standard' })
    expect(learning.textContent).toBe('Vietnamesisch · Süd, Standard')
    fireEvent.click(learning)
    const region = await screen.findByRole('group', { name: 'Vietnamesisch' })
    fireEvent.click(within(region).getByRole('button', { name: 'Nord, Variante' }))
    expect(screen.getByRole('button', { name: 'Sprache, die du lernst: Vietnamesisch, Nord, Variante' }).textContent).toBe(
      'Vietnamesisch · Nord, Variante',
    )
    fireEvent.click(named)
    fireEvent.change(screen.getByLabelText('Person hinzufügen'), { target: { value: 'B' } })
    fireEvent.click(screen.getByRole('button', { name: 'Person hinzufügen' }))
    const second = await screen.findByRole('button', { name: 'Wer lernt?: B' })
    expect(screen.getByRole('button', { name: /^Sprache, die du lernst: Sprache, die du lernst/ })).toBeTruthy()
    fireEvent.click(second)
    fireEvent.click(screen.getByRole('button', { name: (value) => value === 'A' }))
    await screen.findByRole('button', { name: 'Wer lernt?: A' })
    expect(screen.getByRole('button', { name: /Vietnamesisch, Nord, Variante/ }).textContent).toBe('Vietnamesisch · Nord, Variante')
    fireEvent.click(screen.getByRole('button', { name: 'Wer lernt?: A' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Wer lernt?: A' }))
    })
    expect(screen.queryByRole('group', { name: 'Wer lernt?' })).toBeNull()
  })

  it('asks before deleting and hides the add form at ten people', async () => {
    render(
      <AppProvider>
        <TopBar />
      </AppProvider>,
    )
    fireEvent.click(await screen.findByRole('button', { name: /^Wer lernt\?/ }))
    fireEvent.change(await screen.findByLabelText('Wie sollen wir dich nennen?'), { target: { value: 'A' } })
    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Wer lernt?: A' }))
    fireEvent.change(screen.getByLabelText('Person hinzufügen'), { target: { value: 'B' } })
    fireEvent.click(screen.getByRole('button', { name: 'Person hinzufügen' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Wer lernt?: B' }))
    fireEvent.click(screen.getByRole('button', { name: 'Person löschen' }))
    expect(
      screen.getByText(
        'Der Lernstand dieser Person wird gelöscht. Die anderen Personen bleiben. Stimmen und Audiodateien bleiben auf dem Gerät.',
      ),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Wer lernt?: B' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Person löschen' }))
    await screen.findByRole('button', { name: 'Wer lernt?: A' })

    const people = Array.from({ length: 10 }, (_, index) => person(`p${index}`, String.fromCharCode(65 + index)))
    cleanup()
    render(
      <AppContext.Provider
        value={{
          catalog: null,
          catalogOk: true,
          snapshot: { settings: people[0]!.settings, cards: [], people, activePersonId: 'p0' },
          storageError: false,
          saveSettings: async () => undefined,
          saveCard: async () => undefined,
          replaceAll: async () => undefined,
          addPerson: async () => false,
          renamePerson: async () => false,
          deletePerson: async () => undefined,
          switchPerson: async () => undefined,
          importPerson: async () => 'ok',
          importAll: async () => undefined,
          everyone: async () => [],
        }}
      >
        <TopBar />
      </AppContext.Provider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Wer lernt?: A' }))
    expect(screen.getByText('Zehn Personen. Mehr geht auf diesem Gerät nicht.')).toBeTruthy()
    expect(screen.queryByTestId('add-person')).toBeNull()
  })

  it('blocks the pages until the only name field in the top bar is filled', async () => {
    render(
      <AppProvider>
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<Shell />}>
              <Route index element={<p>heute</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AppProvider>,
    )
    expect(await screen.findByTestId('name-ask')).toBeTruthy()
    expect(screen.queryByText('heute')).toBeNull()
    const field = await screen.findByLabelText('Wie sollen wir dich nennen?')
    fireEvent.change(field, { target: { value: 'A' } })
    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }))
    expect(await screen.findByText('heute')).toBeTruthy()
    expect(screen.queryByTestId('name-ask')).toBeNull()
  })
})
