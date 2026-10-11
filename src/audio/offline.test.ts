import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defaultSettings } from '../storage/types'
import { voicesFor } from './voices'
import { AUDIO_CACHE, discardAdded, dropOtherVoices, dropReplacedClips, forgetVoiceIfUnused, loadVoiceOffline, voiceProgress } from './offline'

const FILES = [
  'vi/vivos-22/emergency.help__any__base.m4a',
  'vi/vivos-22/emergency.help__any__base.r70.m4a',
  'vi/vivos-22/emergency.help__any__base.align.json',
  'vi/emergency.help__any__base.m4a',
  'vi/emergency.help__any__base.r70.m4a',
  'vi/emergency.help__any__base.align.json',
]

type Store = Map<string, string>

function installCaches(options?: {
  failPut?: boolean
  failPutAfter?: number
  failFetchAfter?: number
  notFound?: string
  httpStatus?: number
}): Map<string, Store> {
  const stores = new Map<string, Store>()
  let fetches = 0
  let puts = 0
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (String(url).includes('manifest.json')) {
        return { ok: true, json: async () => FILES }
      }
      fetches += 1
      if (options?.failFetchAfter != null && fetches > options.failFetchAfter) throw new TypeError('network')
      if (options?.httpStatus) return new Response('no', { status: options.httpStatus })
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
          puts += 1
          if (options?.failPut || (options?.failPutAfter != null && puts > options.failPutAfter)) {
            throw new DOMException('full', 'QuotaExceededError')
          }
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
    expect(outcome.added).toHaveLength(3)
    expect(outcome.added.every((url) => url.includes('/vivos-22/'))).toBe(true)
    expect(outcome.added.some((url) => url.endsWith('.align.json'))).toBe(true)
    expect(seen).toContain('1/3')
    expect(seen.at(-1)).toBe('3/3')
    const runtime = [...(stores.get(AUDIO_CACHE)?.keys() ?? [])]
    expect(runtime.some((url) => url.includes('/vivos-22/'))).toBe(true)
    expect(runtime.some((url) => url.includes('/audio/vi/emergency'))).toBe(false)
    const previous = [...(stores.get(old)?.keys() ?? [])]
    expect(previous.some((url) => url.includes('/audio/vi/emergency'))).toBe(false)
    expect(previous.some((url) => url.endsWith('.align.json'))).toBe(false)
  })

  it('keeps the previous voice when the network fails and when storage is full', async () => {
    const stores = installCaches({ failFetchAfter: 0 })
    stores.set(AUDIO_CACHE, new Map([['/audio/vi/emergency.help__any__base.m4a', 'old']]))
    const outcome = await loadVoiceOffline('vi', voice('vivos-22'), () => undefined, { dropOthers: () => true })
    expect(outcome.status).toBe('error')
    expect(outcome.added).toEqual([])
    expect(stores.get(AUDIO_CACHE)?.has('/audio/vi/emergency.help__any__base.m4a')).toBe(true)

    vi.unstubAllGlobals()
    const full = installCaches({ failPut: true })
    full.set(AUDIO_CACHE, new Map([['/audio/vi/emergency.help__any__base.m4a', 'old']]))
    const blocked = await loadVoiceOffline('vi', voice('vivos-22'), () => undefined, { dropOthers: () => true })
    expect(blocked.status).toBe('full')
    expect(blocked.added).toEqual([])
    expect(full.get(AUDIO_CACHE)?.has('/audio/vi/emergency.help__any__base.m4a')).toBe(true)
    expect([...(full.get(AUDIO_CACHE)?.keys() ?? [])].some((url) => url.includes('vivos-22'))).toBe(false)
  })

  it('discards only the files added by the failed attempt', async () => {
    const stores = installCaches()
    const kept = '/audio/vi/emergency.help__any__base.m4a'
    const added = '/audio/vi/vivos-22/emergency.help__any__base.m4a'
    stores.set(AUDIO_CACHE, new Map([[kept, 'old'], [added, 'new']]))
    await discardAdded([added])
    expect(stores.get(AUDIO_CACHE)?.has(kept)).toBe(true)
    expect(stores.get(AUDIO_CACHE)?.has(added)).toBe(false)
  })

  it('leaves the selected legacy voice when another voice is dropped', async () => {
    const stores = installCaches()
    const legacy = '/audio/vi/emergency.help__any__base.m4a'
    stores.set(AUDIO_CACHE, new Map([[legacy, 'old'], ['/audio/vi/vivos-22/emergency.help__any__base.m4a', 'new']]))
    await dropOtherVoices('vi', voice('vais1000'))
    expect(stores.get(AUDIO_CACHE)?.has(legacy)).toBe(true)
    expect(stores.get(AUDIO_CACHE)?.has('/audio/vi/vivos-22/emergency.help__any__base.m4a')).toBe(false)
  })

  it('removes a deleted person voice when nobody else uses it', async () => {
    const stores = installCaches()
    const legacy = '/audio/vi/emergency.help__any__base.m4a'
    const mann = '/audio/vi/vivos-22/emergency.help__any__base.m4a'
    const gone = { ...defaultSettings, appLang: 'de' as const, targetLang: 'vi' as const, voices: { vi: 'vivos-22' } }
    stores.set(AUDIO_CACHE, new Map([[legacy, 'old'], [mann, 'new']]))
    await forgetVoiceIfUnused(gone, [{ id: 'b', settings: { ...defaultSettings, appLang: 'de', targetLang: 'vi' } }])
    expect(stores.get(AUDIO_CACHE)?.has(mann)).toBe(false)
    expect(stores.get(AUDIO_CACHE)?.has(legacy)).toBe(true)
    stores.set(AUDIO_CACHE, new Map([[legacy, 'old'], [mann, 'new']]))
    await forgetVoiceIfUnused(gone, [
      { id: 'b', settings: { ...defaultSettings, appLang: 'de', targetLang: 'vi', voices: { vi: 'vivos-22' } } },
    ])
    expect(stores.get(AUDIO_CACHE)?.has(mann)).toBe(true)
    expect(stores.get(AUDIO_CACHE)?.has(legacy)).toBe(true)
  })

  it('tells the voice buttons to refresh after another voice is dropped', async () => {
    installCaches()
    const seen: string[] = []
    vi.stubGlobal('window', {
      dispatchEvent(event: Event) {
        seen.push(event.type)
        return true
      },
    })
    await dropOtherVoices('vi', voice('vais1000'))
    expect(seen).toEqual(['travel-talk-audio-changed'])
  })

  it('caches only status 200 and does not migrate audio during install', () => {
    const text = readFileSync(fileURLToPath(new URL('../../rsbuild.config.ts', import.meta.url)), 'utf8')
    expect(text).toContain('statuses: [200]')
    expect(text).not.toContain('[0, 200]')
    expect(text).toMatch(/maxEntries:\s*8000/)
    expect(text).toContain('**/*.align.json')
    expect(text).toContain('align\\.json')
    expect(text).toContain('cleanupOutdatedCaches: false')
    expect(text).not.toContain('sw-migrate')
    expect(text).not.toContain('importScripts')
  })

  it('keeps more than one situation of room above the manifest', () => {
    const text = readFileSync(fileURLToPath(new URL('../../rsbuild.config.ts', import.meta.url)), 'utf8')
    const manifest = JSON.parse(readFileSync(fileURLToPath(new URL('../../public/audio/manifest.json', import.meta.url)), 'utf8')) as unknown[]
    const match = text.match(/maxEntries:\s*(\d+)/)
    const limit = Number(match?.[1])
    expect(limit).toBe(8000)
    expect(manifest.length).toBeGreaterThan(0)
    expect(limit).toBeGreaterThanOrEqual(manifest.length + 1200)
  })

  it('skips a missing file and still finishes the voice', async () => {
    const stores = installCaches({ notFound: '.r70.m4a' })
    stores.set(AUDIO_CACHE, new Map([['/audio/vi/emergency.help__any__base.m4a', 'old']]))
    const outcome = await loadVoiceOffline('vi', voice('vivos-22'), () => undefined, { dropOthers: () => true })
    expect(outcome.status).toBe('ready')
    expect(outcome.missing).toBe(1)
    expect(outcome.added).toHaveLength(2)
    expect(outcome.added.every((url) => url.includes('/vivos-22/') && !url.includes('.r70.'))).toBe(true)
    expect(outcome.added.some((url) => url.endsWith('.align.json'))).toBe(true)
    expect([...(stores.get(AUDIO_CACHE)?.keys() ?? [])].some((url) => url.includes('vivos-22') && url.endsWith('.align.json'))).toBe(true)
    expect(stores.get(AUDIO_CACHE)?.has('/audio/vi/emergency.help__any__base.m4a')).toBe(true)
  })

  it('counts a missing timing file like missing audio and keeps the other voice', async () => {
    const stores = installCaches({ notFound: '.align.json' })
    const legacy = '/audio/vi/emergency.help__any__base.m4a'
    const legacyAlign = '/audio/vi/emergency.help__any__base.align.json'
    stores.set(AUDIO_CACHE, new Map([[legacy, 'old'], [legacyAlign, 'times']]))
    const outcome = await loadVoiceOffline('vi', voice('vivos-22'), () => undefined, { dropOthers: () => true })
    expect(outcome.status).toBe('ready')
    expect(outcome.missing).toBe(1)
    expect(outcome.added).toHaveLength(2)
    expect(outcome.added.every((url) => url.endsWith('.m4a'))).toBe(true)
    expect(stores.get(AUDIO_CACHE)?.has(legacy)).toBe(true)
    expect(stores.get(AUDIO_CACHE)?.has(legacyAlign)).toBe(true)
  })

  it('counts cached timing files in the voice progress', async () => {
    const stores = installCaches()
    stores.set(AUDIO_CACHE, new Map([
      ['/audio/vi/vivos-22/emergency.help__any__base.m4a', 'audio'],
      ['/audio/vi/vivos-22/emergency.help__any__base.align.json', 'times'],
    ]))
    await expect(voiceProgress('vi', voice('vivos-22'))).resolves.toEqual({ have: 2, total: 3 })
  })

  it('removes the other voice timing files together with its audio', async () => {
    const stores = installCaches()
    const keepAlign = '/audio/vi/emergency.help__any__base.align.json'
    const otherAlign = '/audio/vi/vivos-22/emergency.help__any__base.align.json'
    stores.set(AUDIO_CACHE, new Map([
      ['/audio/vi/emergency.help__any__base.m4a', 'old'],
      [keepAlign, 'old'],
      ['/audio/vi/vivos-22/emergency.help__any__base.m4a', 'new'],
      [otherAlign, 'new'],
    ]))
    await dropOtherVoices('vi', voice('vais1000'))
    expect(stores.get(AUDIO_CACHE)?.has(keepAlign)).toBe(true)
    expect(stores.get(AUDIO_CACHE)?.has('/audio/vi/emergency.help__any__base.m4a')).toBe(true)
    expect(stores.get(AUDIO_CACHE)?.has(otherAlign)).toBe(false)
    expect(stores.get(AUDIO_CACHE)?.has('/audio/vi/vivos-22/emergency.help__any__base.m4a')).toBe(false)
  })

  it('stops on an HTTP error other than 404 and keeps the other voice', async () => {
    const stores = installCaches({ httpStatus: 500 })
    const legacy = '/audio/vi/emergency.help__any__base.m4a'
    stores.set(AUDIO_CACHE, new Map([[legacy, 'old']]))
    const outcome = await loadVoiceOffline('vi', voice('vivos-22'), () => undefined, { dropOthers: () => true })
    expect(outcome.status).toBe('error')
    expect(outcome.added).toEqual([])
    expect(stores.get(AUDIO_CACHE)?.has(legacy)).toBe(true)
  })

  it('lists the urls stored before quota stops the attempt', async () => {
    const stores = installCaches({ failPutAfter: 1 })
    const legacy = '/audio/vi/emergency.help__any__base.m4a'
    stores.set(AUDIO_CACHE, new Map([[legacy, 'old']]))
    const blocked = await loadVoiceOffline('vi', voice('vivos-22'), () => undefined, { dropOthers: () => true })
    expect(blocked.status).toBe('full')
    expect(blocked.added).toHaveLength(1)
    expect(blocked.added[0]).toContain('/vivos-22/')
    expect(stores.get(AUDIO_CACHE)?.has(legacy)).toBe(true)
    expect(stores.get(AUDIO_CACHE)?.has(blocked.added[0] ?? '')).toBe(true)
  })

  it('does not delete another voice when dropOthers is false', async () => {
    const stores = installCaches()
    const legacy = '/audio/vi/emergency.help__any__base.m4a'
    stores.set(AUDIO_CACHE, new Map([[legacy, 'old']]))
    const outcome = await loadVoiceOffline('vi', voice('vivos-22'), () => undefined, { dropOthers: () => false })
    expect(outcome.status).toBe('ready')
    expect(outcome.missing).toBe(0)
    expect(stores.get(AUDIO_CACHE)?.has(legacy)).toBe(true)
    expect([...(stores.get(AUDIO_CACHE)?.keys() ?? [])].some((url) => url.includes('/vivos-22/'))).toBe(true)
  })

  it('keeps a voice only when the folder matches the id, and leaves other languages', async () => {
    const stores = installCaches()
    const kept = '/audio/vi/vivos-22/emergency.help__any__base.m4a'
    const longer = '/audio/vi/vivos-220/emergency.help__any__base.m4a'
    const german = '/audio/de/thorsten-high/emergency.help__any__base.m4a'
    stores.set(AUDIO_CACHE, new Map([[kept, 'a'], [longer, 'b'], [german, 'c'], ['/audio/vi/vivos-32/emergency.help__any__base.m4a', 'd']]))
    await dropOtherVoices('vi', voice('vivos-22'), ['vivos-32'])
    expect(stores.get(AUDIO_CACHE)?.has(kept)).toBe(true)
    expect(stores.get(AUDIO_CACHE)?.has('/audio/vi/vivos-32/emergency.help__any__base.m4a')).toBe(true)
    expect(stores.get(AUDIO_CACHE)?.has(longer)).toBe(false)
    expect(stores.get(AUDIO_CACHE)?.has(german)).toBe(true)
  })

  it('deletes only the listed urls, and an empty list deletes nothing', async () => {
    const stores = installCaches()
    const kept = '/audio/vi/emergency.help__any__base.m4a'
    const added = '/audio/vi/vivos-22/emergency.help__any__base.m4a'
    stores.set(AUDIO_CACHE, new Map([[kept, 'old'], [added, 'new']]))
    await discardAdded([])
    expect(stores.get(AUDIO_CACHE)?.has(kept)).toBe(true)
    expect(stores.get(AUDIO_CACHE)?.has(added)).toBe(true)
    await discardAdded([added])
    expect(stores.get(AUDIO_CACHE)?.has(kept)).toBe(true)
    expect(stores.get(AUDIO_CACHE)?.has(added)).toBe(false)
  })

  it('keeps another person voice when this person finishes a download', async () => {
    const stores = installCaches()
    const other = '/audio/vi/vivos-32/emergency.help__any__base.m4a'
    const legacy = '/audio/vi/emergency.help__any__base.m4a'
    stores.set(AUDIO_CACHE, new Map([
      [other, 'other'],
      [other.replace('.m4a', '.r70.m4a'), 'other'],
      [other.replace('.m4a', '.align.json'), 'other'],
      [legacy, 'old'],
    ]))
    const outcome = await loadVoiceOffline('vi', voice('vivos-22'), () => undefined, {
      dropOthers: () => true,
      retainIds: ['vivos-32'],
    })
    expect(outcome.status).toBe('ready')
    expect(outcome.missing).toBe(0)
    expect(stores.get(AUDIO_CACHE)?.has(other)).toBe(true)
    expect(stores.get(AUDIO_CACHE)?.has(legacy)).toBe(false)
  })

  it('drops the old names of clips that were spoken again', async () => {
    const stores = installCaches()
    const stale = '/Travel-Talk/audio/vi/vivos-22/transport.01.taxi__any__base.m4a'
    const staleTimes = '/audio/de/transport.20.seasick__any__base.align.json'
    const kept = '/audio/vi/vivos-22/emergency.help__any__base.m4a'
    stores.set(AUDIO_CACHE, new Map([
      [stale, 'old-taxi'],
      [staleTimes, 'old-times'],
      [kept, 'kept'],
    ]))
    await dropReplacedClips()
    expect(stores.get(AUDIO_CACHE)?.has(stale)).toBe(false)
    expect(stores.get(AUDIO_CACHE)?.has(staleTimes)).toBe(false)
    expect(stores.get(AUDIO_CACHE)?.has(kept)).toBe(true)
  })
})
