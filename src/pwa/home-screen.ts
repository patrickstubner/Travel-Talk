export type HomeScreenOffer = 'hidden' | 'prompt' | 'ios'

export type HomeScreenNavigator = {
  userAgent: string
  platform?: string
  maxTouchPoints?: number
  standalone?: boolean
}

export type HomeScreenWindow = {
  navigator: HomeScreenNavigator
  matchMedia?: (query: string) => { matches: boolean }
}

/** True when the page is already the installed app. */
export function runningStandalone(win: HomeScreenWindow): boolean {
  if (win.navigator.standalone === true) return true
  try {
    return win.matchMedia?.('(display-mode: standalone)').matches === true
  } catch {
    return false
  }
}

/** iPhone, iPad, and iPadOS Safari. Other iOS browsers have no Add to Home Screen sheet. */
export function isIosSafari(nav: HomeScreenNavigator): boolean {
  const iPadAsMac = nav.platform === 'MacIntel' && (nav.maxTouchPoints ?? 0) > 1
  const ios = /iPhone|iPad|iPod/.test(nav.userAgent) || iPadAsMac
  if (!ios) return false
  if (/CriOS|FxiOS|EdgiOS|OPiOS/.test(nav.userAgent)) return false
  return /Safari/.test(nav.userAgent)
}

/**
 * Chromium keeps the deferred install event and shows a button.
 * iOS Safari gets a short hint. An installed app shows nothing.
 */
export function homeScreenOffer(win: HomeScreenWindow, hasPrompt: boolean): HomeScreenOffer {
  if (runningStandalone(win)) return 'hidden'
  if (hasPrompt) return 'prompt'
  if (isIosSafari(win.navigator)) return 'ios'
  return 'hidden'
}
