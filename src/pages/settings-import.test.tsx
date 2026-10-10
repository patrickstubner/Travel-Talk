// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppContext, AppProvider } from '../app/state'
import { defaultSettings, type ProgressSnapshot } from '../storage/types'
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

function importFile(): File {
  const snapshot: ProgressSnapshot = {
    settings: { ...defaultSettings, pairId: 'de-vi', personalNote: '' },
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
  }
  const text = JSON.stringify({
    app: 'travel-talk',
    format: 1,
    exportedAt: '2026-10-10T00:00:00.000Z',
    settings: snapshot.settings,
    cards: snapshot.cards,
  })
  return new File([text], 'in.json', { type: 'application/json' })
}

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('settings import', () => {
  it('downloads a backup only from the button, and leaves the note out unless asked', async () => {
    const saved = spyDownloads()
    render(
      <AppProvider>
        <SettingsPage />
      </AppProvider>,
    )
    const note = await screen.findByLabelText('Persönliche Notiz')
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
    render(
      <AppProvider>
        <SettingsPage />
      </AppProvider>,
    )
    const note = await screen.findByLabelText('Persönliche Notiz')
    fireEvent.change(note, { target: { value: 'Erdnüsse' } })
    fireEvent.change(screen.getByLabelText('Fortschritt importieren'), { target: { files: [importFile()] } })
    await screen.findByRole('dialog')
    fireEvent.click(screen.getByRole('button', { name: 'Importieren' }))
    await screen.findByText('Import gespeichert.')
    expect((screen.getByLabelText('Persönliche Notiz') as HTMLTextAreaElement).value).toBe('Erdnüsse')
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
        }}
      >
        <SettingsPage />
      </AppContext.Provider>,
    )
    expect((screen.getByLabelText('Fortschritt importieren') as HTMLInputElement).disabled).toBe(true)
  })
})
