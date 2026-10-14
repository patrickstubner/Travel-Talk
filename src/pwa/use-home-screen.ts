import { useEffect, useState } from 'react'
import { currentHomeScreenOffer, promptHomeScreen, startHomeScreenCapture, subscribeHomeScreen } from './home-screen-capture'
import type { HomeScreenOffer } from './home-screen'

export function useHomeScreen(): { offer: HomeScreenOffer; prompt: () => Promise<void> } {
  const [offer, setOffer] = useState<HomeScreenOffer>('hidden')

  useEffect(() => {
    startHomeScreenCapture()
    const read = () => setOffer(currentHomeScreenOffer())
    read()
    const stop = subscribeHomeScreen(read)
    let media: MediaQueryList | null = null
    try {
      media = window.matchMedia('(display-mode: standalone)')
    } catch {
      media = null
    }
    const onMode = () => read()
    media?.addEventListener('change', onMode)
    return () => {
      stop()
      media?.removeEventListener('change', onMode)
    }
  }, [])

  return { offer, prompt: promptHomeScreen }
}
