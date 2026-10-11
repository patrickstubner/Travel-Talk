import type { Lang } from '../../content/phrase'
import { publicUrl } from '../public-url'
import { replacedClipPaths } from './clip-revision'
import { loadManifest } from './player'
import type { Settings } from '../storage/types'
import { filesForVoice, selectedVoice, voicesFor, voicesKeptByOthers, type CatalogVoice } from './voices'

/** Runtime cache filled by «Für offline laden». Install does not write it. */
export const AUDIO_CACHE = 'travel-talk-audio'

/** Voice buttons re-read their progress after a delete. */
export const AUDIO_CHANGED = 'travel-talk-audio-changed'

export function notifyAudioChanged(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(AUDIO_CHANGED))
}

export type LoadResult = {
  status: 'ready' | 'error' | 'full'
  /** Files that answered 404. They do not block the rest of the voice. */
  missing: number
  /** URLs stored during this attempt. Reverting deletes only these. */
  added: string[]
}

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

function isOtherVoice(url: string, lang: Lang, keepIds: ReadonlySet<string>): boolean {
  const marker = `/audio/${lang}/`
  const index = url.indexOf(marker)
  if (index < 0) return false
  const rest = url.slice(index + marker.length)
  if (!rest.includes('.m4a') && !rest.includes('.align.json')) return false
  const slash = rest.indexOf('/')
  const folder = slash < 0 ? '' : rest.slice(0, slash)
  if (folder === '') {
    const legacy = voicesFor(lang).find((voice) => voice.legacy)
    return legacy != null && !keepIds.has(legacy.id)
  }
  return !keepIds.has(folder)
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
  options: { dropOthers: () => boolean; retainIds?: readonly string[] },
): Promise<LoadResult> {
  const empty: LoadResult = { status: 'error', missing: 0, added: [] }
  let files: string[]
  try {
    files = await listedFiles(lang, voice)
  } catch {
    onProgress(0, 0)
    return empty
  }
  const total = files.length
  if (total === 0 || !('caches' in globalThis)) {
    onProgress(0, total)
    return empty
  }
  const cache = await caches.open(AUDIO_CACHE)
  let have = 0
  const pending: string[] = []
  for (const file of files) {
    if (await cache.match(audioRequest(file))) have += 1
    else pending.push(file)
  }
  onProgress(have, total)
  let missing = 0
  const added: string[] = []
  for (const file of pending) {
    const url = audioRequest(file)
    let response: Response
    try {
      response = await fetch(url)
    } catch {
      onProgress(have, total)
      return { status: 'error', missing, added }
    }
    if (response.status === 404) {
      missing += 1
      onProgress(have, total)
      continue
    }
    if (!response.ok) {
      onProgress(have, total)
      return { status: 'error', missing, added }
    }
    try {
      await cache.put(url, response)
    } catch (error) {
      if (isQuota(error)) {
        onProgress(have, total)
        return { status: 'full', missing, added }
      }
      onProgress(have, total)
      return { status: 'error', missing, added }
    }
    added.push(url)
    have += 1
    onProgress(have, total)
  }
  if (missing === 0 && options.dropOthers()) await dropOtherVoices(lang, voice, options.retainIds ?? [])
  return { status: 'ready', missing, added }
}

/**
 * Drops the 0.7.0 names of clips that were spoken again in 0.8.0.
 * The page now asks for `.v2`. The old bytes would otherwise stay for a year.
 */
export async function dropReplacedClips(): Promise<void> {
  if (!('caches' in globalThis)) return
  const stale = replacedClipPaths()
  const cache = await caches.open(AUDIO_CACHE)
  let removed = 0
  for (const request of await cache.keys()) {
    const url = requestUrl(request)
    if (stale.some((file) => url.endsWith(`/${file}`))) {
      await cache.delete(request)
      removed += 1
    }
  }
  if (removed > 0) notifyAudioChanged()
}

/** Drops only the files added by a failed attempt, so a complete older voice stays. */
export async function discardAdded(urls: readonly string[]): Promise<void> {
  if (!('caches' in globalThis) || urls.length === 0) {
    notifyAudioChanged()
    return
  }
  const cache = await caches.open(AUDIO_CACHE)
  for (const url of urls) await cache.delete(url)
  notifyAudioChanged()
}

/** Removes cached files of this language whose voice id is not in `keepIds`. */
export async function dropVoicesExcept(lang: Lang, keepIds: readonly string[]): Promise<void> {
  const keep = new Set(keepIds)
  if ('caches' in globalThis) {
    const names = await caches.keys()
    for (const name of names) {
      const cache = await caches.open(name)
      for (const request of await cache.keys()) {
        if (isOtherVoice(requestUrl(request), lang, keep)) await cache.delete(request)
      }
    }
  }
  notifyAudioChanged()
}

/** Removes voices of this language that nobody in `alsoKeep` still has selected. */
export async function dropOtherVoices(lang: Lang, keep: CatalogVoice, alsoKeep: readonly string[] = []): Promise<void> {
  await dropVoicesExcept(lang, [keep.id, ...alsoKeep])
}

/**
 * After a person is deleted, drop their voice when no remaining person still uses it.
 * An empty `remaining` list drops every voice of the languages that person learned.
 */
export async function forgetVoiceIfUnused(gone: Settings, remaining: readonly { id: string; settings: Settings }[]): Promise<void> {
  const langs = new Set<Lang>()
  if (gone.appLang) langs.add(gone.appLang)
  if (gone.targetLang) langs.add(gone.targetLang)
  for (const extra of gone.moreTargets ?? []) langs.add(extra)
  for (const lang of langs) {
    const used = voicesKeptByOthers(remaining, undefined, lang)
    if (used.includes(selectedVoice(gone, lang).id)) continue
    await dropVoicesExcept(lang, used)
  }
}

/** After a switch to a voice that is already complete, unused voices of that language can go. */
export async function dropOtherVoicesIfCached(lang: Lang, voice: CatalogVoice, alsoKeep: readonly string[] = []): Promise<void> {
  const progress = await voiceProgress(lang, voice)
  if (progress.total > 0 && progress.have === progress.total) await dropOtherVoices(lang, voice, alsoKeep)
}
