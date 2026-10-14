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
import { playClip } from '../audio/player'
import { PracticePage } from './Practice'

async function throughIntro() {
  for (let pass = 0; pass < 3; pass += 1) {
    fireEvent.click(await screen.findByRole('button', { name: 'Weiter' }))
  }
}

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
    expect(await screen.findByTestId('word-intro')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Neues Wort' })).toBeTruthy()
    expect(screen.getByTestId('target-line').textContent).toBe('ngày')
    expect(screen.getByTestId('word-read').textContent).toBe('ngai, fallend')
    expect(screen.getByTestId('word-meaning').textContent).toBe('Tage')
    expect(screen.queryByRole('heading', { name: 'Was bedeutet das Wort?' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Tage' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Aufnehmen' })).toBeNull()
    await waitFor(() => {
      const call = vi.mocked(playClip).mock.calls.at(-1)
      expect(String(call?.[0])).toMatch(/\/w\.days__any__base\.m4a$/)
      expect(String(call?.[0])).not.toMatch(/\.r70\.|\.r85\./)
      expect(call?.[3]).toBe(1)
    })
    const repoBefore = new DexieProgressRepository('travel-talk')
    expect((await repoBefore.load()).cards.find((card) => card.cardId === 'de-vi:w.days')).toBeUndefined()
    await throughIntro()
    expect(await screen.findByRole('heading', { name: 'Was bedeutet das Wort?' })).toBeTruthy()
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
    await throughIntro()
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
    await throughIntro()
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
    await throughIntro()
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

  it('asks for the meaning at once when the word is already a card', async () => {
    const repo = new DexieProgressRepository('travel-talk')
    const personId = (await repo.load()).activePersonId ?? ''
    await repo.saveSettings(personId, { ...defaultSettings, appLang: 'de', targetLang: 'vi', voiceHintSeen: true })
    await repo.saveCard(personId, {
      cardId: 'de-vi:w.days',
      due: new Date(Date.now() - 60_000).toISOString(),
      stability: 5,
      difficulty: 5,
      elapsed_days: 1,
      scheduled_days: 1,
      learning_steps: 0,
      reps: 2,
      lapses: 0,
      state: 2,
      last_review: new Date(Date.now() - 86_400_000).toISOString(),
    })
    render(
      <AppProvider>
        <MemoryRouter initialEntries={['/practice?kind=review']}>
          <Routes>
            <Route path="/practice" element={<PracticePage />} />
          </Routes>
        </MemoryRouter>
      </AppProvider>,
    )
    expect(await screen.findByRole('heading', { name: 'Was bedeutet das Wort?' })).toBeTruthy()
    expect(screen.queryByTestId('word-intro')).toBeNull()
    expect(screen.getByTestId('word-read').textContent).toBe('ngai, fallend')
  })

  it('plays a new word at 100 % and keeps 70 % for this person only', async () => {
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
    expect(await screen.findByRole('button', { name: '100 %', pressed: true })).toBeTruthy()
    expect(screen.getByTestId('word-speed').querySelectorAll('button')).toHaveLength(3)
    expect(screen.queryByRole('button', { name: 'Automatisch' })).toBeNull()
    await waitFor(() => {
      const call = vi.mocked(playClip).mock.calls.at(-1)
      expect(String(call?.[0])).toMatch(/\/w\.days__any__base\.m4a$/)
      expect(call?.[3]).toBe(1)
    })
    fireEvent.click(screen.getByRole('button', { name: '70 %' }))
    expect(await screen.findByRole('button', { name: '70 %', pressed: true })).toBeTruthy()
    await waitFor(() => {
      const call = vi.mocked(playClip).mock.calls.at(-1)
      expect(String(call?.[0])).toMatch(/\/w\.days__any__base\.r70\.m4a$/)
      expect(call?.[3]).toBe(1)
    })
    const repo = new DexieProgressRepository('travel-talk')
    const firstId = await waitFor(async () => {
      const loaded = await repo.load()
      expect(loaded.settings.wordSpeed).toBe(0.7)
      return loaded.activePersonId ?? ''
    })
    cleanup()
    vi.mocked(playClip).mockClear()
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
    expect(await screen.findByRole('button', { name: '70 %', pressed: true })).toBeTruthy()
    await waitFor(() => {
      expect(String(vi.mocked(playClip).mock.calls.at(-1)?.[0])).toMatch(/\.r70\.m4a$/)
    })
    expect(await repo.addPerson('B')).toBe(true)
    cleanup()
    vi.mocked(playClip).mockClear()
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
    expect(await screen.findByRole('button', { name: '100 %', pressed: true })).toBeTruthy()
    await waitFor(() => {
      const call = vi.mocked(playClip).mock.calls.at(-1)
      expect(String(call?.[0])).toMatch(/\/w\.days__any__base\.m4a$/)
      expect(String(call?.[0])).not.toMatch(/\.r70\.|\.r85\./)
    })
    const second = await repo.load()
    expect(second.settings.wordSpeed).toBeUndefined()
    expect(second.people?.find((person) => person.id === firstId)?.settings.wordSpeed).toBe(0.7)
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
