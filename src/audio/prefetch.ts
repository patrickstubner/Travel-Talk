import { publicUrl } from '../public-url'
import type { Settings } from '../storage/types'
import { loadManifest } from './player'
import { filesForVoice, selectedVoice } from './voices'

const CACHE = 'travel-talk-audio'

/** Fills the runtime audio cache with the selected target voice. Other voices stay on disk until chosen. */
export async function prefetchSelectedVoice(settings: Settings): Promise<void> {
  if (!settings.targetLang || !('caches' in globalThis)) return
  const voice = selectedVoice(settings, settings.targetLang)
  const listed = await loadManifest()
  const wanted = filesForVoice(listed, settings.targetLang, voice)
  const cache = await caches.open(CACHE)
  for (const file of wanted) {
    const url = publicUrl(`audio/${file}`)
    if (await cache.match(url)) continue
    try {
      const response = await fetch(url)
      if (!response.ok) continue
      await cache.put(url, response)
    } catch {
      return
    }
  }
}
