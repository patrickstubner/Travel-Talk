import { homeScreenOffer, runningStandalone, type HomeScreenOffer } from './home-screen'

type InstallPrompt = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let started = false
let deferred: InstallPrompt | null = null
let installed = false
let onPrompt: ((event: Event) => void) | null = null
let onInstalled: (() => void) | null = null
const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of listeners) listener()
}

/** Remember the browser install event from the first page load, before Settings opens. */
export function startHomeScreenCapture(): void {
  if (started || typeof window === 'undefined') return
  started = true
  onPrompt = (event: Event) => {
    event.preventDefault()
    deferred = event as InstallPrompt
    emit()
  }
  onInstalled = () => {
    installed = true
    deferred = null
    emit()
  }
  window.addEventListener('beforeinstallprompt', onPrompt)
  window.addEventListener('appinstalled', onInstalled)
}

export function subscribeHomeScreen(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function currentHomeScreenOffer(): HomeScreenOffer {
  if (typeof window === 'undefined') return 'hidden'
  if (installed || runningStandalone(window)) return 'hidden'
  return homeScreenOffer(window, deferred !== null)
}

/**
 * Open the browser install sheet. The saved event stays when `prompt()` throws,
 * so the next tap can try again. A successful call discards it.
 */
export async function promptHomeScreen(): Promise<void> {
  const event = deferred
  if (!event) return
  try {
    await event.prompt()
  } catch {
    return
  }
  if (deferred === event) {
    deferred = null
    emit()
  }
  try {
    await event.userChoice
  } catch {
    // The sheet already opened. The event cannot be used again.
  }
}

/** Drop the saved event and the window listeners. Tests call this between cases. */
export function resetHomeScreenCapture(): void {
  if (typeof window !== 'undefined') {
    if (onPrompt) window.removeEventListener('beforeinstallprompt', onPrompt)
    if (onInstalled) window.removeEventListener('appinstalled', onInstalled)
  }
  onPrompt = null
  onInstalled = null
  deferred = null
  installed = false
  started = false
  listeners.clear()
}
