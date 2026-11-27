export type VerifiedModel = {
  url: string
  sha256: string
  bytes: number
}

/** Give up a hanging same-origin download after five minutes. */
export const MODEL_DOWNLOAD_TIMEOUT_MS = 300_000

export async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export type ModelCache = {
  match: (url: string) => Promise<ArrayBuffer | null>
  put: (url: string, body: ArrayBuffer) => Promise<void>
  drop: (url: string) => Promise<void>
}

export class ModelDownloadAbortError extends Error {
  readonly reason: unknown

  constructor(reason: unknown) {
    super('Model download aborted')
    this.name = 'ModelDownloadAbortError'
    this.reason = reason
  }
}

export function isCancelOrSwitchAbort(error: unknown): boolean {
  if (!(error instanceof ModelDownloadAbortError)) return false
  return error.reason === 'cancel' || error.reason === 'switch'
}

export type VerifiedFetch = {
  fetch: typeof fetch
  openCache: () => Promise<ModelCache | null>
  onProgress?: (percent: number) => void
  signal?: AbortSignal
  timeoutMs?: number
}

function abortError(reason: unknown): ModelDownloadAbortError {
  return new ModelDownloadAbortError(reason)
}

function readOrAbort<T>(read: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(abortError(signal.reason))
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(abortError(signal.reason))
    signal.addEventListener('abort', onAbort, { once: true })
    read.then(
      (value) => {
        signal.removeEventListener('abort', onAbort)
        resolve(value)
      },
      (error) => {
        signal.removeEventListener('abort', onAbort)
        reject(error)
      },
    )
  })
}

/**
 * A cached hit is not a download. A second response is never read: the
 * buffer that leaves this function is the one whose SHA-256 matched.
 * cache.put may fail when the disk is full. The checked bytes still return.
 * A download stops when the signal aborts, the timeout elapses, or more
 * bytes arrive than the pinned size.
 */
export async function fetchVerifiedBytes(spec: VerifiedModel, deps: VerifiedFetch): Promise<ArrayBuffer | null> {
  const cache = await deps.openCache()
  const cached = cache ? await cache.match(spec.url) : null
  if (cached && (await sha256Hex(cached)) === spec.sha256) {
    deps.onProgress?.(100)
    return cached
  }
  if (cached && cache) await cache.drop(spec.url)

  const timeoutMs = deps.timeoutMs ?? MODEL_DOWNLOAD_TIMEOUT_MS
  const local = new AbortController()
  const onParentAbort = () => local.abort(deps.signal?.reason)
  if (deps.signal?.aborted) local.abort(deps.signal.reason)
  else deps.signal?.addEventListener('abort', onParentAbort, { once: true })
  const timer =
    timeoutMs > 0
      ? setTimeout(() => {
          local.abort('timeout')
        }, timeoutMs)
      : undefined

  try {
    if (local.signal.aborted) throw abortError(local.signal.reason)
    // window.fetch throws "Illegal invocation" when it is handed over and called bare.
    const response = await deps.fetch.call(globalThis, spec.url, { cache: 'reload', signal: local.signal })
    if (!response.ok || !response.body) return null
    const total = Number(response.headers.get('Content-Length')) || spec.bytes
    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let received = 0
    for (;;) {
      if (local.signal.aborted) {
        await reader.cancel().catch(() => undefined)
        throw abortError(local.signal.reason)
      }
      const step = await readOrAbort(reader.read(), local.signal)
      if (step.done) break
      chunks.push(step.value)
      received += step.value.byteLength
      if (received > spec.bytes) {
        await reader.cancel().catch(() => undefined)
        return null
      }
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
  } catch (error) {
    if (error instanceof ModelDownloadAbortError) throw error
    if (local.signal.aborted) throw abortError(local.signal.reason)
    throw error
  } finally {
    if (timer) clearTimeout(timer)
    deps.signal?.removeEventListener('abort', onParentAbort)
  }
}

/** No network fetch until the person asks. A cached file is not a fetch. saveData does not start one either. */
export function mayFetchModel(input: { cached: boolean; accepted: boolean }): boolean {
  return input.accepted && !input.cached
}
