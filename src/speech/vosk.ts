import { publicUrl } from '../public-url'
import type { Lang } from '../../content/phrase'
import { fetchVerifiedBytes, mayFetchModel, sha256Hex, type ModelCache } from './model-bytes'
import { CONTENT_WER_CORRECT, CONTENT_WER_PARTIAL, confirmedPortuguese, portugueseContentRate, portugueseGrammar } from './text-match'
import { VoskModel } from './vosk-client'

/**
 * Small Vosk models from https://alphacephei.com/vosk/models, each Apache 2.0.
 * The page serves a tar.gz, which is what the worker reads. The archive is
 * the upstream zip repacked with the same files and one top folder. It is not
 * rearranged. SHA-256 is of that tar.gz.
 */
export type SpeechModelFile = {
  readonly file: string
  readonly sha256: string
  readonly bytes: number
  readonly zipSha256: string
  readonly zipBytes: number
}

export const SPEECH_MODELS: Record<Lang, SpeechModelFile> = {
  de: {
    file: 'models/vosk-model-small-de-0.15.tar.gz',
    sha256: '96239a97c3ea21a5e10dc98a64ca90b33b321174fdaf1bf23330100cee318eae',
    bytes: 46501380,
    zipSha256: 'b7e53c90b1f0a38456f4cd62b366ecd58803cd97cd42b06438e2c131713d5e43',
    zipBytes: 46499967,
  },
  en: {
    file: 'models/vosk-model-small-en-us-0.15.tar.gz',
    sha256: 'c047d1aadfde789344ba10c5b7eb05665f77bdbc71e14fa17d138d66ae2bb6d6',
    bytes: 41206105,
    zipSha256: '30f26242c4eb449f948e42cb302dd7a686cb29a3423a8367f99ff41780942498',
    zipBytes: 41205931,
  },
  'pt-BR': {
    file: 'models/vosk-model-small-pt-0.3.tar.gz',
    sha256: 'b0dba777c534e3adfce4c72340225182962dfc62d6dc4b4bf67dccd1bb4694dd',
    bytes: 32454947,
    zipSha256: '6e1ce909032e1afa7a88e68a3d628ecafff302bdf195befab308826c395e93b7',
    zipBytes: 32453112,
  },
  vi: {
    file: 'models/vosk-model-small-vn-0.4.tar.gz',
    sha256: '28942c7bb5cc1ec7acc8937f56817ed08a6f935c0d9adfb68804e72736932d40',
    bytes: 33657483,
    zipSha256: 'efe5c8494212110471a79befc48c79da679e5b1fc52a4ffb500222ff86d622e5',
    zipBytes: 33656337,
  },
}

const CACHE = 'travel-talk-vosk'

export type SpeechPhase = 'idle' | 'loading' | 'ready' | 'failed'

export type SpeechState = {
  phase: SpeechPhase
  progress: number
}

type Listener = (state: SpeechState) => void

type Slot = {
  state: SpeechState
  listeners: Set<Listener>
  loading: Promise<VoskModel | null> | null
  model: VoskModel | null
}

const slots = new Map<Lang, Slot>()
const accepted = new Set<Lang>()
let active: Lang | null = null

function slotFor(lang: Lang): Slot {
  const found = slots.get(lang)
  if (found) return found
  const created: Slot = { state: { phase: 'idle', progress: 0 }, listeners: new Set(), loading: null, model: null }
  slots.set(lang, created)
  return created
}

export function speechState(lang: Lang): SpeechState {
  return slotFor(lang).state
}

export function subscribeSpeech(lang: Lang, listener: Listener): () => void {
  const slot = slotFor(lang)
  slot.listeners.add(listener)
  listener(slot.state)
  return () => slot.listeners.delete(listener)
}

function publish(lang: Lang, next: SpeechState): void {
  const slot = slotFor(lang)
  slot.state = next
  for (const listener of slot.listeners) listener(next)
}

/** Unit tests must not fetch a model or start the WASM worker. */
export function speechModelsInThisRun(): boolean {
  const mode: string = import.meta.env.MODE
  return mode !== 'test'
}

export function connectionSavesData(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  return connection?.saveData === true
}

