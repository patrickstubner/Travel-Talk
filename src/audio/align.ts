import '../zod-setup'
import { z } from 'zod'
import { splitWords } from '../../content/gloss'
import { ALIGN_FILE } from '../content/resolve'
import { publicUrl } from '../public-url'
import { loadManifest } from './player'

/** A larger file is refused before JSON.parse. */
export const ALIGN_MAX_BYTES = 16 * 1024

/**
 * Last word may end this far after the clip, times the tempo scale.
 * 100 % allows 0.1 s. 70 % allows about 0.14 s, because stretching
 * magnifies a small gap between the timing and the encoded file.
 */
export const ALIGN_DURATION_TOLERANCE = 0.1

const wordSchema = z.strictObject({
  start: z.number().finite().min(0).max(60),
  end: z.number().finite().min(0).max(60),
})

const fileSchema = z.strictObject({
  words: z.array(wordSchema).min(1).max(64),
})

/** `name.r70.m4a` and `name.r85.m4a` share the base clip's timings. */
export { ALIGN_FILE }

export type WordTime = { start: number; end: number }

const cache = new Map<string, WordTime[] | null>()

/** Tests drop a remembered file. The page keeps it for the session. */
export function clearAlignmentCache(): void {
  cache.clear()
}

export function alignmentName(file: string): string | null {
  const base = file.replace(/\.r70\.m4a$/, '.m4a').replace(/\.r85\.m4a$/, '.m4a')
  if (!base.endsWith('.m4a')) return null
  const name = `${base.slice(0, -4)}.align.json`
  return ALIGN_FILE.test(name) ? name : null
}

/** ffmpeg `atempo` stretches the whole file by the same factor. */
export function alignmentScale(file: string): number {
  if (file.endsWith('.r70.m4a')) return 1 / 0.7
  if (file.endsWith('.r85.m4a')) return 1 / 0.85
  return 1
}

/**
 * A timing file is used only when it has one span per spoken word, in order.
 * Anything else is dropped, so a bad file never lights the wrong word.
 */
export function parseAlignment(data: unknown, wordCount: number): WordTime[] | null {
  const parsed = fileSchema.safeParse(data)
  if (!parsed.success || parsed.data.words.length !== wordCount) return null
  let previous = 0
  const words: WordTime[] = []
  for (const word of parsed.data.words) {
    if (word.end <= word.start || word.start < previous - 0.001) return null
    words.push({ start: word.start, end: word.end })
    previous = word.end
  }
  return words
}

/** True when the last word ends by the clip length, plus the scaled tolerance. */
export function alignmentFitsDuration(words: readonly WordTime[], duration: number, scale = 1): boolean {
  if (!Number.isFinite(duration) || duration <= 0 || words.length === 0) return false
  if (!Number.isFinite(scale) || scale <= 0) return false
  const last = words[words.length - 1]
  return last != null && last.end <= duration + ALIGN_DURATION_TOLERANCE * scale
}

export function scaleTimes(words: readonly WordTime[], scale: number): WordTime[] | null {
  if (scale === 1) return words.slice()
  const scaled = words.map((word) => ({
    start: Math.round(word.start * scale * 1000) / 1000,
    end: Math.round(word.end * scale * 1000) / 1000,
  }))
  return parseAlignment({ words: scaled }, words.length)
}

export async function loadAlignment(file: string, speech: string): Promise<WordTime[] | null> {
  const name = alignmentName(file)
  if (!name) return null
  if (!cache.has(name)) {
    const fetched = await fetchAlignment(name, splitWords(speech).length)
    if (!fetched) return null
    cache.set(name, fetched)
  }
  const raw = cache.get(name)
  if (!raw) return null
  return scaleTimes(raw, alignmentScale(file))
}

/** The offline voice download stores timings in the same cache as the clips. */
async function readCachedAudio(url: string): Promise<Response | null> {
  if (!('caches' in globalThis)) return null
  try {
    const names = await caches.keys()
    for (const name of names) {
      const cache = await caches.open(name)
      const hit = await cache.match(url)
      if (hit?.ok) return hit
    }
  } catch {
    return null
  }
  return null
}

async function fetchAlignment(name: string, wordCount: number): Promise<WordTime[] | null> {
  try {
    const listed = await loadManifest()
    if (!listed.has(name)) return null
    const url = publicUrl(`audio/${name}`)
    const response = (await readCachedAudio(url)) ?? (await fetch(url))
    if (!response.ok) return null
    const declared = Number(response.headers.get('content-length'))
    if (Number.isFinite(declared) && declared > ALIGN_MAX_BYTES) return null
    const text = await response.text()
    if (text.length > ALIGN_MAX_BYTES) return null
    return parseAlignment(JSON.parse(text) as unknown, wordCount)
  } catch {
    return null
  }
}

export function currentWordIndex(words: readonly WordTime[] | null, seconds: number | null): number | null {
  if (!words || seconds == null || !Number.isFinite(seconds)) return null
  for (let index = 0; index < words.length; index += 1) {
    const word = words[index]
    if (word && seconds >= word.start && seconds < word.end) return index
  }
  return null
}
