// @vitest-environment happy-dom
import { useState } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { voiceProgress } from '../audio/offline'
import { dictionaries } from '../i18n/dictionary'
import { defaultSettings, type Settings } from '../storage/types'
import { LanguageChoice } from './LanguageChoice'

vi.mock('../audio/player', () => ({
  playClip: vi.fn(async () => 'file'),
  stopClip: vi.fn(),
}))

vi.mock('../audio/offline', () => ({
  AUDIO_CHANGED: 'travel-talk-audio-changed',
  dropOtherVoicesIfCached: vi.fn(async () => undefined),
  loadVoiceOffline: vi.fn(async () => ({ status: 'full', missing: 0, added: ['/Travel-Talk/audio/vi/vivos-22/a.m4a'] })),
  voiceProgress: vi.fn(async (_lang: string, voice: { id: string }) =>
    voice.id === 'vais1000' ? { have: 10, total: 10 } : { have: 2, total: 10 },
  ),
  discardAdded: vi.fn(async () => undefined),
  notifyAudioChanged: vi.fn(() => undefined),
}))

afterEach(() => {
  cleanup()
  vi.mocked(voiceProgress).mockImplementation(async (_lang: string, voice: { id: string }) =>
    voice.id === 'vais1000' ? { have: 10, total: 10 } : { have: 2, total: 10 },
  )
})

function Harness() {
  const [settings, setSettings] = useState<Settings>({
    ...defaultSettings,
    appLang: 'de',
    targetLang: 'vi',
    voices: { vi: 'vais1000' },
  })
  return (
    <LanguageChoice
      settings={settings}
      copy={dictionaries.de}
      ui="de"
      mode="settings"
      onChange={(patch) => setSettings({ ...settings, ...patch })}
    />
  )
}

describe('keep the previous voice', () => {
  it('selects the previous voice again after storage is full', async () => {
    render(<Harness />)
    expect(screen.getByRole('button', { name: 'Frau (Norden)' }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: 'Mann 1' }))
    expect(screen.getByRole('button', { name: 'Mann 1' }).getAttribute('aria-pressed')).toBe('true')
    const loads = await screen.findAllByRole('button', { name: 'Für offline laden' })
    fireEvent.click(loads[0]!)
    fireEvent.click(await screen.findByRole('button', { name: 'Bisherige Stimme behalten' }))
    expect(await screen.findByRole('button', { name: 'Frau (Norden)', pressed: true })).toBeTruthy()
  })

  it('hides the previous-voice button when that voice is incomplete', async () => {
    vi.mocked(voiceProgress).mockResolvedValue({ have: 2, total: 10 })
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Mann 1' }))
    fireEvent.click((await screen.findAllByRole('button', { name: 'Für offline laden' }))[0]!)
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Bisherige Stimme behalten' })).toBeNull()
  })
})
