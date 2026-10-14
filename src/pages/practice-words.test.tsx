// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import { freshIndexedDb } from '../test-idb'
import { useEffect, type ReactNode } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WORDS } from '../../content/words'
import { tryLoadCatalog } from '../content/load'
import { AppProvider, useApp } from '../app/state'
import { DexieProgressRepository } from '../storage/dexie-repository'
import { defaultSettings, type StoredCard } from '../storage/types'
import { orderedConcepts, usableConcepts } from '../srs/session'
import { emptyCard, reviewCard, toStored, Rating } from '../srs/scheduler'
import { PracticePage } from './Practice'

vi.mock('../audio/player', () => ({
  playClip: vi.fn(async () => 'file'),
  stopClip: vi.fn(),
}))

function ReadyPractice({ children }: { children: ReactNode }) {
  const { snapshot, saveSettings } = useApp()
  useEffect(() => {
    if (snapshot && (snapshot.settings.appLang !== 'de' || snapshot.settings.targetLang !== 'vi')) {
      void saveSettings({ ...snapshot.settings, appLang: 'de', targetLang: 'vi', speed: 'auto' })
    }
  }, [snapshot, saveSettings])
  if (snapshot?.settings.appLang !== 'de' || snapshot?.settings.targetLang !== 'vi') return null
  return children
}

beforeEach(() => {
  freshIndexedDb()
})

afterEach(() => {
  cleanup()
})

