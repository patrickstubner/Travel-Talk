import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync as readBytes } from 'fs'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { rawCatalog } from '../../content'
import { splitWords } from '../../content/gloss'
import { alignmentFitsDuration, parseAlignment } from '../audio/align'
import { VOICES } from '../audio/voices'
import { allSpeechLines, voiceFile } from '../content/resolve'
import { contourFromSamples, frameEnergy } from './contour'
import { scoreRepeat } from './feedback'
import { bandShape } from './spectrum'

/**
 * The shipped clips still decode, and the melody score still runs on each
 * timed line. Version 0.8.0 does not grade the sentence, so this file does
 * not count stars. ffmpeg is required in CI and skipped locally when absent.
 */

const KNOWN_MISSING = new Set([
  'de/mls-4576/meet.food-q__any__du.m4a',
  'de/mls-4576/meet.why__any__base.m4a',
  'de/mls-4576/sight.price__any__base.m4a',
  'de/mls-4576/stay.noisy__any__base.m4a',
  'de/mls-4576/visa.days__any__base.m4a',
  'de/stay.noisy__any__base.m4a',
  'de/thorsten-high/stay.noisy__any__base.m4a',
  'en/arrival.days__any__base.m4a',
  'en/arrival.hotel__any__base.m4a',
  'en/arrival.level__any__base.m4a',
  'en/arrival.purpose__any__base.m4a',
  'en/arrival.tourist__any__base.m4a',
  'en/emergency.accident__any__base.m4a',
  'en/emergency.allergic__any__base.m4a',
  'en/emergency.lost__any__base.m4a',
  'en/emergency.peanut__any__base.m4a',
  'en/emergency.understand__any__base.m4a',
  'en/food.order__any__base.m4a',
  'en/joe/arrival.days__any__base.m4a',
  'en/joe/arrival.hotel__any__base.m4a',
  'en/joe/arrival.level__any__base.m4a',
  'en/joe/arrival.purpose__any__base.m4a',
  'en/joe/arrival.tourist__any__base.m4a',
  'en/joe/emergency.accident__any__base.m4a',
  'en/joe/emergency.allergic__any__base.m4a',
  'en/joe/emergency.lost__any__base.m4a',
  'en/joe/emergency.peanut__any__base.m4a',
  'en/joe/emergency.understand__any__base.m4a',
  'en/joe/food.order__any__base.m4a',
  'en/joe/meet.family__any__base.m4a',
  'en/joe/meet.origin__any__base.m4a',
  'en/joe/meet.stay__any__base.m4a',
  'en/joe/meet.why__any__base.m4a',
  'en/joe/shop.look__any__base.m4a',
  'en/joe/stay.problem__any__base.m4a',
  'en/joe/transport.09.app__any__base.m4a',
  'en/joe/visa.evisa__any__base.m4a',
  'en/meet.family__any__base.m4a',
  'en/meet.origin__any__base.m4a',
  'en/meet.stay__any__base.m4a',
  'en/meet.why__any__base.m4a',
  'en/shop.look__any__base.m4a',
  'en/stay.problem__any__base.m4a',
  'en/transport.09.app__any__base.m4a',
  'en/visa.evisa__any__base.m4a',
  'vi/vivos-32/emergency.write__any__base.m4a',
  'vi/vivos-32/food.good__any__base.m4a',
  'vi/vivos-32/meet.hello__any__anh.m4a',
  'vi/vivos-32/meet.hello__any__co.m4a',
  'vi/vivos-32/meet.hello__any__ong.m4a',
])

function ffmpegReady(): boolean {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function pcm(raw: Uint8Array): Float32Array {
  const bytes = Uint8Array.from(raw)
  return new Float32Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 4))
}

const decoded = new Map<string, Float32Array>()
const clipCacheDir = process.env.CLIP_CACHE || join(process.cwd(), '.cache', 'tt-clips')
/** Part of the decoded-clip name, so a change in this file does not reuse old pcm. */
const decodeStamp = createHash('sha1')
  .update(new Uint8Array(readBytes(fileURLToPath(import.meta.url))))
  .digest('hex')
  .slice(0, 12)

