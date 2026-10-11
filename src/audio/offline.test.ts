import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defaultSettings } from '../storage/types'
import { voicesFor } from './voices'
import { AUDIO_CACHE, dropOtherVoices, loadVoiceOffline, preserveInUseVoices } from './offline'

const FILES = [
  'vi/vivos-22/emergency.help__any__base.m4a',
  'vi/vivos-22/emergency.help__any__base.r70.m4a',
  'vi/emergency.help__any__base.m4a',
  'vi/emergency.help__any__base.r70.m4a',
]

type Store = Map<string, string>

function installCaches(options?: { failPut?: boolean; failFetchAfter?: number; notFound?: string }): Map<string, Store> {
  const stores = new Map<string, Store>()
  let fetches = 0
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (String(url).includes('manifest.json')) {
        return { ok: true, json: async () => FILES }
      }
      fetches += 1
      if (options?.failFetchAfter != null && fetches > options.failFetchAfter) throw new TypeError('network')
      if (options?.notFound && String(url).includes(options.notFound)) return new Response('missing', { status: 404 })
      return new Response('audio')
    }),
  )
  vi.stubGlobal('caches', {
    async open(name: string) {
      if (!stores.has(name)) stores.set(name, new Map())
      const store = stores.get(name)!
      return {
        async match(input: RequestInfo) {
          const url = typeof input === 'string' ? input : input.url
          const body = store.get(url)
          return body == null ? undefined : new Response(body)
        },
        async put(input: RequestInfo, response: Response) {
          if (options?.failPut) throw new DOMException('full', 'QuotaExceededError')
          const url = typeof input === 'string' ? input : input.url
          store.set(url, await response.text())
        },
        async delete(input: RequestInfo) {
          const url = typeof input === 'string' ? input : input.url
          return store.delete(url)
        },
        async keys() {
          return [...store.keys()].map((url) => ({ url }) as Request)
        },
      }
    },
    async keys() {
      return [...stores.keys()]
    },
  })
  return stores
}

function voice(id: string) {
  const found = voicesFor('vi').find((item) => item.id === id)
  if (!found) throw new Error(id)
  return found
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('offline voice loading', () => {
  it('reports progress and drops the other voice only after a full load', async () => {
    const stores = installCaches()
    const old = 'travel-talk-precache-v2-old'
    stores.set(old, new Map(FILES.filter((file) => !file.includes('vivos')).map((file) => [`/audio/${file}`, 'kept'])))
    stores.set(AUDIO_CACHE, new Map(FILES.filter((file) => !file.includes('vivos')).map((file) => [`/audio/${file}`, 'kept'])))
    const seen: string[] = []
    const outcome = await loadVoiceOffline('vi', voice('vivos-22'), (have, total) => {
      seen.push(`${have}/${total}`)
    }, { dropOthers: () => true })
    expect(outcome.status).toBe('ready')
    expect(outcome.missing).toBe(0)
    expect(seen).toContain('1/2')
    expect(seen.at(-1)).toBe('2/2')
    const runtime = [...(stores.get(AUDIO_CACHE)?.keys() ?? [])]
    expect(runtime.some((url) => url.includes('/vivos-22/'))).toBe(true)
    expect(runtime.some((url) => url.includes('/audio/vi/emergency'))).toBe(false)
    const previous = [...(stores.get(old)?.keys() ?? [])]
    expect(previous.some((url) => url.includes('/audio/vi/emergency'))).toBe(false)
  })

  it('keeps the previous voice when the network fails and when storage is full', async () => {
    const stores = installCaches({ failFetchAfter: 0 })
    stores.set(AUDIO_CACHE, new Map([['/audio/vi/emergency.help__any__base.m4a', 'old']]))
    const outcome = await loadVoiceOffline('vi', voice('vivos-22'), () => undefined, { dropOthers: () => true })
    expect(outcome.status).toBe('error')
    expect(stores.get(AUDIO_CACHE)?.has('/audio/vi/emergency.help__any__base.m4a')).toBe(true)

    vi.unstubAllGlobals()
    const full = installCaches({ failPut: true })
    full.set(AUDIO_CACHE, new Map([['/audio/vi/emergency.help__any__base.m4a', 'old']]))
    const blocked = await loadVoiceOffline('vi', voice('vivos-22'), () => undefined, { dropOthers: () => true })
    expect(blocked.status).toBe('full')
    expect(full.get(AUDIO_CACHE)?.has('/audio/vi/emergency.help__any__base.m4a')).toBe(true)
    expect([...(full.get(AUDIO_CACHE)?.keys() ?? [])].some((url) => url.includes('vivos-22'))).toBe(false)
  })

  it('copies a voice that is already offline and leaves the old copy in place', async () => {
    const stores = installCaches()
    const legacy = '/audio/vi/emergency.help__any__base.m4a'
    stores.set('travel-talk-precache-v2-old', new Map([[legacy, 'old'], ['/audio/vi/emergency.help__any__base.r70.m4a', 'slow']]))
    await preserveInUseVoices({ ...defaultSettings, appLang: 'de', targetLang: 'vi' })
    expect(stores.get(AUDIO_CACHE)?.get(legacy)).toBe('old')
    expect(stores.get('travel-talk-precache-v2-old')?.get(legacy)).toBe('old')
    await dropOtherVoices('vi', voice('vais1000'))
    expect(stores.get(AUDIO_CACHE)?.has(legacy)).toBe(true)
  })

  it('caches only status 200 and fits every audio file', () => {
    const text = readFileSync(fileURLToPath(new URL('../../rsbuild.config.ts', import.meta.url)), 'utf8')
    expect(text).toContain('statuses: [200]')
    expect(text).not.toContain('[0, 200]')
    expect(text).toMatch(/maxEntries:\s*4000/)
    expect(text).toContain('cleanupOutdatedCaches: false')
    expect(text).toContain('importScripts: [`${BASE}sw-migrate.js`]')
  })

  it('skips a missing file and still finishes the voice', async () => {
    const stores = installCaches({ notFound: '.r70.m4a' })
    stores.set(AUDIO_CACHE, new Map([['/audio/vi/emergency.help__any__base.m4a', 'old']]))
    const outcome = await loadVoiceOffline('vi', voice('vivos-22'), () => undefined, { dropOthers: () => true })
    expect(outcome.status).toBe('ready')
    expect(outcome.missing).toBe(1)
    expect([...(stores.get(AUDIO_CACHE)?.keys() ?? [])].some((url) => url.includes('vivos-22') && !url.includes('.r70.'))).toBe(true)
    expect(stores.get(AUDIO_CACHE)?.has('/audio/vi/emergency.help__any__base.m4a')).toBe(true)
  })
})