function modelUrl(file: string): string {
  return new URL(publicUrl(file), window.location.href).href
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

/** True when the checked archive for this language is already on the device. This does not fetch. */
export async function speechModelCached(lang: Lang): Promise<boolean> {
  const spec = SPEECH_MODELS[lang]
  const cache = await browserCache()
  if (!cache) return false
  const url = modelUrl(spec.file)
  const hit = await cache.match(url)
  if (!hit) return false
  if ((await sha256Hex(hit)) === spec.sha256) return true
  await cache.drop(url)
  return false
}

function release(lang: Lang): void {
  const slot = slots.get(lang)
  if (!slot) return
  try {
    slot.model?.terminate()
  } catch {
    // The worker may already be gone.
  }
  slot.model = null
  slot.loading = null
  slot.state = { phase: 'idle', progress: 0 }
}

async function loadModel(lang: Lang): Promise<VoskModel | null> {
  const spec = SPEECH_MODELS[lang]
  const url = modelUrl(spec.file)
  const bytes = await fetchVerifiedBytes(
    { url, sha256: spec.sha256, bytes: spec.bytes },
    {
      fetch: (input, init) => fetch(input, init),
      openCache: browserCache,
      onProgress: (progress) => {
        if (active === lang) publish(lang, { phase: 'loading', progress })
      },
    },
  )
  if (!bytes || active !== lang) return null
  publish(lang, { phase: 'loading', progress: 100 })
  return VoskModel.open(url, bytes)
}

/**
 * Start the download after the person asks, or from a checked cache.
 * A later language replaces the worker. Without a yes, this does not fetch.
 */
export function ensureSpeechModel(lang: Lang): Promise<VoskModel | null> {
  if (!speechModelsInThisRun()) return Promise.resolve(null)
  if (active && active !== lang) release(active)
  active = lang
  if (!accepted.has(lang)) return Promise.resolve(null)
  const slot = slotFor(lang)
  if (slot.model) return Promise.resolve(slot.model)
  if (!slot.loading) {
    publish(lang, { phase: 'loading', progress: slot.state.progress })
    const pending = loadModel(lang)
      .then((next) => {
        if (slot.loading !== pending || active !== lang) {
          next?.terminate()
          return null
        }
        slot.model = next
        publish(lang, next ? { phase: 'ready', progress: 100 } : { phase: 'failed', progress: 0 })
        return next
      })
      .catch(() => {
        if (slot.loading === pending && active === lang) publish(lang, { phase: 'failed', progress: 0 })
        return null
      })
    slot.loading = pending
  }
  return slot.loading
}

/** Use the checked cache when it is there. Otherwise wait for a tap. Never fetches by itself. */
export async function prepareSpeechModel(lang: Lang): Promise<'cached' | 'offer'> {
  if (!speechModelsInThisRun()) return 'offer'
  if (await speechModelCached(lang)) {
    accepted.add(lang)
    void ensureSpeechModel(lang)
    return 'cached'
  }
  return 'offer'
}

/** The tap that allows the download for this language. saveData does not add a silent fetch. */
export function acceptSpeechModel(lang: Lang): void {
  accepted.add(lang)
  if (!mayFetchModel({ cached: false, accepted: true })) return
  void ensureSpeechModel(lang)
}

export type HeardSpeech = {
  text: string
  confidence: number | null
}

/**
 * Recognised words, or null when the model is missing, declined, or the worker fails.
 * An empty string is a real result: the model heard no words.
 * A timeout is null, so the page keeps the rating without the words.
 */
export async function recognizeSpeech(
  lang: Lang,
  samples: Float32Array,
  sampleRate: number,
  expected = '',
): Promise<HeardSpeech | null> {
  if (!speechModelsInThisRun() || sampleRate <= 0 || samples.length === 0) return null
  const ready = await ensureSpeechModel(lang)
  if (!ready) return null
  const free = await ready.recognize(samples, sampleRate, null)
  if (!free || lang !== 'pt-BR') return free
  const grammarText = portugueseGrammar(expected)
  const rate = portugueseContentRate(expected, free.text, free.confidence)
  const partial = Math.abs(rate - CONTENT_WER_PARTIAL) < 1e-9
  if (!grammarText || rate <= CONTENT_WER_CORRECT || partial) return free
  const checked = await ready.recognize(samples, sampleRate, grammarText)
  return confirmedPortuguese(expected, free, checked)
}
