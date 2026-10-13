import { analyzeModel, analyzeUser, type ClipFeatures } from './analyze'
import type { AnalysisRequest, AnalysisResponse } from './analyze.worker'

let worker: Worker | null | undefined
let nextId = 0
const pending = new Map<number, { resolve: (features: ClipFeatures) => void; reject: (error: Error) => void }>()

/**
 * Model features for one sample buffer. The buffer is the key, so a second
 * take of the same file does not analyse it again. The microphone buffer
 * is never put in this map.
 */
const modelCache = new WeakMap<Float32Array, Promise<ClipFeatures>>()

function testsAreRunning(): boolean {
  return typeof process !== 'undefined' && process.env.VITEST === 'true'
}

/** The analysis worker, or null in tests and when the browser has none. */
export function pitchWorker(): Worker | null {
  if (worker !== undefined) return worker
  if (testsAreRunning() || typeof Worker === 'undefined') {
    worker = null
    return null
  }
  try {
    const created = new Worker(new URL('./analyze.worker.ts', import.meta.url), { type: 'module' })
    created.onmessage = (event: MessageEvent<AnalysisResponse>) => {
      const waiting = pending.get(event.data.id)
      if (!waiting) return
      pending.delete(event.data.id)
      waiting.resolve({
        contour: event.data.contour,
        energy: event.data.energy,
        bands: event.data.bands,
        plainBands: event.data.plainBands ?? event.data.bands,
      })
    }
    created.onerror = () => {
      worker = null
      for (const waiting of pending.values()) waiting.reject(new Error('pitch worker failed'))
      pending.clear()
    }
    worker = created
  } catch {
    worker = null
  }
  return worker
}

function locally(request: Omit<AnalysisRequest, 'id'>): ClipFeatures {
  return request.kind === 'model'
    ? analyzeModel(request.samples, request.rate)
    : analyzeUser(request.samples, request.rate, request.modelBands)
}

function ask(request: Omit<AnalysisRequest, 'id'>): Promise<ClipFeatures> {
  const current = pitchWorker()
  if (!current) return Promise.resolve(locally(request))
  const id = nextId + 1
  nextId = id
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    // Copy, do not transfer. Playback still holds the samples.
    current.postMessage({ ...request, id })
  })
}

export function analyzeModelCached(samples: Float32Array, rate: number): Promise<ClipFeatures> {
  const hit = modelCache.get(samples)
  if (hit) return hit
  const job = ask({ kind: 'model', samples, rate, modelBands: null }).catch((error: unknown) => {
    modelCache.delete(samples)
    throw error
  })
  modelCache.set(samples, job)
  return job
}

export function analyzeUserOnce(
  samples: Float32Array,
  rate: number,
  modelBands: number[][] | null,
): Promise<ClipFeatures> {
  return ask({ kind: 'user', samples, rate, modelBands })
}
