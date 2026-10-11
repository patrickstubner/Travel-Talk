import { AUDIO_FILE } from '../content/resolve'
import { mixToMono } from '../pitch/contour'
import { publicUrl } from '../public-url'
import type { SpeedStep } from './speed'

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
      .catch((error: unknown) => {
        loading = null
        throw error
      })
  }
  return loading
}

async function clipIsCached(file: string): Promise<boolean> {
  if (!('caches' in globalThis)) return false
  const url = publicUrl(`audio/${file}`)
  try {
    const names = await caches.keys()
    for (const name of names) {
      const cache = await caches.open(name)
      if (await cache.match(url)) return true
    }
  } catch {
    return false
  }
  return false
}

/**
 * Plays a pre-generated file. `playbackRate` stays 1: slowing the element can
 * shift pitch, and that would bend Vietnamese tones. The tempo is the file.
 * There is no browser voice. Offline, a missing file is `offline`.
 */
export async function playClip(
  file: string,
  _speech: string,
  _lang: string,
  _rate: SpeedStep = 1,
  onEnd?: () => void,
  onTime?: (seconds: number) => void,
): Promise<'file' | 'offline'> {
  let files: Set<string>
  try {
    files = await loadManifest()
  } catch {
    return 'offline'
  }
  if (!AUDIO_FILE.test(file) || !files.has(file)) return 'offline'
  const cached = await clipIsCached(file)
  if (!cached && typeof navigator !== 'undefined' && navigator.onLine === false) return 'offline'
  current?.pause()
  const audio = new Audio(publicUrl(`audio/${file}`))
  audio.playbackRate = 1
  audio.onended = () => onEnd?.()
  audio.ontimeupdate = () => onTime?.(audio.currentTime)
  current = audio
  try {
    await audio.play()
  } catch {
    if (!cached) return 'offline'
    onEnd?.()
  }
  return 'file'
}

export async function decodeContourFile(file: string): Promise<{ samples: Float32Array; sampleRate: number } | null> {
  let files: Set<string>
  try {
    files = await loadManifest()
  } catch {
    return null
  }
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
