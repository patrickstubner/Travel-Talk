// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import { freshIndexedDb } from '../test-idb'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppContext, AppProvider } from '../app/state'
import { TopBar } from '../components/TopBar'
import { toExport } from '../storage/import'
import { defaultSettings } from '../storage/types'
import { SettingsPage } from './Settings'

type Saved = { name: string; body: Promise<string> }

function spyDownloads(): Saved[] {
  const saved: Saved[] = []
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    const body = blob instanceof Blob ? blob.text() : Promise.resolve('')
    saved.push({ name: '', body })
    return `blob:${saved.length}`
  })
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click(this: HTMLAnchorElement) {
    const last = saved.at(-1)
    if (last) last.name = this.download
  })
  return saved
}

function legacySettings(note: string) {
  return {
    pairId: 'de-vi',
    uiLang: 'de',
    viRegion: 'south',
    addressVi: 'anh',
    addressPt: 'voce',
    addressDe: 'sie',
    ptSpeaker: 'obrigado',
    viContact: 'phone',
    retention: 0.9,
    personalNote: note,
    speed: 'auto',
  }
}

function importFile(): File {
  const text = JSON.stringify({
    app: 'travel-talk',
    format: 1,
    exportedAt: '2026-10-10T00:00:00.000Z',
    settings: legacySettings(''),
    cards: [
      {
        cardId: 'de-vi:emergency.help',
        due: '2026-10-11T00:00:00.000Z',
        stability: 1,
        difficulty: 5,
        elapsed_days: 0,
        scheduled_days: 1,
        learning_steps: 0,
        reps: 1,
        lapses: 0,
        state: 2,
        last_review: '2026-10-10T00:00:00.000Z',
      },
    ],
  })
  return new File([text], 'in.json', { type: 'application/json' })
}

