import { mixToMono } from '../pitch/contour'

export type Recording = {
  url: string
  samples: Float32Array | null
  sampleRate: number
}

export async function startMicrophone(onStop: (recording: Recording) => void): Promise<MediaRecorder | null> {
  if (!navigator.mediaDevices?.getUserMedia) return null
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const recorder = new MediaRecorder(stream)
  const chunks: Blob[] = []
  recorder.addEventListener('dataavailable', (event) => {
    if (event.data.size > 0) chunks.push(event.data)
  })
  recorder.addEventListener('stop', () => {
    for (const track of stream.getTracks()) track.stop()
    const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
    const url = URL.createObjectURL(blob)
    void blob.arrayBuffer().then(async (bytes) => {
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
  return recorder
}
