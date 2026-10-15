import { publicUrl } from '../public-url'

export const MODEL_READY_MS = 45_000
export const RECOGNIZE_MS = 20_000

type LoadResult = { event: 'load'; result: boolean }
type ErrorResult = { event: 'error'; error?: string; recognizerId?: string }
type WordResult = { conf?: number; word?: string }
type ResultMessage = {
  event: 'result'
  recognizerId?: string
  result?: { text?: string; result?: WordResult[] }
}

type ServerMessage = LoadResult | ErrorResult | ResultMessage | { event: string; recognizerId?: string }

export type HeardWords = {
  text: string
  confidence: number | null
}

type Listener = (message: ServerMessage) => void

/**
 * Same-origin worker. The verified archive is transferred once.
 * The worker does not fetch the model URL.
 */
export class VoskModel extends EventTarget {
  private readonly worker: Worker
  private ready = false
  private readonly listeners = new Set<Listener>()

  constructor(worker: Worker) {
    super()
    this.worker = worker
    worker.addEventListener('message', (event: MessageEvent<ServerMessage>) => {
      const message = event.data
      if (!message) return
      if (message.event === 'load' && 'result' in message) this.ready = message.result
      for (const listener of this.listeners) listener(message)
    })
  }

  static open(modelUrl: string, modelBytes: ArrayBuffer): Promise<VoskModel> {
    const worker = new Worker(new URL(publicUrl('vosk-worker.js'), window.location.href).href)
    const model = new VoskModel(worker)
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        model.terminate()
        reject(new Error('timeout'))
      }, MODEL_READY_MS)
      const stop = model.listen((message) => {
        if (message.event === 'load' && 'result' in message) {
          window.clearTimeout(timer)
          stop()
          if (message.result) resolve(model)
          else {
            model.terminate()
            reject(new Error('load'))
          }
          return
        }
        if (message.event === 'error' && !('recognizerId' in message && message.recognizerId)) {
          window.clearTimeout(timer)
          stop()
          model.terminate()
          reject(new Error('error' in message && message.error ? message.error : 'worker'))
        }
      })
      worker.addEventListener('error', () => {
        window.clearTimeout(timer)
        stop()
        model.terminate()
        reject(new Error('worker'))
      })
      worker.postMessage({ action: 'load', modelUrl, modelBytes }, [modelBytes])
    })
  }

  listen(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  terminate(): void {
    this.ready = false
    this.worker.postMessage({ action: 'terminate' })
    this.worker.terminate()
  }

  recognize(samples: Float32Array, sampleRate: number, grammar: string | null): Promise<HeardWords | null> {
    if (!this.ready || sampleRate <= 0 || samples.length === 0) return Promise.resolve(null)
    const recognizerId = crypto.randomUUID()
    return new Promise((resolve) => {
      let text = ''
      let confidence: number | null = null
      let settled = false
      let finalRequested = false
      let quiet = 0
      const finish = (value: HeardWords | null) => {
        if (settled) return
        settled = true
        window.clearTimeout(timer)
        window.clearTimeout(quiet)
        this.worker.postMessage({ action: 'remove', recognizerId })
        resolve(value)
      }
      const arm = () => {
        window.clearTimeout(quiet)
        quiet = window.setTimeout(() => finish({ text, confidence }), 1200)
      }
      const timer = window.setTimeout(() => finish(null), RECOGNIZE_MS)
      const stop = this.listen((message) => {
        if (!('recognizerId' in message) || message.recognizerId !== recognizerId) return
        if (message.event === 'error') {
          stop()
          finish(null)
          return
        }
        if (message.event !== 'result' || !('result' in message)) return
        const next = message.result?.text ?? ''
        if (next) text = next
        const words = message.result?.result
        if (words && words.length > 0) {
          let sum = 0
          let count = 0
          for (const word of words) {
            if (typeof word.conf === 'number' && Number.isFinite(word.conf)) {
              sum += word.conf
              count += 1
            }
          }
          if (count > 0) confidence = sum / count
        }
        if (finalRequested) arm()
      })
      try {
        this.worker.postMessage({ action: 'create', recognizerId, sampleRate, grammar: grammar ?? undefined })
        this.worker.postMessage({ action: 'set', recognizerId, key: 'words', value: true })
        const width = 4800
        for (let index = 0; index < samples.length; index += width) {
          const data = samples.subarray(index, index + width).map((value) => value * 0x8000)
          this.worker.postMessage({ action: 'audioChunk', recognizerId, data, sampleRate }, [data.buffer])
        }
        finalRequested = true
        this.worker.postMessage({ action: 'retrieveFinalResult', recognizerId })
      } catch {
        stop()
        finish(null)
      }
    })
  }
}
