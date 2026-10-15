import { publicUrl } from '../public-url'
import { fetchVerifiedBytes, mayFetchModel, sha256Hex, type ModelCache } from './model-bytes'
import { VoskModel } from './vosk-client'

/**
 * The archive the page serves. It is the Alpha Cephei zip
 * vosk-model-small-pt-0.3 repacked as tar.gz, which is what the worker reads.
 * SHA-256 of that tar.gz. The upstream zip is
 * 6e1ce909032e1afa7a88e68a3d628ecafff302bdf195befab308826c395e93b7.
 */
export const PORTUGUESE_MODEL_FILE = 'models/vosk-model-small-pt-0.3.tar.gz'
export const PORTUGUESE_MODEL_SHA256 = 'b0dba777c534e3adfce4c72340225182962dfc62d6dc4b4bf67dccd1bb4694dd'
export const PORTUGUESE_MODEL_BYTES = 32454947

const CACHE = 'travel-talk-vosk'

export type SpeechPhase = 'idle' | 'loading' | 'ready' | 'failed'

export type SpeechState = {
  phase: SpeechPhase
  progress: number
}

type Listener = (state: SpeechState) => void

let state: SpeechState = { phase: 'idle', progress: 0 }
const listeners = new Set<Listener>()
let loading: Promise<VoskModel | null> | null = null
let model: VoskModel | null = null
let accepted = false

export function portugueseSpeechState(): SpeechState {
  return state
}

export function subscribePortugueseSpeech(listener: Listener): () => void {
  listeners.add(listener)
  listener(state)
  return () => listeners.delete(listener)
}

function publish(next: SpeechState): void {
  state = next
  for (const listener of listeners) listener(state)
}

/** Unit tests must not fetch the model or start the WASM worker. */
export function speechModelsInThisRun(): boolean {
  const mode: string = import.meta.env.MODE
  return mode !== 'test'
}

export function connectionSavesData(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  return connection?.saveData === true
}

function modelUrl(): string {
  return new URL(publicUrl(PORTUGUESE_MODEL_FILE), window.location.href).href
}

async function browserCache(): Promise<ModelCache | null> {
  if (!('caches' in window)) return null
  try {
    const cache = await caches.open(CACHE)
    return {
      async match(url) {
        const hit = await cache.match(url)
        return hit ? hit.arrayBuffer() : null
      },
      async put(url, body) {
        await cache.put(
          url,
          new Response(body, { headers: { 'Content-Type': 'application/gzip', 'Content-Length': String(body.byteLength) } }),
        )
      },
      async drop(url) {
        await cache.delete(url)
      },
    }
  } catch {
    return null
  }
}

/** True when the checked archive is already on the device. This does not fetch. */
export async function portugueseModelCached(): Promise<boolean> {
  const cache = await browserCache()
  if (!cache) return false
  const hit = await cache.match(modelUrl())
  if (!hit) return false
  if ((await sha256Hex(hit)) === PORTUGUESE_MODEL_SHA256) return true
  await cache.drop(modelUrl())
  return false
}

async function loadModel(): Promise<VoskModel | null> {
  const url = modelUrl()
  const bytes = await fetchVerifiedBytes(
    { url, sha256: PORTUGUESE_MODEL_SHA256, bytes: PORTUGUESE_MODEL_BYTES },
    {
      fetch: (input, init) => fetch(input, init),
      openCache: browserCache,
      onProgress: (progress) => publish({ phase: 'loading', progress }),
    },
  )
  if (!bytes) return null
  publish({ phase: 'loading', progress: 100 })
  return VoskModel.open(url, bytes)
}

/**
 * Start the download after the person asks, or from a checked cache.
 * A failure stays failed until reload. Without a yes, this does not fetch.
 */
export function ensurePortugueseModel(): Promise<VoskModel | null> {
  if (!speechModelsInThisRun()) return Promise.resolve(null)
  if (model) return Promise.resolve(model)
  if (!accepted) return Promise.resolve(null)
  if (!loading) {
    publish({ phase: 'loading', progress: state.progress })
    const pending = loadModel()
      .then((next) => {
        if (loading !== pending) {
          next?.terminate()
          return null
        }
        model = next
        publish(next ? { phase: 'ready', progress: 100 } : { phase: 'failed', progress: 0 })
        return next
      })
      .catch(() => {
        if (loading === pending) publish({ phase: 'failed', progress: 0 })
        return null
      })
    loading = pending
  }
  return loading
}

/** Use the checked cache when it is there. Otherwise wait for a tap. Never fetches by itself. */
export async function preparePortugueseModel(): Promise<'cached' | 'offer'> {
  if (!speechModelsInThisRun()) return 'offer'
  if (await portugueseModelCached()) {
    accepted = true
    void ensurePortugueseModel()
    return 'cached'
  }
  return 'offer'
}

/** The tap that allows the download. saveData does not add a silent fetch of its own. */
export function acceptPortugueseModel(): void {
  accepted = true
  if (!mayFetchModel({ cached: false, accepted })) return
  void ensurePortugueseModel()
}

/**
 * Recognised words, or null when the model is missing, declined, or the worker fails.
 * An empty string is a real result: the model heard no words.
 * A timeout is null, so the page keeps the rating without the words.
 */
export async function recognizePortuguese(
  samples: Float32Array,
  sampleRate: number,
  grammar: string | null = null,
): Promise<{ text: string; confidence: number | null } | null> {
  if (!speechModelsInThisRun() || sampleRate <= 0 || samples.length === 0) return null
  const ready = await ensurePortugueseModel()
  if (!ready) return null
  return ready.recognize(samples, sampleRate, grammar)
}
