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

function isIosDevice(nav: HomeScreenNavigator): boolean {
  const iPadAsMac = nav.platform === 'MacIntel' && (nav.maxTouchPoints ?? 0) > 1
  return /iPhone|iPad|iPod/.test(nav.userAgent) || iPadAsMac
}

/** iOS release from the user agent, or null when the string has none. */
export function iosRelease(userAgent: string): { major: number; minor: number } | null {
  const match = /(?:iPhone |CPU )?OS (\d+)[_.](\d+)/.exec(userAgent)
  if (!match?.[1] || !match[2]) return null
  return { major: Number(match[1]), minor: Number(match[2]) }
}

function iosAtLeast(userAgent: string, major: number, minor: number): boolean {
  const release = iosRelease(userAgent)
  if (!release) return false
  return release.major > major || (release.major === major && release.minor >= minor)
}

/** iPhone, iPad, and iPadOS Safari. */
export function isIosSafari(nav: HomeScreenNavigator): boolean {
  if (!isIosDevice(nav)) return false
  if (/CriOS|FxiOS|EdgiOS|OPiOS/.test(nav.userAgent)) return false
  return /Safari/.test(nav.userAgent)
}

/**
 * Safari on iOS, plus Chrome, Edge, and Firefox from iOS 16.4.
 * That release is when those browsers can add a home-screen icon.
 */
export function showsIosInstallHint(nav: HomeScreenNavigator): boolean {
  if (!isIosDevice(nav)) return false
  if (isIosSafari(nav)) return true
  if (!/CriOS|EdgiOS|FxiOS/.test(nav.userAgent)) return false
  return iosAtLeast(nav.userAgent, 16, 4)
}

/**
 * Chromium keeps the deferred install event and shows a button.
 * iOS shows a short hint. An installed app shows nothing.
 */
export function homeScreenOffer(win: HomeScreenWindow, hasPrompt: boolean): HomeScreenOffer {
  if (runningStandalone(win)) return 'hidden'
  if (hasPrompt) return 'prompt'
  if (showsIosInstallHint(win.navigator)) return 'ios'
  return 'hidden'
}
