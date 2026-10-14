// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProvider } from '../app/state'
import { dictionaries } from '../i18n/dictionary'
import { promptHomeScreen, resetHomeScreenCapture, startHomeScreenCapture } from '../pwa/home-screen-capture'
import { freshIndexedDb } from '../test-idb'
import { AddToHomeScreen } from './AddToHomeScreen'
import { SettingsPage } from '../pages/Settings'

const IOS_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const IOS_CHROME_164 =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/112.0.5615.46 Mobile/15E148 Safari/604.1'

function setUserAgent(userAgent: string): void {
  Object.defineProperty(window.navigator, 'userAgent', { value: userAgent, configurable: true })
}

function setStandalone(value: boolean | undefined): void {
  Object.defineProperty(window.navigator, 'standalone', { value, configurable: true })
}

function stubDisplay(standalone: boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(display-mode: standalone)' && standalone,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
  }))
}

function installEvent(): Event & { prompt: ReturnType<typeof vi.fn> } {
  const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
    prompt: ReturnType<typeof vi.fn>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  }
  event.prompt = vi.fn(async () => undefined)
  event.userChoice = Promise.resolve({ outcome: 'accepted' })
  return event
}

beforeEach(() => {
  freshIndexedDb()
  resetHomeScreenCapture()
  setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
  setStandalone(undefined)
  stubDisplay(false)
})

afterEach(() => {
  cleanup()
  resetHomeScreenCapture()
  vi.unstubAllGlobals()
})

describe('add to home screen', () => {
  it('calls prompt when the saved Chromium event is tapped', async () => {
    startHomeScreenCapture()
    const event = installEvent()
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    render(<AddToHomeScreen label={dictionaries.en.installHome} iosHint={dictionaries.en.installIos} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Add to Home Screen' }))
    await waitFor(() => expect(event.prompt).toHaveBeenCalledOnce())
    expect(screen.queryByRole('button', { name: 'Add to Home Screen' })).toBeNull()
  })

  it('keeps the saved event when prompt() throws and discards it after success', async () => {
    startHomeScreenCapture()
    const event = installEvent()
    event.prompt = vi.fn().mockRejectedValueOnce(new Error('prompt failed')).mockResolvedValueOnce(undefined)
    window.dispatchEvent(event)
    render(<AddToHomeScreen label={dictionaries.en.installHome} iosHint={dictionaries.en.installIos} />)
    const button = await screen.findByRole('button', { name: 'Add to Home Screen' })
    fireEvent.click(button)
    await waitFor(() => expect(event.prompt).toHaveBeenCalledOnce())
    expect(screen.getByRole('button', { name: 'Add to Home Screen' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Add to Home Screen' }))
    await waitFor(() => expect(event.prompt).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Add to Home Screen' })).toBeNull())
  })

  it('shows the iOS Safari steps and no button', async () => {
    setUserAgent(IOS_SAFARI)
    render(<AddToHomeScreen label={dictionaries.de.installHome} iosHint={dictionaries.de.installIos} />)
    expect(await screen.findByText('Zum Home-Bildschirm')).toBeTruthy()
    expect(screen.getByText('Tippe auf Teilen, dann auf «Zum Home-Bildschirm».')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Zum Home-Bildschirm' })).toBeNull()
  })

  it('shows the iOS steps in Chrome 16.4', async () => {
    setUserAgent(IOS_CHROME_164)
    render(<AddToHomeScreen label={dictionaries.en.installHome} iosHint={dictionaries.en.installIos} />)
    expect(await screen.findByText('Add to Home Screen')).toBeTruthy()
    expect(screen.getByText('Tap Share, then Add to Home Screen.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Add to Home Screen' })).toBeNull()
  })

  it('hides the entry in standalone display mode and on an installed iOS page', () => {
    stubDisplay(true)
    startHomeScreenCapture()
    window.dispatchEvent(installEvent())
    const { unmount } = render(<AddToHomeScreen label="Add to Home Screen" iosHint="Tap Share, then Add to Home Screen." />)
    expect(screen.queryByTestId('add-home')).toBeNull()
    unmount()

    resetHomeScreenCapture()
    stubDisplay(false)
    setUserAgent(IOS_SAFARI)
    setStandalone(true)
    render(<AddToHomeScreen label="Zum Home-Bildschirm" iosHint="Tippe auf Teilen, dann auf «Zum Home-Bildschirm»." />)
    expect(screen.queryByTestId('add-home')).toBeNull()
    expect(screen.queryByText('Zum Home-Bildschirm')).toBeNull()
  })

  it('hides the entry after the browser reports the app was installed', async () => {
    startHomeScreenCapture()
    window.dispatchEvent(installEvent())
    render(<AddToHomeScreen label="Add to Home Screen" iosHint="Tap Share, then Add to Home Screen." />)
    expect(await screen.findByRole('button', { name: 'Add to Home Screen' })).toBeTruthy()
    window.dispatchEvent(new Event('appinstalled'))
    await waitFor(() => expect(screen.queryByTestId('add-home')).toBeNull())
  })

  it('places the button in settings', async () => {
    render(
      <AppProvider>
        <SettingsPage />
      </AppProvider>,
    )
    await screen.findByTestId('settings')
    startHomeScreenCapture()
    const event = installEvent()
    window.dispatchEvent(event)
    fireEvent.click(await screen.findByRole('button', { name: 'Zum Home-Bildschirm' }))
    await waitFor(() => expect(event.prompt).toHaveBeenCalledOnce())
  })
})

describe('promptHomeScreen', () => {
  it('does nothing when no event was saved', async () => {
    await expect(promptHomeScreen()).resolves.toBeUndefined()
  })
})
