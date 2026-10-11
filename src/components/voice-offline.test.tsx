// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { discardAdded, notifyAudioChanged, voiceProgress, loadVoiceOffline } from '../audio/offline'
import { dictionaries } from '../i18n/dictionary'
import { voicesFor } from '../audio/voices'
import { VoiceOfflineButton } from './VoiceOffline'

vi.mock('../audio/offline', () => ({
  AUDIO_CHANGED: 'travel-talk-audio-changed',
  voiceProgress: vi.fn(async () => ({ have: 0, total: 597 })),
  loadVoiceOffline: vi.fn(),
  discardAdded: vi.fn(async () => undefined),
  notifyAudioChanged: vi.fn(() => {
    window.dispatchEvent(new Event('travel-talk-audio-changed'))
  }),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const copy = dictionaries.de
const voice = voicesFor('vi').find((item) => item.id === 'vivos-22')!

describe('offline load control', () => {
  it('shows progress, then a retry, a full-storage message, or ready', async () => {
    let finish: (outcome: { status: 'error' | 'full' | 'ready'; missing: number; added: string[] }) => void = () => undefined
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
    finish({ status: 'error', missing: 0, added: [] })
    expect(await screen.findByRole('button', { name: 'Erneut versuchen' })).toBeTruthy()
    unmount()

    vi.mocked(voiceProgress).mockResolvedValue({ have: 0, total: 597 })
    const full = render(<VoiceOfflineButton lang="vi" voice={voice} copy={copy} dropOnSuccess onKeepPrevious={() => undefined} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Für offline laden' }))
    expect(await screen.findByText('4/597')).toBeTruthy()
    finish({ status: 'full', missing: 0, added: ['/audio/vi/vivos-22/emergency.help__any__base.m4a'] })
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toBe('Der Speicher ist voll. Die Stimme ist nicht vollständig geladen.')
    expect(screen.getByText('4/597')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Erneut versuchen' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Bisherige Stimme behalten' }))
    expect(discardAdded).toHaveBeenCalledWith(['/audio/vi/vivos-22/emergency.help__any__base.m4a'])
    full.unmount()

    vi.mocked(voiceProgress).mockResolvedValue({ have: 13, total: 597 })
    const again = render(<VoiceOfflineButton lang="vi" voice={voice} copy={copy} dropOnSuccess />)
    expect(await screen.findByText('13/597')).toBeTruthy()
    again.unmount()

    vi.mocked(voiceProgress).mockResolvedValue({ have: 0, total: 597 })
    const missing = render(<VoiceOfflineButton lang="vi" voice={voice} copy={copy} dropOnSuccess />)
    fireEvent.click(await screen.findByRole('button', { name: 'Für offline laden' }))
    finish({ status: 'ready', missing: 2, added: [] })
    expect(await screen.findByText('2 Dateien fehlen')).toBeTruthy()
    missing.unmount()

    vi.mocked(voiceProgress).mockResolvedValue({ have: 597, total: 597 })
    render(
      <VoiceOfflineButton lang="vi" voice={voice} copy={copy} dropOnSuccess pendingNote="Offline-Audio nach dem Update neu laden" />,
    )
    expect(await screen.findByText('offline bereit')).toBeTruthy()
    expect(screen.queryByText('Offline-Audio nach dem Update neu laden')).toBeNull()
  })

  it('returns to the previous voice and refreshes the neighbour after a delete', async () => {
    const neighbour = voicesFor('vi').find((item) => item.id === 'vais1000')!
    let neighbourHave = 597
    vi.mocked(voiceProgress).mockImplementation(async (_lang, item) => {
      if (item.id === neighbour.id) return { have: neighbourHave, total: 597 }
      return { have: 0, total: 597 }
    })
    let finish: (outcome: { status: 'full'; missing: number; added: string[] }) => void = () => undefined
    vi.mocked(loadVoiceOffline).mockImplementation(
      (_lang, _voice, onProgress) =>
        new Promise((resolve) => {
          onProgress(4, 597)
          finish = resolve
        }),
    )
    const keep = vi.fn()
    render(
      <div>
        <VoiceOfflineButton lang="vi" voice={neighbour} copy={copy} dropOnSuccess={false} />
        <VoiceOfflineButton
          lang="vi"
          voice={voice}
          copy={copy}
          dropOnSuccess
          pendingNote="Offline-Audio nach dem Update neu laden"
          onKeepPrevious={keep}
        />
      </div>,
    )
    expect(await screen.findByText('offline bereit')).toBeTruthy()
    expect(screen.getByText('Offline-Audio nach dem Update neu laden')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Für offline laden' }))
    finish({ status: 'full', missing: 0, added: ['/audio/vi/vivos-22/emergency.help__any__base.m4a'] })
    expect(await screen.findByRole('alert')).toBeTruthy()
    neighbourHave = 12
    fireEvent.click(screen.getByRole('button', { name: 'Bisherige Stimme behalten' }))
    expect(discardAdded).toHaveBeenCalledWith(['/audio/vi/vivos-22/emergency.help__any__base.m4a'])
    expect(await screen.findByText('12/597')).toBeTruthy()
    expect(keep).toHaveBeenCalledTimes(1)
    expect(notifyAudioChanged).toHaveBeenCalled()
  })

  it('hides keep-previous when nothing would switch the voice', async () => {
    let finish: (outcome: { status: 'full'; missing: number; added: string[] }) => void = () => undefined
    vi.mocked(loadVoiceOffline).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    render(<VoiceOfflineButton lang="vi" voice={voice} copy={copy} dropOnSuccess />)
    fireEvent.click(await screen.findByRole('button', { name: 'Für offline laden' }))
    finish({ status: 'full', missing: 0, added: ['/audio/vi/vivos-22/a.m4a'] })
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Bisherige Stimme behalten' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Erneut versuchen' })).toBeTruthy()
  })
})
