import { describe, expect, it } from 'vitest'
import { dictionaries } from '../i18n/dictionary'
import { homeScreenOffer, isIosSafari, runningStandalone, type HomeScreenWindow } from './home-screen'

const IOS_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const IOS_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/119.0.6045.109 Mobile/15E148 Safari/604.1'
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
const IPAD_SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'

function win(userAgent: string, extra?: Partial<HomeScreenWindow['navigator']> & { standaloneDisplay?: boolean }): HomeScreenWindow {
  return {
    navigator: {
      userAgent,
      platform: extra?.platform,
      maxTouchPoints: extra?.maxTouchPoints,
      standalone: extra?.standalone,
    },
    matchMedia: () => ({ matches: extra?.standaloneDisplay === true }),
  }
}

describe('home screen offer', () => {
  it('hides the entry when the display mode is standalone', () => {
    expect(runningStandalone(win(ANDROID_CHROME, { standaloneDisplay: true }))).toBe(true)
    expect(homeScreenOffer(win(ANDROID_CHROME, { standaloneDisplay: true }), true)).toBe('hidden')
    expect(homeScreenOffer(win(IOS_SAFARI, { standaloneDisplay: true }), false)).toBe('hidden')
  })

  it('hides the entry when iOS says the page is already standalone', () => {
    const page = win(IOS_SAFARI, { standalone: true })
    expect(runningStandalone(page)).toBe(true)
    expect(homeScreenOffer(page, false)).toBe('hidden')
  })

  it('offers the Chromium prompt only after the browser saved one', () => {
    const page = win(ANDROID_CHROME)
    expect(homeScreenOffer(page, false)).toBe('hidden')
    expect(homeScreenOffer(page, true)).toBe('prompt')
  })

  it('shows the iOS Safari hint and skips other iOS browsers', () => {
    expect(isIosSafari(win(IOS_SAFARI).navigator)).toBe(true)
    expect(homeScreenOffer(win(IOS_SAFARI), false)).toBe('ios')
    expect(isIosSafari(win(IOS_CHROME).navigator)).toBe(false)
    expect(homeScreenOffer(win(IOS_CHROME), false)).toBe('hidden')
    expect(homeScreenOffer(win(IPAD_SAFARI, { platform: 'MacIntel', maxTouchPoints: 5 }), false)).toBe('ios')
    expect(homeScreenOffer(win(IPAD_SAFARI, { platform: 'MacIntel', maxTouchPoints: 0 }), false)).toBe('hidden')
  })

  it('names the action in every interface language', () => {
    expect(dictionaries.de.installHome).toBe('Zum Home-Bildschirm')
    expect(dictionaries.de.installIos).toContain('Teilen')
    expect(dictionaries.de.installIos).toContain('Zum Home-Bildschirm')
    expect(dictionaries.en.installHome).toBe('Add to Home Screen')
    expect(dictionaries.en.installIos).toBe('Tap Share, then Add to Home Screen.')
    expect(dictionaries['pt-BR'].installHome).toBe('Adicionar à Tela de Início')
    expect(dictionaries['pt-BR'].installIos).toContain('Compartilhar')
    expect(dictionaries['pt-BR'].installIos).toContain('Adicionar à Tela de Início')
    expect(dictionaries.vi.installHome).toBe('Thêm vào Màn hình chính')
    expect(dictionaries.vi.installIos).toContain('Chia sẻ')
    expect(dictionaries.vi.installIos).toContain('Thêm vào Màn hình chính')
  })
})
