// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import { freshIndexedDb } from '../test-idb'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadVoiceOffline, voiceProgress } from '../audio/offline'
import { AppProvider } from '../app/state'
import { DexieProgressRepository } from '../storage/dexie-repository'
import { defaultSettings } from '../storage/types'
import { HomePage } from './Home'

vi.mock('../audio/offline', () => ({
  AUDIO_CHANGED: 'travel-talk-audio-changed',
  voiceProgress: vi.fn(async () => ({ have: 0, total: 10 })),
  loadVoiceOffline: vi.fn(),
  discardAdded: vi.fn(async () => undefined),
  forgetVoiceIfUnused: vi.fn(async () => undefined),
  notifyAudioChanged: vi.fn(() => {
    window.dispatchEvent(new Event('travel-talk-audio-changed'))
  }),
}))

beforeEach(() => {
  freshIndexedDb()
  vi.mocked(voiceProgress).mockReset()
  vi.mocked(loadVoiceOffline).mockReset()
})

afterEach(() => {
  cleanup()
})

async function renderHome(voices: { vi: string }): Promise<void> {
  const repo = new DexieProgressRepository('travel-talk')
  const personId = (await repo.load()).activePersonId ?? ''
  await repo.saveSettings(personId, {
    ...defaultSettings,
    appLang: 'de',
    targetLang: 'vi',
    voices,
    voiceHintSeen: true,
  })
  render(
    <AppProvider>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </AppProvider>,
  )
}

describe('start page voice', () => {
  it('switches back to a fully cached voice when storage is full', async () => {
    vi.mocked(voiceProgress).mockImplementation(async (_lang, voice) => {
      if (voice.id === 'vais1000') return { have: 10, total: 10 }
      return { have: 0, total: 10 }
    })
    let finish: (outcome: { status: 'full'; missing: number; added: string[] }) => void = () => undefined
    vi.mocked(loadVoiceOffline).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    await renderHome({ vi: 'vivos-22' })
    fireEvent.click(await screen.findByRole('button', { name: 'Für offline laden' }))
    finish({ status: 'full', missing: 0, added: ['/audio/vi/vivos-22/a.m4a'] })
    fireEvent.click(await screen.findByRole('button', { name: 'Bisherige Stimme behalten' }))
    expect(await screen.findByText('offline bereit')).toBeTruthy()
  })

  it('hides keep-previous when no other voice is fully cached', async () => {
    vi.mocked(voiceProgress).mockResolvedValue({ have: 0, total: 10 })
    let finish: (outcome: { status: 'full'; missing: number; added: string[] }) => void = () => undefined
    vi.mocked(loadVoiceOffline).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    await renderHome({ vi: 'vivos-22' })
    fireEvent.click(await screen.findByRole('button', { name: 'Für offline laden' }))
    finish({ status: 'full', missing: 0, added: ['/audio/vi/vivos-22/a.m4a'] })
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Bisherige Stimme behalten' })).toBeNull()
  })
})
