// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import { freshIndexedDb } from '../test-idb'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { stopClip } from '../audio/player'
import { Shell } from '../app/shell'
import { AppProvider } from '../app/state'
import { DexieProgressRepository } from '../storage/dexie-repository'
import { defaultSettings, type StoredCard } from '../storage/types'
import { PracticePage } from './Practice'
import { SettingsPage } from './Settings'

vi.mock('../audio/player', () => ({
  playClip: vi.fn(async () => 'file'),
  stopClip: vi.fn(),
  decodeContourFile: vi.fn(async () => null),
  loadManifest: vi.fn(async () => new Set()),
  clearManifestCache: vi.fn(),
}))

vi.mock('../audio/align', async () => {
  const actual = await vi.importActual<typeof import('../audio/align')>('../audio/align')
  return { ...actual, loadAlignment: vi.fn(async () => null) }
})

function due(cardId: string): StoredCard {
  const yesterday = new Date(Date.now() - 86_400_000).toISOString()
  return {
    cardId,
    due: yesterday,
    stability: 2,
    difficulty: 5,
    elapsed_days: 1,
    scheduled_days: 1,
    learning_steps: 0,
    reps: 3,
    lapses: 0,
    state: 2,
    last_review: yesterday,
  }
}

async function twoPeople(): Promise<void> {
  const repo = new DexieProgressRepository('travel-talk')
  const first = await repo.load()
  const firstId = first.activePersonId ?? ''
  await repo.renamePerson(firstId, 'A')
  await repo.saveSettings(firstId, { ...defaultSettings, appLang: 'de', targetLang: 'vi' })
  await repo.saveCard(firstId, due('de-vi:emergency.help'))
  expect(await repo.addPerson('C')).toBe(true)
  const secondId = (await repo.load()).activePersonId ?? ''
  await repo.saveSettings(secondId, { ...defaultSettings, appLang: 'de', targetLang: 'vi' })
  await repo.switchPerson(firstId)
}

beforeEach(() => {
  freshIndexedDb()
  vi.mocked(stopClip).mockClear()
})

afterEach(() => {
  cleanup()
})

describe('switching person', () => {
  it('drops the review session and stops audio', async () => {
    await twoPeople()
    render(
      <AppProvider>
        <MemoryRouter initialEntries={['/practice?kind=review']}>
          <Routes>
            <Route path="/" element={<Shell />}>
              <Route path="practice" element={<PracticePage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AppProvider>,
    )
    expect(await screen.findByRole('button', { name: 'Hilfe!' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Wer lernt?: A' }))
    fireEvent.click(screen.getByRole('button', { name: 'C' }))
    expect(await screen.findByText('Keine Wiederholung ist fällig.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Hilfe!' })).toBeNull()
    expect(vi.mocked(stopClip)).toHaveBeenCalled()
  })

  it('closes the import dialog and clears the note checkbox', async () => {
    await twoPeople()
    render(
      <AppProvider>
        <MemoryRouter initialEntries={['/settings']}>
          <Routes>
            <Route path="/" element={<Shell />}>
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AppProvider>,
    )
    const note = await screen.findByRole('checkbox', { name: 'Notiz mitexportieren' })
    fireEvent.click(note)
    expect((note as HTMLInputElement).checked).toBe(true)
    const file = new File(
      [
        JSON.stringify({
          app: 'travel-talk',
          format: 3,
          exportedAt: '2026-10-10T00:00:00.000Z',
          settings: {
            appLang: 'de',
            targetLang: 'en',
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
      'in.json',
      { type: 'application/json' },
    )
    fireEvent.change(screen.getByLabelText('Fortschritt importieren'), { target: { files: [file] } })
    expect(await screen.findByRole('dialog')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Wer lernt?: A' }))
    fireEvent.click(screen.getByRole('button', { name: 'C' }))
    expect(await screen.findByRole('button', { name: 'Wer lernt?: C' })).toBeTruthy()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect((screen.getByRole('checkbox', { name: 'Notiz mitexportieren' }) as HTMLInputElement).checked).toBe(false)
  })
})