describe('word block', () => {
  it('asks for the meaning and stores Gut on the word card', async () => {
    render(
      <AppProvider>
        <ReadyPractice>
          <MemoryRouter initialEntries={['/practice?kind=new']}>
            <Routes>
              <Route path="/practice" element={<PracticePage />} />
            </Routes>
          </MemoryRouter>
        </ReadyPractice>
      </AppProvider>,
    )
    expect(await screen.findByText('Zuerst die Wörter von heute.')).toBeTruthy()
    expect(screen.getByTestId('target-line').textContent).toBe('ngày')
    expect(screen.queryByRole('button', { name: 'Aufnehmen' })).toBeNull()
    fireEvent.click(await screen.findByRole('button', { name: 'Tage' }))
    expect(await screen.findByText('Das stimmt.')).toBeTruthy()
    const repo = new DexieProgressRepository('travel-talk')
    await waitFor(async () => {
      const saved = (await repo.load()).cards.find((card) => card.cardId === 'de-vi:w.days')
      expect(saved?.reps).toBe(1)
      expect(saved?.learning_steps).toBe(1)
    })
  })

  it('stores Nochmal when the meaning is wrong and keeps the sentence shut', async () => {
    render(
      <AppProvider>
        <ReadyPractice>
          <MemoryRouter initialEntries={['/practice?kind=new']}>
            <Routes>
              <Route path="/practice" element={<PracticePage />} />
            </Routes>
          </MemoryRouter>
        </ReadyPractice>
      </AppProvider>,
    )
    fireEvent.click(await screen.findByRole('button', { name: 'bleiben' }))
    expect(await screen.findByText('Gemeint ist «Tage».')).toBeTruthy()
    const repo = new DexieProgressRepository('travel-talk')
    await waitFor(async () => {
      const saved = (await repo.load()).cards.find((card) => card.cardId === 'de-vi:w.days')
      expect(saved?.learning_steps).toBe(0)
    })
    expect(screen.queryByRole('button', { name: 'Aufnehmen' })).toBeNull()
  })

  it('skips the word block without grading a card and can remember that', async () => {
    render(
      <AppProvider>
        <ReadyPractice>
          <MemoryRouter initialEntries={['/practice?kind=new']}>
            <Routes>
              <Route path="/practice" element={<PracticePage />} />
            </Routes>
          </MemoryRouter>
        </ReadyPractice>
      </AppProvider>,
    )
    expect(await screen.findByRole('button', { name: 'Wörter überspringen' })).toBeTruthy()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Für mich merken' }))
    fireEvent.click(screen.getByRole('button', { name: 'Wörter überspringen' }))
    expect(await screen.findByRole('heading', { name: /Neuer Satz/ })).toBeTruthy()
    expect(screen.queryByText('Zuerst die Wörter von heute.')).toBeNull()
    const repo = new DexieProgressRepository('travel-talk')
    await waitFor(async () => {
      const loaded = await repo.load()
      expect(loaded.cards.filter((card) => card.cardId.startsWith('de-vi:w.'))).toEqual([])
      expect(loaded.settings.skipWords).toBe(true)
    })
    cleanup()
    render(
      <AppProvider>
        <ReadyPractice>
          <MemoryRouter initialEntries={['/practice?kind=new']}>
            <Routes>
              <Route path="/practice" element={<PracticePage />} />
            </Routes>
          </MemoryRouter>
        </ReadyPractice>
      </AppProvider>,
    )
    expect(await screen.findByRole('heading', { name: /Neuer Satz/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Wörter überspringen' })).toBeNull()
    expect((await repo.load()).cards.filter((card) => card.cardId.startsWith('de-vi:w.'))).toEqual([])
  })

  it('opens the sentence for the new word after one due sentence', async () => {
    const loaded = tryLoadCatalog()
    if (!loaded.ok) throw new Error('catalog')
    const list = usableConcepts(orderedConcepts(loaded.catalog), 'de', 'vi', 'south')
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const todayWords = WORDS.map((word) => word.id)
      .filter((id) => id !== 'w.documents' && id !== 'w.days' && id !== 'w.stay')
      .slice(0, 5)
    const todaySentences = ['arrival.passport', ...list.map((concept) => concept.id).filter((id) => id !== 'arrival.passport' && id !== 'visa.days' && id !== 'visa.documents')].slice(0, 8)
    const repo = new DexieProgressRepository('travel-talk')
    const personId = (await repo.load()).activePersonId ?? ''
    await repo.saveSettings(personId, { ...defaultSettings, appLang: 'de', targetLang: 'vi', voiceHintSeen: true })
    for (const word of WORDS) {
      if (word.id === 'w.documents') continue
      await repo.saveCard(personId, studied(`de-vi:${word.id}`, todayWords.includes(word.id) ? now : yesterday, false))
    }
    for (const concept of list) {
      if (concept.id === 'visa.days' || concept.id === 'visa.documents') continue
      await repo.saveCard(personId, studied(`de-vi:${concept.id}`, todaySentences.includes(concept.id) ? now : yesterday, concept.id === 'arrival.passport'))
    }
    render(
      <AppProvider>
        <MemoryRouter initialEntries={['/practice']}>
          <Routes>
            <Route path="/practice" element={<PracticePage />} />
          </Routes>
        </MemoryRouter>
      </AppProvider>,
    )
    // The due sentence is the only review. Passing every queue sentence into the opener spends the one slot.
    // Omitting now returns visa.days, which is already open from yesterday, ahead of visa.documents.
    fireEvent.click(await screen.findByRole('button', { name: 'Hier ist mein Pass.' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Weiter' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Ich habe es gesagt' }))
    fireEvent.click(await screen.findByRole('button', { name: /Später wieder/ }))
    expect(await screen.findByText('giấy tờ')).toBeTruthy()
    fireEvent.click(await screen.findByRole('button', { name: 'Dokumente' }))
    await waitFor(async () => {
      const saved = (await repo.load()).cards.find((card) => card.cardId === 'de-vi:w.documents')
      expect(saved?.reps).toBe(1)
    })
    fireEvent.click(await screen.findByRole('button', { name: 'Weiter' }))
    const head = await screen.findByTestId('learn-head')
    expect(head.textContent).toMatch(/Dokumente/)
    expect(head.textContent).not.toMatch(/bleiben/)
  })
})

function studied(cardId: string, at: Date, dueNow: boolean): StoredCard {
  const card = reviewCard(emptyCard(at), Rating.Good, at, 0.9, false)
  const due = new Date(at)
  due.setDate(due.getDate() + (dueNow ? -1 : 2))
  const today = new Date()
  const introduced = at.toDateString() === today.toDateString()
  return {
    ...toStored(cardId, card),
    elapsed_days: introduced ? 0 : 1,
    last_review: at.toISOString(),
    due: dueNow ? new Date(Date.now() - 60_000).toISOString() : due.toISOString(),
  }
}
