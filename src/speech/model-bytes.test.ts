import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { fetchVerifiedBytes, mayFetchModel, sha256Hex, type ModelCache } from './model-bytes'

function memoryCache(): { cache: ModelCache; store: Map<string, ArrayBuffer> } {
  const store = new Map<string, ArrayBuffer>()
  return {
    store,
    cache: {
      async match(url) {
        return store.get(url) ?? null
      },
      async put(url, body) {
        store.set(url, body)
      },
      async drop(url) {
        store.delete(url)
      },
    },
  }
}

describe('verified model bytes', () => {
  it('does not fetch until the person asks, and save-data is not an extra fetch', () => {
    expect(mayFetchModel({ cached: false, accepted: false })).toBe(false)
    expect(mayFetchModel({ cached: true, accepted: false })).toBe(false)
    expect(mayFetchModel({ cached: true, accepted: true })).toBe(false)
    expect(mayFetchModel({ cached: false, accepted: true })).toBe(true)
  })

  it('keeps the checked bytes when a second delivery is tampered', async () => {
    const good = Uint8Array.from([1, 2, 3, 4, 5]).buffer
    const hash = await sha256Hex(good)
    let calls = 0
    const { cache, store } = memoryCache()
    const spec = { url: 'https://example.test/model.tar.gz', sha256: hash, bytes: good.byteLength }
    const fetchImpl: typeof fetch = async () => {
      calls += 1
      const body = calls === 1 ? good.slice(0) : Uint8Array.from([9, 9, 9, 9, 9]).buffer
      return new Response(body, { headers: { 'Content-Length': String(body.byteLength) } })
    }
    const first = await fetchVerifiedBytes(spec, { fetch: fetchImpl, openCache: async () => cache })
    expect(calls).toBe(1)
    expect(new Uint8Array(first ?? new ArrayBuffer(0))).toEqual(new Uint8Array(good))
    const second = await fetchVerifiedBytes(spec, { fetch: fetchImpl, openCache: async () => cache })
    expect(calls).toBe(1)
    expect(new Uint8Array(second ?? new ArrayBuffer(0))).toEqual(new Uint8Array(good))
    expect(store.size).toBe(1)
  })

  it('calls fetch with a receiver, the way window.fetch requires', async () => {
    const good = Uint8Array.from([4, 5, 6, 7]).buffer
    const hash = await sha256Hex(good)
    const fetchImpl = function (this: unknown): Promise<Response> {
      if (this == null) throw new TypeError('Illegal invocation')
      return Promise.resolve(new Response(good.slice(0), { headers: { 'Content-Length': '4' } }))
    }
    const bytes = await fetchVerifiedBytes(
      { url: 'https://example.test/model.tar.gz', sha256: hash, bytes: 4 },
      { fetch: fetchImpl, openCache: async () => null },
    )
    expect(new Uint8Array(bytes ?? new ArrayBuffer(0))).toEqual(new Uint8Array(good))
  })

  it('drops a tampered response and still returns the bytes when the cache put fails', async () => {
    const good = Uint8Array.from([8, 8, 8]).buffer
    const hash = await sha256Hex(good)
    const bad = await fetchVerifiedBytes(
      { url: 'https://example.test/model.tar.gz', sha256: hash, bytes: 3 },
      {
        fetch: async () => new Response(Uint8Array.from([1, 1, 1]).buffer),
        openCache: async () => memoryCache().cache,
      },
    )
    expect(bad).toBeNull()
    const kept = await fetchVerifiedBytes(
      { url: 'https://example.test/model.tar.gz', sha256: hash, bytes: 3 },
      {
        fetch: async () => new Response(good.slice(0), { headers: { 'Content-Length': '3' } }),
        openCache: async () => ({
          match: async () => null,
          put: async () => {
            throw new Error('quota')
          },
          drop: async () => undefined,
        }),
      },
    )
    expect(new Uint8Array(kept ?? new ArrayBuffer(0))).toEqual(new Uint8Array(good))
  })
})

describe('vosk worker file', () => {
  it('installs the checked archive and does not fetch it', () => {
    const worker = readFileSync('public/vosk-worker.js', 'utf8')
    expect(worker).toContain('installVerifiedArchive(modelBytes, modelPath)')
    expect(worker).not.toContain('downloadAndExtract(fullModelUrl')
    expect(worker).toContain('The worker does not fetch the model')
    expect(worker).not.toContain('createObjectURL')
  })
})