beforeEach(() => {
  freshIndexedDb()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function renderSettings(): void {
  render(
    <AppProvider>
      <TopBar />
      <SettingsPage />
    </AppProvider>,
  )
}

async function chooseLanguages(): Promise<void> {
  fireEvent.click(screen.getByRole('button', { name: /^Wer lernt\?/ }))
  fireEvent.change(await screen.findByLabelText('Wie sollen wir dich nennen?'), { target: { value: 'A' } })
  fireEvent.click(screen.getByRole('button', { name: 'Weiter' }))
  await screen.findByRole('button', { name: /Wer lernt\?: A/ })
  fireEvent.click(within(screen.getByRole('group', { name: 'Sprache der App' })).getByRole('button', { name: 'Deutsch' }))
  fireEvent.click(screen.getByRole('button', { name: /^Sprache, die du lernst/ }))
  const groups = await screen.findAllByRole('group', { name: 'Sprache, die du lernst' })
  fireEvent.click(within(groups[groups.length - 1]!).getByRole('button', { name: 'Vietnamesisch' }))
  await waitFor(() => {
    expect((screen.getByRole('button', { name: 'Fortschritt exportieren' }) as HTMLButtonElement).disabled).toBe(false)
  })
}

describe('settings import', () => {
  it('does not export before the two languages are chosen', async () => {
    renderSettings()
    const button = await screen.findByRole('button', { name: 'Fortschritt exportieren' })
    expect((button as HTMLButtonElement).disabled).toBe(true)
  })

  it('downloads a backup only from the button, and leaves the note out unless asked', async () => {
    const saved = spyDownloads()
    renderSettings()
    const note = await screen.findByLabelText('Persönliche Notiz')
    await chooseLanguages()
    fireEvent.change(note, { target: { value: 'Erdnüsse' } })
    const input = screen.getByLabelText('Fortschritt importieren')
    expect((input as HTMLInputElement).disabled).toBe(false)
    fireEvent.change(input, { target: { files: [importFile()] } })
    await screen.findByRole('dialog')
    expect(saved).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: 'Sicherung herunterladen' }))
    expect(saved).toHaveLength(1)
    expect(saved[0]?.name).toBe('travel-talk-sicherung.json')
    expect(await saved[0]?.body).not.toContain('Erdnüsse')
    fireEvent.click(screen.getByRole('checkbox', { name: 'Notiz mitexportieren' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sicherung herunterladen' }))
    expect(await saved[1]?.body).toContain('Erdnüsse')
  })

  it('keeps the local note when the imported file has none', async () => {
    renderSettings()
    const note = await screen.findByLabelText('Persönliche Notiz')
    fireEvent.change(note, { target: { value: 'Erdnüsse' } })
    fireEvent.change(screen.getByLabelText('Fortschritt importieren'), { target: { files: [importFile()] } })
    await screen.findByRole('dialog')
    expect(screen.getByText('Die Datei enthält keine Notiz. Die Notiz auf diesem Gerät bleibt.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Diese Person ersetzen' }))
    await screen.findByText('Import gespeichert.')
    expect((screen.getByLabelText('Persönliche Notiz') as HTMLTextAreaElement).value).toBe('Erdnüsse')
  })

  it('says when the file note replaces the local note', async () => {
    const file = importFile()
    const text = JSON.stringify({
      ...JSON.parse(await file.text()),
      settings: { ...legacySettings('Pollen') },
    })
    const withNote = new File([text], 'in.json', { type: 'application/json' })
    renderSettings()
    const note = await screen.findByLabelText('Persönliche Notiz')
    fireEvent.change(note, { target: { value: 'Erdnüsse' } })
    fireEvent.change(screen.getByLabelText('Fortschritt importieren'), { target: { files: [withNote] } })
    await screen.findByRole('dialog')
    expect(screen.getByText('Die Notiz in der Datei ersetzt die Notiz auf diesem Gerät.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Diese Person ersetzen' }))
    await screen.findByText('Import gespeichert.')
    expect((screen.getByLabelText('Persönliche Notiz') as HTMLTextAreaElement).value).toBe('Pollen')
  })

  it('says when the export date is more than a day ahead', async () => {
    const file = new File(
      [
        JSON.stringify({
          app: 'travel-talk',
          format: 3,
          exportedAt: '2031-01-01T00:00:00.000Z',
          settings: {
            appLang: 'de',
            targetLang: 'vi',
            viRegion: 'south',
            addressVi: 'anh',
            addressPt: 'voce',
            addressDe: 'sie',
            ptSpeaker: 'obrigado',
            viContact: 'phone',
            retention: 0.9,
            personalNote: '',
            speed: 'auto',
          },
          cards: [],
        }),
      ],
      'future.json',
      { type: 'application/json' },
    )
    renderSettings()
    fireEvent.change(await screen.findByLabelText('Fortschritt importieren'), { target: { files: [file] } })
    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      'Die Datei stammt mehr als einen Tag aus der Zukunft. Bitte die Uhr prüfen.',
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('asks to reload when the file comes from a newer app', async () => {
    const file = new File([JSON.stringify({ app: 'travel-talk', format: 5, surprise: true })], 'new.json', { type: 'application/json' })
    renderSettings()
    fireEvent.change(await screen.findByLabelText('Fortschritt importieren'), { target: { files: [file] } })
    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      'Datei aus neuerer Version – bitte App aktualisieren (Seite neu laden)',
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('keeps the current voice when the imported file has none', async () => {
    renderSettings()
    await screen.findByRole('button', { name: 'Fortschritt exportieren' })
    await chooseLanguages()
    fireEvent.click(await screen.findByRole('button', { name: 'Mann 1' }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Mann 1' }).getAttribute('aria-pressed')).toBe('true')
    })
    fireEvent.change(screen.getByLabelText('Fortschritt importieren'), { target: { files: [importFile()] } })
    fireEvent.click(await screen.findByRole('button', { name: 'Diese Person ersetzen' }))
    await screen.findByText('Import gespeichert.')
    expect(screen.getByRole('button', { name: 'Mann 1' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Frau (Norden)' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('explains why exporting every person stays off', async () => {
    renderSettings()
    const all = await screen.findByRole('button', { name: 'Alle Personen exportieren' })
    expect((all as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText('Alle Personen exportieren bleibt aus, solange eine Person keinen Namen oder nicht beide Sprachen hat.')).toBeTruthy()
  })

  it('backs up every person, says an empty note overwrites, and confirms replace all in a second step', async () => {
    const saved = spyDownloads()
    renderSettings()
    await chooseLanguages()
    fireEvent.click(screen.getByRole('button', { name: 'Wer lernt?: A' }))
    fireEvent.change(screen.getByLabelText('Person hinzufügen'), { target: { value: 'B' } })
    fireEvent.click(screen.getByRole('button', { name: 'Person hinzufügen' }))
    await screen.findByRole('button', { name: 'Wer lernt?: B' })
    fireEvent.click(within(screen.getByRole('group', { name: 'Sprache der App' })).getByRole('button', { name: 'Deutsch' }))
    fireEvent.click(screen.getByRole('button', { name: /^Sprache, die du lernst/ }))
    const groups = await screen.findAllByRole('group', { name: 'Sprache, die du lernst' })
    fireEvent.click(within(groups[groups.length - 1]!).getByRole('button', { name: 'Englisch' }))
    await waitFor(() => {
      expect((screen.getByRole('button', { name: 'Alle Personen exportieren' }) as HTMLButtonElement).disabled).toBe(false)
    })
    const settings = { ...defaultSettings, appLang: 'de' as const, targetLang: 'vi' as const }
    const text = toExport({ settings, cards: [] }, new Date(), false, {
      scope: 'all',
      people: [
        { name: 'AusDatei', settings, cards: [] },
        { name: 'Zweite', settings: { ...settings, targetLang: 'en' }, cards: [] },
      ],
    })
    fireEvent.change(screen.getByLabelText('Fortschritt importieren'), {
      target: { files: [new File([text], 'alle.json', { type: 'application/json' })] },
    })
    await screen.findByRole('dialog')
    expect(screen.getByText('Die Datei enthält keine Notiz. Die Notizen aller Personen auf diesem Gerät werden überschrieben.')).toBeTruthy()
    expect(screen.queryByText('Die Datei enthält keine Notiz. Die Notiz auf diesem Gerät bleibt.')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Sicherung herunterladen' }))
    await waitFor(() => expect(saved[0]).toBeTruthy())
    const packed = JSON.parse(await saved[0]!.body) as { scope: string; people: { name: string }[] }
    expect(packed.scope).toBe('all')
    expect(packed.people.map((person) => person.name).sort()).toEqual(['A', 'B'])
    fireEvent.click(screen.getByRole('button', { name: 'Alle Personen ersetzen' }))
    expect(screen.queryByText('Import gespeichert.')).toBeNull()
    expect(screen.getByRole('heading', { name: 'Alle Personen ersetzen?' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Ja, alle ersetzen' }))
    expect(await screen.findByText('Import gespeichert.')).toBeTruthy()
    expect(await screen.findByRole('button', { name: 'Wer lernt?: AusDatei' })).toBeTruthy()
  })

  it('keeps import disabled until a catalog is loaded', () => {
    render(
      <AppContext.Provider
        value={{
          catalog: null,
          catalogOk: false,
          snapshot: { settings: { ...defaultSettings }, cards: [] },
          storageError: false,
          saveSettings: async () => undefined,
          saveCard: async () => undefined,
          replaceAll: async () => undefined,
          addPerson: async () => false,
          renamePerson: async () => false,
          deletePerson: async () => undefined,
          switchPerson: async () => undefined,
          importPerson: async () => 'ok' as const,
          importAll: async () => undefined,
          everyone: async () => [],
        }}
      >
        <SettingsPage />
      </AppContext.Provider>,
    )
    expect((screen.getByLabelText('Fortschritt importieren') as HTMLInputElement).disabled).toBe(true)
  })
})
