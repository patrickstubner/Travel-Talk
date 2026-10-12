import { mixToMono } from '../pitch/contour'

export type Recording = {
  url: string
  samples: Float32Array | null
  sampleRate: number
}

export type StoppableRecorder = {
  state: string
  stop: () => void
  stream: { getTracks: () => Array<{ stop: () => void }> }
}

export function releaseCapture(
  recorder: StoppableRecorder | null,
  blobUrl: string | null,
  revoke: (url: string) => void = (url) => URL.revokeObjectURL(url),
): void {
  if (recorder && recorder.state !== 'inactive') {
    try {
      recorder.stop()
    } catch {
      // The recorder can already be stopping.
    }
  }
  for (const track of recorder?.stream.getTracks() ?? []) track.stop()
  if (blobUrl) revoke(blobUrl)
}

export const RECORD_LIMIT_MS = 15_000

export type CaptureSession = {
  recorder: MediaRecorder
  release: (blobUrl: string | null) => void
}

export async function startMicrophone(onStop: (recording: Recording) => void): Promise<CaptureSession | null> {
  if (!navigator.mediaDevices?.getUserMedia) return null
  // Noise suppression and automatic gain cost a clean file its stars.
  // Echo cancellation does not, and it keeps the speaker out of the take.
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false },
  })
  const recorder = new MediaRecorder(stream)
  let released = false
  const chunks: Blob[] = []
  recorder.addEventListener('dataavailable', (event) => {
    if (event.data.size > 0) chunks.push(event.data)
  })
  let limitTimer: ReturnType<typeof setTimeout> | null = null
  function clearLimit(): void {
    if (limitTimer == null) return
    clearTimeout(limitTimer)
    limitTimer = null
  }
  recorder.addEventListener('stop', () => {
    clearLimit()
    for (const track of stream.getTracks()) track.stop()
    if (released) return
    const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
    const url = URL.createObjectURL(blob)
    void blob.arrayBuffer().then(async (bytes) => {
      if (released) {
        URL.revokeObjectURL(url)
        return
      }
      const context = new AudioContext()
      try {
        const buffer = await context.decodeAudioData(bytes.slice(0))
        onStop({ url, samples: mixToMono(buffer), sampleRate: buffer.sampleRate })
      } catch {
        onStop({ url, samples: null, sampleRate: 0 })
      } finally {
        await context.close()
      }
    })
  })
  recorder.start()
  limitTimer = setTimeout(() => {
    if (recorder.state === 'recording') recorder.stop()
  }, RECORD_LIMIT_MS)
  return {
    recorder,
    release(blobUrl) {
      clearLimit()
      released = true
      releaseCapture(recorder, blobUrl)
    },
  }
}
