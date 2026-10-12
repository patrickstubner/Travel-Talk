// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { freshIndexedDb } from '../test-idb'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AppProvider } from '../app/state'
import { dictionaries } from '../i18n/dictionary'
import { DexieProgressRepository } from '../storage/dexie-repository'
import { defaultSettings } from '../storage/types'
import { HomePage } from './Home'

beforeEach(() => {
  freshIndexedDb()
})

afterEach(() => {
  cleanup()
})

describe('home hints', () => {
  it('shows the reset count and the voice hint once, and keeps the dismissal', async () => {
    const raw = new Dexie('travel-talk')
    raw.version(1).stores({ settings: 'id', cards: 'cardId' })
    const base = {
      due: '2026-10-11T00:00:00.000Z',
      stability: 2,
      difficulty: 5,
      elapsed_days: 0,
      scheduled_days: 1,
      learning_steps: 0,
      reps: 3,
      lapses: 0,
      state: 2,
      last_review: '2026-10-10T00:00:00.000Z',
    }
    await raw.table('settings').put({ id: 'app', ...defaultSettings, appLang: 'de', targetLang: 'vi' })
    await raw.table('cards').put({ ...base, cardId: 'de-vi:emergency.help', stability: Number.NaN })
    await raw.table('cards').put({ ...base, cardId: 'de-vi:meet.hello', difficulty: 40 })
    raw.close()

    function page() {
      return render(
        <AppProvider>
          <MemoryRouter>
            <HomePage />
          </MemoryRouter>
        </AppProvider>,
      )
    }

    page()
    expect(await screen.findByText('2 Karten zurückgesetzt.')).toBeTruthy()
    expect(screen.getByText('Vietnamesisch')).toBeTruthy()
    expect(screen.queryByText('Deutsch')).toBeNull()
    expect(await screen.findByText('Für offline noch nicht vollständig geladen')).toBeTruthy()
    expect(screen.getByText(/Männerstimmen/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Verstanden' }))
    expect(screen.queryByText(/Männerstimmen/)).toBeNull()
    cleanup()

    page()
    expect(await screen.findByRole('heading', { name: 'Heute lernen' })).toBeTruthy()
    expect(screen.queryByText(/Männerstimmen/)).toBeNull()
    expect(screen.queryByText(/zurückgesetzt/)).toBeNull()
  })

  it('shows the reserved sentence slots instead of no new lines', async () => {
    const repo = new DexieProgressRepository('travel-talk')
    const personId = (await repo.load()).activePersonId ?? ''
    await repo.saveSettings(personId, { ...defaultSettings, appLang: 'de', targetLang: 'vi', voiceHintSeen: true })
    render(
      <AppProvider>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </AppProvider>,
    )
    expect(await screen.findByText('bis zu 4 neue Sätze nach den Wörtern. Keine Wiederholung.')).toBeTruthy()
    expect(screen.getAllByText(/bis zu 4 neue Sätze nach den Wörtern/)).toHaveLength(2)
    expect(screen.queryByText(/0 neue Sätze/)).toBeNull()
    expect(screen.queryByText(/Heute keine neuen Sätze mehr/)).toBeNull()
    expect(dictionaries.en.sentencesAfterWords(4)).toBe('up to 4 new lines after the words')
    expect(dictionaries.en.startLead(0, 0, 4)).toBe('up to 4 new lines after the words. No review.')
    expect(dictionaries['pt-BR'].sentencesAfterWords(4)).toBe('até 4 frases novas depois das palavras')
    expect(dictionaries['pt-BR'].startLead(0, 0, 4)).toBe('até 4 frases novas depois das palavras. Nenhuma revisão.')
    expect(dictionaries.vi.sentencesAfterWords(4)).toBe('tối đa 4 câu mới sau các từ')
    expect(dictionaries.vi.startLead(0, 0, 4)).toBe('tối đa 4 câu mới sau các từ. Không có ôn lại.')
    expect(dictionaries.de.sentencesAfterWords(1)).toBe('bis zu 1 neuer Satz nach den Wörtern')
  })
})