function decodeFresh(path: string): Float32Array {
  return pcm(
    execFileSync('ffmpeg', ['-v', 'error', '-i', path, '-ac', '1', '-ar', '16000', '-f', 'f32le', 'pipe:1'], {
      maxBuffer: 8 * 1024 * 1024,
    }),
  )
}

function decode(path: string): Float32Array {
  const hit = decoded.get(path)
  if (hit) return hit
  const info = statSync(path)
  const name = createHash('sha1')
    .update(new TextEncoder().encode(`${decodeStamp}\0${path}\0${info.size}`))
    .digest('hex')
  const cached = join(clipCacheDir, `${name}.f32`)
  if (existsSync(cached)) {
    const samples = pcm(readBytes(cached))
    decoded.set(path, samples)
    return samples
  }
  const samples = decodeFresh(path)
  mkdirSync(clipCacheDir, { recursive: true })
  const view = new Uint8Array(samples.buffer, samples.byteOffset, samples.byteLength)
  writeFileSync(cached, view as unknown as string)
  decoded.set(path, samples)
  return samples
}

const ready = ffmpegReady()
const required = process.env.CI === 'true'

if (!ready) console.error('ffmpeg fehlt. npm run test:clips wird übersprungen. In CI wird ffmpeg verlangt.')

describe('shipped clips', () => {
  it('requires ffmpeg only in CI', () => {
    if (!ready) expect(required, 'ffmpeg fehlt. Für npm run test:clips wird ffmpeg benötigt.').toBe(false)
    else expect(ready).toBe(true)
  })

  function checkLanguage(only: string): void {
    const lines = allSpeechLines(rawCatalog.concepts)
    const missing: string[] = []
    let timed = 0
    for (const voice of VOICES.filter((item) => item.bundled && item.lang === only)) {
      for (const line of lines) {
        if (line.lang !== voice.lang) continue
        const file = voiceFile(line.file, voice.id, voice.legacy)
        const audio = `public/audio/${file}`
        if (!existsSync(audio)) continue
        const alignPath = audio.replace(/\.m4a$/, '.align.json')
        if (!existsSync(alignPath)) {
          missing.push(file)
          continue
        }
        const times = parseAlignment(JSON.parse(readFileSync(alignPath, 'utf8')), splitWords(line.text).length)
        if (!times) {
          missing.push(file)
          continue
        }
        const samples = decode(audio)
        const duration = samples.length / 16000
        if (!alignmentFitsDuration(times, duration)) {
          missing.push(file)
          continue
        }
        const words = times.map((word, index) => ({ ...word, text: splitWords(line.text)[index] ?? '' }))
        const model = contourFromSamples(samples, 16000)
        const region: 'south' | 'north' = file.includes('__north__') ? 'north' : 'south'
        const score = scoreRepeat({
          model,
          user: model,
          modelHop: 0.01,
          userHop: 0.01,
          words,
          lang: line.lang,
          region,
          userDuration: duration,
          modelEnergy: frameEnergy(samples, 16000),
          userEnergy: frameEnergy(samples, 16000),
          modelBands: bandShape(samples, 16000),
          userBands: bandShape(samples, 16000),
        })
        expect(score.model.length, file).toBeGreaterThan(0)
        expect(score, file).not.toHaveProperty('stars')
        timed += 1
      }
    }
    expect(timed, only).toBeGreaterThan(0)
    for (const file of missing) expect(KNOWN_MISSING.has(file), file).toBe(true)
  }

  const allLangs = ['de', 'en', 'pt-BR', 'vi'] as const
  const requested = process.env.CLIP_LANG
  if (requested && !allLangs.includes(requested as (typeof allLangs)[number])) {
    throw new Error(`CLIP_LANG must be one of ${allLangs.join(', ')}`)
  }
  const clipLangs = requested ? allLangs.filter((lang) => lang === requested) : [...allLangs]

  for (const lang of clipLangs) {
    it.skipIf(!ready)(`decodes ${lang} and scores the melody`, () => checkLanguage(lang), 1_080_000)
  }
})
