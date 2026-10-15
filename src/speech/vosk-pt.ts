import { publicUrl } from '../public-url'
import type { Model } from 'vosk-browser'

/**
 * The archive the page serves. It is the Alpha Cephei zip
 * vosk-model-small-pt-0.3 repacked as tar.gz, which is what vosk-browser reads.
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
let loading: Promise<Model | null> | null = null
let model: Model | null = null

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

function modelUrl(): string {
  return new URL(publicUrl(PORTUGUESE_MODEL_FILE), window.location.href).href
}

async function sha256(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function readCached(url: string): Promise<ArrayBuffer | null> {
  if (!('caches' in window)) return null
  const cache = await caches.open(CACHE)
  const hit = await cache.match(url)
  if (!hit) return null
  return hit.arrayBuffer()
}

async function store(url: string, bytes: ArrayBuffer): Promise<void> {
  if (!('caches' in window)) return
  const cache = await caches.open(CACHE)
  await cache.put(url, new Response(bytes, { headers: { 'Content-Type': 'application/gzip', 'Content-Length': String(bytes.byteLength) } }))
}

async function download(url: string): Promise<ArrayBuffer | null> {
  const cached = await readCached(url)
  if (cached) {
    if ((await sha256(cached)) === PORTUGUESE_MODEL_SHA256) {
      publish({ phase: 'loading', progress: 100 })
      return cached
    }
    if ('caches' in window) {
      const cache = await caches.open(CACHE)
      await cache.delete(url)
    }
  }
  const response = await fetch(url, { cache: 'reload' })
  if (!response.ok || !response.body) return null
  const total = Number(response.headers.get('Content-Length')) || PORTUGUESE_MODEL_BYTES
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0
  for (;;) {
    const step = await reader.read()
    if (step.done) break
    chunks.push(step.value)
    received += step.value.byteLength
    publish({ phase: 'loading', progress: Math.min(99, Math.round((received / total) * 100)) })
  }
  const bytes = new Uint8Array(received)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  const buffer = bytes.buffer
  if ((await sha256(buffer)) !== PORTUGUESE_MODEL_SHA256) {
    if ('caches' in window) {
      const cache = await caches.open(CACHE)
      await cache.delete(url)
    }
    return null
  }
  await store(url, buffer)
  publish({ phase: 'loading', progress: 100 })
  return buffer
}

async function loadModel(): Promise<Model | null> {
  const url = modelUrl()
  const bytes = await download(url)
  if (!bytes) return null
  const vosk = await import(/* webpackChunkName: "vosk" */ 'vosk-browser')
  return vosk.createModel(url)
}

/** Start the one download. Later calls share it. A failure stays failed until reload. */
export function ensurePortugueseModel(): Promise<Model | null> {
  if (!speechModelsInThisRun()) return Promise.resolve(null)
  if (model) return Promise.resolve(model)
  if (!loading) {
    publish({ phase: 'loading', progress: state.progress })
    loading = loadModel()
      .then((next) => {
        model = next
        publish(next ? { phase: 'ready', progress: 100 } : { phase: 'failed', progress: 0 })
        return next
      })
      .catch(() => {
        publish({ phase: 'failed', progress: 0 })
        return null
      })
  }
  return loading
}

/**
 * Recognised words, or null when the model is missing or the worker fails.
 * An empty string is a real result: the model heard no words.
 */
export async function recognizePortuguese(samples: Float32Array, sampleRate: number): Promise<string | null> {
  if (!speechModelsInThisRun() || sampleRate <= 0 || samples.length === 0) return null
  const ready = await ensurePortugueseModel()
  if (!ready) return null
  return new Promise((resolve) => {
    let text = ''
    let settled = false
    let finalRequested = false
    let quiet = 0
    let timer = 0
    const recognizer = new ready.KaldiRecognizer(sampleRate)
    const finish = (value: string | null) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      window.clearTimeout(quiet)
      try {
        recognizer.remove()
      } catch {
        // The worker may already have dropped it.
      }
      resolve(value)
    }
    const arm = () => {
      window.clearTimeout(quiet)
      quiet = window.setTimeout(() => finish(text), 1200)
    }
    timer = window.setTimeout(() => finish(text), 15000)
    recognizer.on('result', (message) => {
      if (message.event !== 'result') return
      const next = message.result?.text ?? ''
      if (next) text = next
      if (finalRequested && text) arm()
    })
    recognizer.on('error', () => finish(null))
    try {
      const width = 4800
      for (let index = 0; index < samples.length; index += width) {
        recognizer.acceptWaveformFloat(samples.subarray(index, index + width), sampleRate)
      }
      finalRequested = true
      recognizer.retrieveFinalResult()
    } catch {
      finish(null)
    }
  })
}
