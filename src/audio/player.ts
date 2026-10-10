import type { Lang } from '../../content/phrase'
import { AUDIO_FILE } from '../content/resolve'
import { mixToMono } from '../pitch/contour'
import { publicUrl } from '../public-url'
import type { SpeedStep } from './speed'

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
    loading = fetch(publicUrl('audio/manifest.json'))
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

export function speak(text: string, lang: Lang, rate: SpeedStep = 1): void {
  if (typeof speechSynthesis === 'undefined') return
  speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = SPEECH_LANG[lang]
  utterance.rate = rate
  speechSynthesis.speak(utterance)
}

/**
 * Plays a pre-generated file. `playbackRate` stays 1: slowing the element can
 * shift pitch, and that would bend Vietnamese tones. The tempo is the file.
 * The browser voice is only the fallback, and then `utterance.rate` is the chosen step.
 */
export async function playClip(file: string, speech: string, lang: Lang, rate: SpeedStep = 1): Promise<'file' | 'synth'> {
  const files = await loadManifest()
  if (AUDIO_FILE.test(file) && files.has(file)) {
    current?.pause()
    const audio = new Audio(publicUrl(`audio/${file}`))
    audio.playbackRate = 1
    current = audio
    await audio.play()
    return 'file'
  }
  speak(speech, lang, rate)
  return 'synth'
}

export async function decodeContourFile(file: string): Promise<{ samples: Float32Array; sampleRate: number } | null> {
  const files = await loadManifest()
  if (!AUDIO_FILE.test(file) || !files.has(file)) return null
  const response = await fetch(publicUrl(`audio/${file}`))
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
