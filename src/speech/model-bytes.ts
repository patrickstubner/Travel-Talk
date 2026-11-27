export type VerifiedModel = {
  url: string
  sha256: string
  bytes: number
}

export async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export type ModelCache = {
  match: (url: string) => Promise<ArrayBuffer | null>
  put: (url: string, body: ArrayBuffer) => Promise<void>
  drop: (url: string) => Promise<void>
}

export type VerifiedFetch = {
  fetch: typeof fetch
  openCache: () => Promise<ModelCache | null>
  onProgress?: (percent: number) => void
}

/**
 * A cached hit is not a download. A second response is never read: the
 * buffer that leaves this function is the one whose SHA-256 matched.
 * cache.put may fail when the disk is full. The checked bytes still return.
 */
export async function fetchVerifiedBytes(spec: VerifiedModel, deps: VerifiedFetch): Promise<ArrayBuffer | null> {
  const cache = await deps.openCache()
  const cached = cache ? await cache.match(spec.url) : null
  if (cached && (await sha256Hex(cached)) === spec.sha256) {
    deps.onProgress?.(100)
    return cached
  }
  if (cached && cache) await cache.drop(spec.url)
  // window.fetch throws "Illegal invocation" when it is handed over and called bare.
  const response = await deps.fetch.call(globalThis, spec.url, { cache: 'reload' })
  if (!response.ok || !response.body) return null
  const total = Number(response.headers.get('Content-Length')) || spec.bytes
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0
  for (;;) {
    const step = await reader.read()
    if (step.done) break
    chunks.push(step.value)
    received += step.value.byteLength
    deps.onProgress?.(Math.min(99, Math.round((received / total) * 100)))
  }
  const bytes = new Uint8Array(received)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  const buffer = bytes.buffer
  if ((await sha256Hex(buffer)) !== spec.sha256) {
    if (cache) await cache.drop(spec.url)
    return null
  }
  if (cache) {
    try {
      await cache.put(spec.url, buffer.slice(0))
    } catch {
      // The checked bytes stay in memory. A full disk must not fail the load.
    }
  }
  deps.onProgress?.(100)
  return buffer
}

/** No network fetch until the person asks. A cached file is not a fetch. saveData does not start one either. */
export function mayFetchModel(input: { cached: boolean; accepted: boolean }): boolean {
  return input.accepted && !input.cached
}
