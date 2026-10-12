import { ALIGN_FILE, AUDIO_FILE } from '../content/resolve'
import { mixToMono } from '../pitch/contour'
import { publicUrl } from '../public-url'
import type { SpeedStep } from './speed'

let known: Set<string> | null = null
let loading: Promise<Set<string>> | null = null
let current: HTMLAudioElement | null = null
let clock = 0
let playToken = 0

function stopClock(): void {
  if (clock !== 0 && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(clock)
  clock = 0
}

/** Stops the clip that is playing, including one whose start has not finished yet. */
export function stopClip(): void {
  playToken += 1
  stopClock()
  const audio = current
  current = null
  if (!audio) return
  audio.onended = null
  audio.pause()
}

/** Tests start from an empty list. The page keeps the list for the session. */
export function clearManifestCache(): void {
  known = null
  loading = null
}

export function loadManifest(): Promise<Set<string>> {
  if (known) return Promise.resolve(known)
  if (!loading) {
    loading = fetch(publicUrl('audio/manifest.json'))
      .then((response) => (response.ok ? response.json() : []))
      .then((data: unknown) => {
        const files = new Set<string>()
        if (Array.isArray(data)) {
          for (const item of data) {
            if (typeof item === 'string' && (AUDIO_FILE.test(item) || ALIGN_FILE.test(item))) files.add(item)
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
  onDuration?: (seconds: number) => void,
  onStop?: () => void,
): Promise<'file' | 'offline'> {
  const token = playToken
  const superseded = (): 'file' => {
    onStop?.()
    return 'file'
  }
  let files: Set<string>
  try {
    files = await loadManifest()
  } catch {
    return 'offline'
  }
  if (token !== playToken) return superseded()
  if (!AUDIO_FILE.test(file) || !files.has(file)) return 'offline'
  const cached = await clipIsCached(file)
  if (token !== playToken) return superseded()
  if (!cached && typeof navigator !== 'undefined' && navigator.onLine === false) return 'offline'
  stopClock()
  current?.pause()
  if (token !== playToken) return superseded()
  const audio = new Audio(publicUrl(`audio/${file}`))
  audio.playbackRate = 1
  let halted = false
  const halt = (): void => {
    if (halted) return
    halted = true
    audio.onended = null
    audio.onpause = null
    audio.onerror = null
    if (current === audio) {
      stopClock()
      current = null
    }
    audio.pause()
    onStop?.()
  }
  audio.onloadedmetadata = () => {
    if (token !== playToken || halted) return
    if (Number.isFinite(audio.duration) && audio.duration > 0) onDuration?.(audio.duration)
  }
  audio.onended = () => {
    if (halted) return
    halted = true
    audio.onpause = null
    audio.onerror = null
    if (current === audio) stopClock()
    if (token === playToken) onEnd?.()
  }
  audio.onerror = () => {
    if (halted) return
    const stillCurrent = token === playToken
    halt()
    // A decode error used to notify the end. Callers without a stop signal still leave «Läuft».
    if (stillCurrent) onEnd?.()
  }
  audio.onpause = () => {
    if (audio.ended || halted) return
    halt()
  }
  current = audio
  try {
    await audio.play()
  } catch {
    if (halted) return 'file'
    halted = true
    audio.onended = null
    audio.onpause = null
    audio.onerror = null
    if (current === audio) {
      stopClock()
      current = null
    }
    audio.pause()
    if (token !== playToken) {
      onStop?.()
      return 'file'
    }
    if (!cached) return 'offline'
    // play() refused a file that is already stored (NotAllowedError, decode). The old end
    // signal still fires, and the stop signal tells callers that passed one to reset.
    onStop?.()
    onEnd?.()
    return 'file'
  }
  if (halted) return 'file'
  if (token !== playToken) {
    halt()
    return 'file'
  }
  if (onTime && typeof requestAnimationFrame === 'function') {
    const tick = (): void => {
      if (current !== audio || audio.paused || audio.ended) {
        clock = 0
        return
      }
      onTime(audio.currentTime)
      clock = requestAnimationFrame(tick)
    }
    clock = requestAnimationFrame(tick)
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
