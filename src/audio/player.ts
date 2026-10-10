import type { Lang } from '../../content/phrase'
import { AUDIO_FILE } from '../content/resolve'
import { mixToMono } from '../pitch/contour'

const SPEECH_LANG: Record<Lang, string> = {
  de: 'de-DE',
  en: 'en-US',
  'pt-BR': 'pt-BR',
  vi: 'vi-VN',
}

let known: Set<string> | null = null
let loading: Promise<Set<string>> | null = null
let current: HTMLAudioElement | null = null

export function loadManifest(): Promise<Set<string>> {
  if (known) return Promise.resolve(known)
  if (!loading) {
    loading = fetch(`${import.meta.env.BASE_URL}audio/manifest.json`)
      .then((response) => (response.ok ? response.json() : []))
      .then((data: unknown) => {
        const files = new Set<string>()
        if (Array.isArray(data)) {
          for (const item of data) {
            if (typeof item === 'string' && AUDIO_FILE.test(item)) files.add(item)
          }
        }
        known = files
        return files
      })
      .catch(() => {
        known = new Set()
        return known
      })
  }
  return loading
}

export function speak(text: string, lang: Lang): void {
  if (typeof speechSynthesis === 'undefined') return
  speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = SPEECH_LANG[lang]
  utterance.rate = 1
  speechSynthesis.speak(utterance)
}

export async function playClip(file: string, speech: string, lang: Lang): Promise<'file' | 'synth'> {
  const files = await loadManifest()
  if (AUDIO_FILE.test(file) && files.has(file)) {
    current?.pause()
    const audio = new Audio(`${import.meta.env.BASE_URL}audio/${file}`)
    current = audio
    await audio.play()
    return 'file'
  }
  speak(speech, lang)
  return 'synth'
}

export async function decodeContourFile(file: string): Promise<{ samples: Float32Array; sampleRate: number } | null> {
  const files = await loadManifest()
  if (!AUDIO_FILE.test(file) || !files.has(file)) return null
  const response = await fetch(`${import.meta.env.BASE_URL}audio/${file}`)
  if (!response.ok) return null
  const context = new AudioContext()
  try {
    const buffer = await context.decodeAudioData(await response.arrayBuffer())
    return { samples: mixToMono(buffer), sampleRate: buffer.sampleRate }
  } catch {
    return null
  } finally {
    await context.close()
  }
}
