// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { voiceProgress, loadVoiceOffline } from '../audio/offline'
import { dictionaries } from '../i18n/dictionary'
import { voicesFor } from '../audio/voices'
import { VoiceOfflineButton } from './VoiceOffline'

vi.mock('../audio/offline', () => ({
  voiceProgress: vi.fn(async () => ({ have: 0, total: 597 })),
  loadVoiceOffline: vi.fn(),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const copy = dictionaries.de
const voice = voicesFor('vi').find((item) => item.id === 'vivos-22')!

describe('offline load control', () => {
  it('shows progress, then a retry, a full-storage message, or ready', async () => {
    let finish: (outcome: 'error' | 'full' | 'ready') => void = () => undefined
    vi.mocked(loadVoiceOffline).mockImplementation(
      (_lang, _voice, onProgress) =>
        new Promise((resolve) => {
          onProgress(4, 597)
          finish = resolve
        }),
    )
    const { unmount } = render(<VoiceOfflineButton lang="vi" voice={voice} copy={copy} dropOnSuccess />)
    fireEvent.click(await screen.findByRole('button', { name: 'Für offline laden' }))
    expect(await screen.findByText('4/597')).toBeTruthy()
    finish('error')
    expect(await screen.findByRole('button', { name: 'Erneut versuchen' })).toBeTruthy()
    unmount()

    vi.mocked(voiceProgress).mockResolvedValue({ have: 0, total: 597 })
    const full = render(<VoiceOfflineButton lang="vi" voice={voice} copy={copy} dropOnSuccess />)
    fireEvent.click(await screen.findByRole('button', { name: 'Für offline laden' }))
    expect(await screen.findByText('4/597')).toBeTruthy()
    finish('full')
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toBe('Der Speicher ist voll. Die Stimme ist nicht vollständig geladen.')
    full.unmount()

    vi.mocked(voiceProgress).mockResolvedValue({ have: 597, total: 597 })
    render(<VoiceOfflineButton lang="vi" voice={voice} copy={copy} dropOnSuccess />)
    expect(await screen.findByText('offline bereit')).toBeTruthy()
  })
})
