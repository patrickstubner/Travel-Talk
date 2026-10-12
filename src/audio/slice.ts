export type Slice = {
  samples: Float32Array
  sampleRate: number
  start: number
  end: number
}

let generation = 0
let current: AudioBufferSourceNode | null = null
let currentContext: AudioContext | null = null

export function stopSlices(): void {
  generation += 1
  try {
    current?.stop()
  } catch {
    // The slice can already have ended.
  }
  const context = currentContext
  current = null
  currentContext = null
  if (context) void context.close()
}

export async function playSequence(parts: Slice[]): Promise<void> {
  stopSlices()
  const token = generation
  for (const part of parts) {
    if (token !== generation) return
    await playOne(part, token)
  }
}

function playOne(part: Slice, token: number): Promise<void> {
  if (token !== generation || typeof AudioContext === 'undefined' || part.sampleRate <= 0) return Promise.resolve()
  const from = Math.max(0, Math.floor(part.start * part.sampleRate))
  const to = Math.min(part.samples.length, Math.floor(part.end * part.sampleRate))
  if (to - from < 2) return Promise.resolve()
  const context = new AudioContext()
  currentContext = context
  const slice = part.samples.slice(from, to)
  const buffer = context.createBuffer(1, slice.length, part.sampleRate)
  buffer.copyToChannel(slice, 0)
  const source = context.createBufferSource()
  source.buffer = buffer
  source.connect(context.destination)
  current = source
  return new Promise((resolve) => {
    source.onended = () => {
      if (current === source) {
        current = null
        currentContext = null
      }
      void context.close()
      resolve()
    }
    if (token !== generation) {
      void context.close()
      resolve()
      return
    }
    source.start()
  })
}
