import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'

type Store = Map<string, string>

function cachesFrom(stores: Map<string, Store>) {
  return {
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
          const url = typeof input === 'string' ? input : input.url
          store.set(url, await response.text())
        },
        async keys() {
          return [...store.keys()].map((url) => ({ url }) as Request)
        },
      }
    },
    async keys() {
      return [...stores.keys()]
    },
  }
}

describe('service worker audio migration', () => {
  it('copies old audio during install and leaves it when activate cleans the precache', async () => {
    const code = readFileSync(fileURLToPath(new URL('../../public/sw-migrate.js', import.meta.url)), 'utf8')
    const stores = new Map<string, Store>()
    const precache = new Map<string, string>([
      ['https://example.test/Travel-Talk/audio/vi/emergency.help__any__base.m4a', 'voice'],
      ['https://example.test/Travel-Talk/audio/vi/emergency.help__any__base.r70.m4a', 'slow'],
      ['https://example.test/Travel-Talk/index.html', 'shell'],
    ])
    stores.set('travel-talk-precache-v2', precache)
    const listeners: { type: string; fn: (event: { waitUntil: (work: Promise<void>) => void }) => void }[] = []
    const self = {
      addEventListener(type: string, fn: (event: { waitUntil: (work: Promise<void>) => void }) => void) {
        listeners.push({ type, fn })
      },
    }
    runInNewContext(code, { self, caches: cachesFrom(stores) })
    expect(listeners.map((item) => item.type)).toEqual(['install'])
    let done: Promise<void> = Promise.resolve()
    listeners[0]?.fn({
      waitUntil(work) {
        done = work
      },
    })
    await done
    const audio = stores.get('travel-talk-audio')
    expect(audio?.size).toBe(2)
    expect([...audio!.keys()].every((url) => url.includes('.m4a'))).toBe(true)
    for (const [url] of [...precache]) {
      if (url.includes('.m4a')) precache.delete(url)
    }
    expect(precache.size).toBe(1)
    expect(audio?.size).toBe(2)
    expect(code).not.toContain('caches.delete')
  })
})