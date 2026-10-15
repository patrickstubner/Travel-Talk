// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import { freshIndexedDb } from '../test-idb'
import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as offline from '../audio/offline'
import { Shell } from '../app/shell'
import { AppContext, AppProvider } from '../app/state'
import { DexieProgressRepository } from '../storage/dexie-repository'
import { defaultSettings, LEVEL_PLACEHOLDER, type PersonRecord, type ProgressSnapshot } from '../storage/types'
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
    const language = screen.getByRole('button', { name: /^Sprache, die du lernen willst/ })
    expect(ask.compareDocumentPosition(language) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.queryByRole('group', { name: 'Sprache, die du lernen willst' })).toBeNull()
    fireEvent.click(ask)
    await screen.findByText(/Eine von zehn/)
    const name = screen.getByLabelText('Wie sollen wir dich nennen?')
    await waitFor(() => expect(document.activeElement).toBe(name))
    fireEvent.change(name, { target: { value: 'A' } })
    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }))
    const named = await screen.findByRole('button', { name: 'Wer lernt?: A' })
    expect(named.querySelector('bdi')?.textContent).toBe('A')
    fireEvent.click(language)
    const groups = await screen.findAllByRole('group', { name: 'Sprache, die du lernen willst' })
    fireEvent.click(within(groups[groups.length - 1]!).getByRole('button', { name: 'Vietnamesisch' }))
    const learning = await screen.findByRole('button', { name: 'Sprache, die du lernen willst: Vietnamesisch, Süd, Standard' })
    expect(learning.textContent).toBe('Vietnamesisch · Süd, Standard')
    fireEvent.click(learning)
    const region = await screen.findByRole('group', { name: 'Vietnamesisch' })
    fireEvent.click(within(region).getByRole('button', { name: 'Nord, Variante' }))
    expect(screen.getByRole('button', { name: 'Sprache, die du lernen willst: Vietnamesisch, Nord, Variante' }).textContent).toBe(
      'Vietnamesisch · Nord, Variante',
    )
    fireEvent.click(named)
    fireEvent.change(screen.getByLabelText('Person hinzufügen'), { target: { value: 'B' } })
    fireEvent.click(screen.getByRole('button', { name: 'Person hinzufügen' }))
    const second = await screen.findByRole('button', { name: 'Wer lernt?: B' })
    expect(screen.getByRole('button', { name: 'Sprache, die du lernen willst: nicht gewählt' }).textContent).toBe('nicht gewählt')
    fireEvent.click(second)
    const listed = screen.getByRole('button', { name: (value) => value === 'A' })
    expect(listed.querySelector('bdi')?.textContent).toBe('A')
    fireEvent.click(listed)
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
    await screen.findByText(/Eine von zehn/)
    fireEvent.change(screen.getByLabelText('Wie sollen wir dich nennen?'), { target: { value: 'A' } })
    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Wer lernt?: A' }))
    fireEvent.change(screen.getByLabelText('Person hinzufügen'), { target: { value: 'B' } })
    fireEvent.click(screen.getByRole('button', { name: 'Person hinzufügen' }))
    const forget = vi.spyOn(offline, 'forgetVoiceIfUnused').mockResolvedValue(undefined)
    fireEvent.click(await screen.findByRole('button', { name: 'Wer lernt?: B' }))
    fireEvent.click(screen.getByRole('button', { name: 'Person löschen' }))
    expect(
      screen.getByText(
        'Der Lernstand dieser Person wird gelöscht. Die anderen Personen bleiben. Eine Stimme, die niemand mehr benutzt, wird aus dem Offline-Speicher genommen.',
      ),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Wer lernt?: B' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Person löschen' }))
    await screen.findByRole('button', { name: 'Wer lernt?: A' })
    await waitFor(() => expect(forget).toHaveBeenCalled())
    forget.mockRestore()

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
    await screen.findByText(/Eine von zehn/)
    const field = screen.getByLabelText('Wie sollen wir dich nennen?')
    fireEvent.change(field, { target: { value: 'A' } })
    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }))
    expect(await screen.findByText('heute')).toBeTruthy()
    expect(screen.queryByTestId('name-ask')).toBeNull()
  })

  it('hides the person name in show mode and ignores a second add while the first is saving', async () => {
    const repo = new DexieProgressRepository('travel-talk')
    const id = (await repo.load()).activePersonId ?? ''
    await repo.renamePerson(id, 'A')
    await repo.saveSettings(id, { ...defaultSettings, appLang: 'de', targetLang: 'vi' })
    render(
      <AppProvider>
        <MemoryRouter initialEntries={['/show']}>
          <Routes>
            <Route path="/" element={<Shell />}>
              <Route path="show" element={<p>zeigen</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AppProvider>,
    )
    expect(await screen.findByText('zeigen')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Wer lernt\?: A/ })).toBeNull()
    expect(screen.getByRole('button', { name: /Sprache, die du lernen willst/ })).toBeTruthy()
    cleanup()

    let release: (value: boolean) => void = () => undefined
    const addPerson = vi.fn(() => new Promise<boolean>((resolve) => {
      release = resolve
    }))
    const people = [person('p0', 'A')]
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
          addPerson,
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
    fireEvent.change(screen.getByLabelText('Person hinzufügen'), { target: { value: '\u3164' } })
    fireEvent.click(screen.getByRole('button', { name: 'Person hinzufügen' }))
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Der Name braucht ein sichtbares Zeichen.')
    expect(screen.queryByText('Die Datei ist kein gültiger Travel-Talk-Export.')).toBeNull()
    expect(addPerson).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Person hinzufügen'), { target: { value: 'B' } })
    const add = screen.getByRole('button', { name: 'Person hinzufügen' })
    fireEvent.click(add)
    fireEvent.click(add)
    expect(addPerson).toHaveBeenCalledTimes(1)
    expect((add as HTMLButtonElement).disabled).toBe(true)
    release(true)
    await waitFor(() => expect(screen.queryByLabelText('Person hinzufügen')).toBeNull())
  })

  it('does not ask for a first name before a person is loaded', () => {
    render(
      <AppContext.Provider
        value={{
          catalog: null,
          catalogOk: true,
          snapshot: null,
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
        <TopBar askName />
      </AppContext.Provider>,
    )
    expect(screen.queryByLabelText('Wie sollen wir dich nennen?')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Weiter' })).toBeNull()
  })

  it('keeps text typed before the mount effect ran', async () => {
    const previous = (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false
    const calls: [string, string][] = []
    const p1 = person('p1', '')
    function Host() {
      const [snapshot, setSnapshot] = useState<ProgressSnapshot | null>(null)
      useEffect(() => {
        void Promise.resolve().then(() => setSnapshot({ settings: p1.settings, cards: [], people: [p1], activePersonId: 'p1' }))
      }, [])
      return (
        <AppContext.Provider
          value={{
            catalog: null,
            catalogOk: true,
            snapshot,
            storageError: false,
            saveSettings: async () => undefined,
            saveCard: async () => undefined,
            replaceAll: async () => undefined,
            addPerson: async () => false,
            renamePerson: async (id: string, name: string) => {
              calls.push([id, name])
              return true
            },
            deletePerson: async () => undefined,
            switchPerson: async () => undefined,
            importPerson: async () => 'ok',
            importAll: async () => undefined,
            everyone: async () => [],
          }}
        >
          {snapshot ? <TopBar askName /> : <p>laden</p>}
        </AppContext.Provider>
      )
    }
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    try {
      const typed = new Promise<void>((resolve) => {
        const observer = new MutationObserver(() => {
          const input = host.querySelector('input')
          if (!input) return
          observer.disconnect()
          const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
          setter?.call(input, 'A')
          input.dispatchEvent(new Event('input', { bubbles: true }))
          resolve()
        })
        observer.observe(host, { childList: true, subtree: true })
      })
      root.render(<Host />)
      await typed
      await new Promise((resolve) => setTimeout(resolve, 50))
      const input = host.querySelector('input') as HTMLInputElement
      expect(input.value).toBe('A')
      ;(host.querySelector('button[type=submit]') as HTMLButtonElement).click()
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(calls).toEqual([['p1', 'A']])
      expect(host.textContent).not.toContain('Travel-Talk-Export')
    } finally {
      root.unmount()
      host.remove()
      ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = previous
    }
  })

  it('says an empty name needs a visible character', async () => {
    render(
      <AppProvider>
        <TopBar />
      </AppProvider>,
    )
    fireEvent.click(await screen.findByRole('button', { name: /^Wer lernt\?/ }))
    await screen.findByText(/Eine von zehn/)
    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }))
    expect(screen.getByRole('alert').textContent).toBe('Der Name braucht ein sichtbares Zeichen.')
    expect(screen.queryByText('Die Datei ist kein gültiger Travel-Talk-Export.')).toBeNull()
  })

  it('takes the other person\'s name when that person becomes active', async () => {
    const people = [person('p1', 'Ada'), person('p2', 'Bea')]
    function Host() {
      const [activePersonId, setActivePersonId] = useState('p1')
      return (
        <AppContext.Provider
          value={{
            catalog: null,
            catalogOk: true,
            snapshot: { settings: people[0]!.settings, cards: [], people, activePersonId },
            storageError: false,
            saveSettings: async () => undefined,
            saveCard: async () => undefined,
            replaceAll: async () => undefined,
            addPerson: async () => false,
            renamePerson: async () => false,
            deletePerson: async () => undefined,
            switchPerson: async (id) => setActivePersonId(id),
            importPerson: async () => 'ok',
            importAll: async () => undefined,
            everyone: async () => [],
          }}
        >
          <TopBar />
        </AppContext.Provider>
      )
    }
    render(<Host />)
    fireEvent.click(screen.getByRole('button', { name: 'Wer lernt?: Ada' }))
    fireEvent.change(screen.getByLabelText('Umbenennen'), { target: { value: 'Ada tippt' } })
    fireEvent.click(screen.getByRole('button', { name: 'Bea' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Wer lernt?: Bea' }))
    expect((screen.getByLabelText('Umbenennen') as HTMLInputElement).value).toBe('Bea')
  })

  it('shows the cleaned name after a rename is saved', async () => {
    const people = [person('p1', 'Ada')]
    const renamePerson = vi.fn(async () => true)
    render(
      <AppContext.Provider
        value={{
          catalog: null,
          catalogOk: true,
          snapshot: { settings: people[0]!.settings, cards: [], people, activePersonId: 'p1' },
          storageError: false,
          saveSettings: async () => undefined,
          saveCard: async () => undefined,
          replaceAll: async () => undefined,
          addPerson: async () => false,
          renamePerson,
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
    fireEvent.click(screen.getByRole('button', { name: 'Wer lernt?: Ada' }))
    fireEvent.change(screen.getByLabelText('Umbenennen'), { target: { value: 'Ada ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Umbenennen' }))
    await waitFor(() => expect(renamePerson).toHaveBeenCalledWith('p1', 'Ada '))
    fireEvent.click(screen.getByRole('button', { name: 'Wer lernt?: Ada' }))
    expect((screen.getByLabelText('Umbenennen') as HTMLInputElement).value).toBe('Ada')
  })

  it('forgets a name discarded with Escape', async () => {
    const people = [person('p1', 'Ada')]
    render(
      <AppContext.Provider
        value={{
          catalog: null,
          catalogOk: true,
          snapshot: { settings: people[0]!.settings, cards: [], people, activePersonId: 'p1' },
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
    fireEvent.click(screen.getByRole('button', { name: 'Wer lernt?: Ada' }))
    fireEvent.change(screen.getByLabelText('Umbenennen'), { target: { value: 'Weg damit' } })
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByLabelText('Umbenennen')).toBeNull())
    fireEvent.click(screen.getByRole('button', { name: 'Wer lernt?: Ada' }))
    expect((screen.getByLabelText('Umbenennen') as HTMLInputElement).value).toBe('Ada')
  })

  it('drops the typed draft when the person changes and the new name arrives later', async () => {
    const initial = [person('p1', 'Ada'), person('p2', 'Bea')]
    function Host() {
      const [people, setPeople] = useState(initial)
      const [activePersonId, setActivePersonId] = useState('p1')
      return (
        <AppContext.Provider
          value={{
            catalog: null,
            catalogOk: true,
            snapshot: { settings: people[0]!.settings, cards: [], people, activePersonId },
            storageError: false,
            saveSettings: async () => undefined,
            saveCard: async () => undefined,
            replaceAll: async () => undefined,
            addPerson: async () => false,
            renamePerson: async () => false,
            deletePerson: async () => undefined,
            switchPerson: async (id) => setActivePersonId(id),
            importPerson: async () => 'ok',
            importAll: async () => undefined,
            everyone: async () => [],
          }}
        >
          <button type="button" onClick={() => setPeople([person('p1', 'Ada'), person('p2', 'Beate')])}>
            name
          </button>
          <TopBar />
        </AppContext.Provider>
      )
    }
    render(<Host />)
    fireEvent.click(screen.getByRole('button', { name: 'Wer lernt?: Ada' }))
    fireEvent.change(screen.getByLabelText('Umbenennen'), { target: { value: 'Ada tippt' } })
    fireEvent.click(screen.getByRole('button', { name: 'Bea' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Wer lernt?: Bea' }))
    expect((screen.getByLabelText('Umbenennen') as HTMLInputElement).value).toBe('Bea')
    fireEvent.click(screen.getByRole('button', { name: 'name' }))
    await waitFor(() => expect((screen.getByLabelText('Umbenennen') as HTMLInputElement).value).toBe('Beate'))
  })

  it('says when the person is gone and when ten people are already there', async () => {
    const people = [person('p1', 'Ada')]
    const renamePerson = vi.fn(async () => false)
    const addPerson = vi.fn(async () => false)
    render(
      <AppContext.Provider
        value={{
          catalog: null,
          catalogOk: true,
          snapshot: { settings: people[0]!.settings, cards: [], people, activePersonId: 'p1' },
          storageError: false,
          saveSettings: async () => undefined,
          saveCard: async () => undefined,
          replaceAll: async () => undefined,
          addPerson,
          renamePerson,
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
    fireEvent.click(screen.getByRole('button', { name: 'Wer lernt?: Ada' }))
    fireEvent.change(screen.getByLabelText('Umbenennen'), { target: { value: 'Berta' } })
    fireEvent.click(screen.getByRole('button', { name: 'Umbenennen' }))
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Diese Person ist nicht mehr da.')
    expect(screen.queryByText('Die Datei ist kein gültiger Travel-Talk-Export.')).toBeNull()
    fireEvent.change(screen.getByLabelText('Person hinzufügen'), { target: { value: 'C' } })
    fireEvent.click(screen.getByRole('button', { name: 'Person hinzufügen' }))
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Zehn Personen. Mehr geht auf diesem Gerät nicht.')
    expect(screen.queryByText('Diese Person ist nicht mehr da.')).toBeNull()
    expect(screen.queryByText('Die Datei ist kein gültiger Travel-Talk-Export.')).toBeNull()
    expect(addPerson).toHaveBeenCalledWith('C')
  })
})
