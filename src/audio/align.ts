import '../zod-setup'
import { z } from 'zod'
import { publicUrl } from '../public-url'
import { splitWords } from '../../content/gloss'

const wordSchema = z.strictObject({
  start: z.number().finite().min(0).max(60),
  end: z.number().finite().min(0).max(60),
})

const fileSchema = z.strictObject({
  words: z.array(wordSchema).min(1).max(64),
})

/** `name.r70.m4a` and `name.r85.m4a` share the base clip's timings. */
export const ALIGN_FILE =
  /^(de|en|pt-BR|vi)\/(?:[a-z0-9_-]{1,40}\/)?[a-z0-9.-]+__(south|north|any)__[a-z0-9-]+\.align\.json$/

export type WordTime = { start: number; end: number }

const cache = new Map<string, WordTime[] | null>()

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
    cache.set(name, await fetchAlignment(name, splitWords(speech).length))
  }
  const raw = cache.get(name)
  if (!raw) return null
  return scaleTimes(raw, alignmentScale(file))
}

async function fetchAlignment(name: string, wordCount: number): Promise<WordTime[] | null> {
  try {
    const response = await fetch(publicUrl(`audio/${name}`))
    if (!response.ok) return null
    return parseAlignment(await response.json(), wordCount)
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
