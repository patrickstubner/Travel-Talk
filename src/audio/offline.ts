import type { Lang } from '../../content/phrase'
import { publicUrl } from '../public-url'
import type { Settings } from '../storage/types'
import { loadManifest } from './player'
import { filesForVoice, selectedVoice, type CatalogVoice } from './voices'

/** Runtime cache filled by the service worker and by «Für offline laden». */
export const AUDIO_CACHE = 'travel-talk-audio'

export type LoadOutcome = 'ready' | 'error' | 'full'

export function audioRequest(file: string): string {
  return publicUrl(`audio/${file}`)
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.toString()
  return input.url
}

function isQuota(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'QuotaExceededError'
}

function isOtherVoice(url: string, lang: Lang, keep: CatalogVoice): boolean {
  const marker = `/audio/${lang}/`
  const index = url.indexOf(marker)
  if (index < 0) return false
  const rest = url.slice(index + marker.length)
  if (!rest.includes('.m4a')) return false
  if (keep.legacy) return rest.includes('/')
  return !rest.startsWith(`${keep.id}/`)
}

async function listedFiles(lang: Lang, voice: CatalogVoice): Promise<string[]> {
  const listed = await loadManifest()
  return filesForVoice(listed, lang, voice)
}

export async function voiceProgress(lang: Lang, voice: CatalogVoice): Promise<{ have: number; total: number }> {
  try {
    const files = await listedFiles(lang, voice)
    if (!('caches' in globalThis)) return { have: 0, total: files.length }
    const cache = await caches.open(AUDIO_CACHE)
    let have = 0
    for (const file of files) {
      if (await cache.match(audioRequest(file))) have += 1
    }
    return { have, total: files.length }
  } catch {
    return { have: 0, total: 0 }
  }
}

/**
 * Downloads one voice. A network or quota failure leaves what is already stored
 * and does not remove another voice. `dropOthers` is read only after every file is in.
 */
export async function loadVoiceOffline(
  lang: Lang,
  voice: CatalogVoice,
  onProgress: (have: number, total: number) => void,
  options: { dropOthers: () => boolean },
): Promise<LoadOutcome> {
  let files: string[]
  try {
    files = await listedFiles(lang, voice)
  } catch {
    onProgress(0, 0)
    return 'error'
  }
  const total = files.length
  if (total === 0 || !('caches' in globalThis)) {
    onProgress(0, total)
    return 'error'
  }
  const cache = await caches.open(AUDIO_CACHE)
  let have = 0
  const missing: string[] = []
  for (const file of files) {
    if (await cache.match(audioRequest(file))) have += 1
    else missing.push(file)
  }
  onProgress(have, total)
  for (const file of missing) {
    const url = audioRequest(file)
    let response: Response
    try {
      response = await fetch(url)
    } catch {
      onProgress(have, total)
      return 'error'
    }
    if (!response.ok) {
      onProgress(have, total)
      return 'error'
    }
    try {
      await cache.put(url, response)
    } catch (error) {
      if (isQuota(error)) {
        onProgress(have, total)
        return 'full'
      }
      onProgress(have, total)
      return 'error'
    }
    have += 1
    onProgress(have, total)
  }
  if (options.dropOthers()) await dropOtherVoices(lang, voice)
  return 'ready'
}

/** Removes every other voice of this language, including copies in an older cache. */
export async function dropOtherVoices(lang: Lang, keep: CatalogVoice): Promise<void> {
  if (!('caches' in globalThis)) return
  const names = await caches.keys()
  for (const name of names) {
    const cache = await caches.open(name)
    for (const request of await cache.keys()) {
      if (isOtherVoice(requestUrl(request), lang, keep)) await cache.delete(request)
    }
  }
}

/** After a switch to a voice that is already complete, the others of that language can go. */
export async function dropOtherVoicesIfCached(lang: Lang, voice: CatalogVoice): Promise<void> {
  const progress = await voiceProgress(lang, voice)
  if (progress.total > 0 && progress.have === progress.total) await dropOtherVoices(lang, voice)
}

/**
 * Copies the selected voice of each language in use into the runtime cache.
 * Nothing is deleted here, so an update cannot drop the voice the user already has.
 */
export async function preserveInUseVoices(settings: Settings): Promise<void> {
  if (!('caches' in globalThis)) return
  const langs = [settings.appLang, settings.targetLang].filter((lang, index, all): lang is Lang => lang != null && all.indexOf(lang) === index)
  if (langs.length === 0) return
  let listed: Awaited<ReturnType<typeof loadManifest>>
  try {
    listed = await loadManifest()
  } catch {
    return
  }
  const dest = await caches.open(AUDIO_CACHE)
  const names = await caches.keys()
  for (const lang of langs) {
    const voice = selectedVoice(settings, lang)
    for (const file of filesForVoice(listed, lang, voice)) {
      const url = audioRequest(file)
      if (await dest.match(url)) continue
      for (const name of names) {
        if (name === AUDIO_CACHE) continue
        const source = await caches.open(name)
        const hit = await source.match(url)
        if (!hit) continue
        try {
          await dest.put(url, hit.clone())
        } catch {
          return
        }
        break
      }
    }
  }
}
