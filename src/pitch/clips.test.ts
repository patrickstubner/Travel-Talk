import { execFileSync } from 'node:child_process'
import { readFileSync as readBytes } from 'fs'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { rawCatalog } from '../../content'
import { splitWords } from '../../content/gloss'
import { alignmentFitsDuration, parseAlignment } from '../audio/align'
import { VOICES } from '../audio/voices'
import { allSpeechLines, voiceFile } from '../content/resolve'
import { contourFromSamples, frameEnergy } from './contour'
import { scoreRepeat } from './feedback'
import { bandShape, closestBands } from './spectrum'

/**
 * Regression for the star score, outside `npm test`.
 * Reversed takes stay under 5 % with any stars. The ones that still reach
 * stars are listed in SYMMETRIC_REVERSED. The band check currently leaves
 * that list empty. Cutting a stricter pitch rule also cuts ±3 semitones
 * and ±10 % tempo below 2 stars, so the old 5 % cap stays as the backstop.
 * A steady tone never gets stars. Joe keeps the stars. The floors below
 * stay, including 35 % at ±3 semitones, until a harmonic repair can do
 * better without praising a tone or a reversed take. A hum on the syllable
 * grid, other speech and another sentence stay under 5 % with any stars.
 * Joe stays under the 98 % self-score of the other voices: clarity 0.6
 * recovered most of that low voice, and the 70 Hz floor was not the cause.
 */

/**
 * File and star count. Sorted. A new reversed reward fails the clip test.
 * The band check now keeps every reversed clip under the language limit,
 * so the list is empty. It stays as the guard.
 */
const SYMMETRIC_REVERSED = [] as const

const KNOWN_MISSING = new Set([
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

type Counts = {
  timed: number
  self: number
  rev: number
  tone: number
  up: number
  down: number
  fast: number
  slow: number
  varied: number
  reverb: number
  noise: number
  hum: number
  hum3: number
  background: number
  background3: number
  other: number
  other3: number
}

function empty(): Counts {
  return {
    timed: 0,
    self: 0,
    rev: 0,
    tone: 0,
    up: 0,
    down: 0,
    fast: 0,
    slow: 0,
    varied: 0,
    reverb: 0,
    noise: 0,
    hum: 0,
    hum3: 0,
    background: 0,
    background3: 0,
    other: 0,
    other3: 0,
  }
}

function add(into: Counts, row: Counts): void {
  into.timed += row.timed
  into.self += row.self
  into.rev += row.rev
  into.tone += row.tone
  into.up += row.up
  into.down += row.down
  into.fast += row.fast
  into.slow += row.slow
  into.varied += row.varied
  into.reverb += row.reverb
  into.noise += row.noise
  into.hum += row.hum
  into.hum3 += row.hum3
  into.background += row.background
  into.background3 += row.background3
  into.other += row.other
  into.other3 += row.other3
}

function share(part: number, total: number): number {
  return total === 0 ? 0 : part / total
}

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

function decode(path: string): Float32Array {
  return pcm(
    execFileSync('ffmpeg', ['-v', 'error', '-i', path, '-ac', '1', '-ar', '16000', '-f', 'f32le', 'pipe:1'], {
      maxBuffer: 8 * 1024 * 1024,
    }),
  )
}

function tone(hz: number, length: number): Float32Array {
  const out = new Float32Array(length)
  for (let index = 0; index < length; index += 1) out[index] = 0.4 * Math.sin((2 * Math.PI * hz * index) / 16000)
  return out
}

function mixPink(signal: Float32Array, seed: number, snrDb = 10): Float32Array {
  let state = seed
  const next = () => {
    state = (state + 0x6d2b79f5) | 0
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
  const noise = new Float32Array(signal.length)
  let b0 = 0
  let b1 = 0
  let b2 = 0
  for (let index = 0; index < signal.length; index += 1) {
    const white = next() * 2 - 1
    b0 = 0.99765 * b0 + white * 0.099046
    b1 = 0.963 * b1 + white * 0.2965164
    b2 = 0.57 * b2 + white * 1.0526913
    noise[index] = b0 + b1 + b2 + white * 0.1848
  }
  let signalPower = 0
  let noisePower = 0
  for (let index = 0; index < signal.length; index += 1) {
    signalPower += (signal[index] ?? 0) * (signal[index] ?? 0)
    noisePower += (noise[index] ?? 0) * (noise[index] ?? 0)
  }
  const scale = noisePower > 0 ? Math.sqrt(signalPower / (10 ** (snrDb / 10) * noisePower)) : 0
  const mixed = new Float32Array(signal.length)
  for (let index = 0; index < signal.length; index += 1) mixed[index] = (signal[index] ?? 0) + (noise[index] ?? 0) * scale
  return mixed
}

/** A hum that falls two semitones and pulses at 4 Hz, not on the word grid. */
function humRhythm(length: number): Float32Array {
  const out = new Float32Array(length)
  let phase = 0
  for (let index = 0; index < length; index += 1) {
    const hz = 160 * 2 ** ((-2 * index) / length / 12)
    phase += (2 * Math.PI * hz) / 16000
    const pulse = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin((2 * Math.PI * 4 * index) / 16000))
    out[index] = Math.sin(phase) * pulse * 0.5
  }
  return out
}

function reverb(signal: Float32Array): Float32Array {
  const out = Float32Array.from(signal)
  const delay = 640
  for (let index = delay; index < signal.length; index += 1) out[index] = (signal[index] ?? 0) + 0.3 * (out[index - delay] ?? 0)
  return out
}

/** Pitch only. `asetrate` also changes the duration, and `atempo` puts that duration back. */
function pitchFilter(semitones: number): string {
  const factor = 2 ** (semitones / 12)
  return `asetrate=${(16000 * factor).toFixed(3)},aresample=16000,atempo=${(1 / factor).toFixed(6)}`
}

const ready = ffmpegReady()
const required = process.env.CI === 'true'

if (!ready) console.error('ffmpeg fehlt. npm run test:clips wird übersprungen. In CI wird ffmpeg verlangt.')

describe('shipped clips', () => {
  it('requires ffmpeg only in CI', () => {
    if (!ready) expect(required, 'ffmpeg fehlt. Für npm run test:clips wird ffmpeg benötigt.').toBe(false)
    else expect(ready).toBe(true)
  })

  it.skipIf(!ready)(
    'keeps self-score, rejects a reversed take and a steady tone, and keeps small pitch and tempo shifts',
    () => {
      const dir = mkdtempSync(join(tmpdir(), 'tt-clips-'))
      const paths = {
        up: join(dir, 'up.raw'),
        down: join(dir, 'down.raw'),
        fast: join(dir, 'fast.raw'),
        slow: join(dir, 'slow.raw'),
      }
      const byVoice = new Map<string, Counts>()
      const byLang = new Map<string, Counts>()
      const missing: string[] = []
      const reversedStars: string[] = []
      const joeNoise = { up: 0, down: 0, varied: 0 }
      const backgroundOf: Record<string, Float32Array> = {
        de: decode('public/audio/en/meet.hello__any__base.m4a'),
        en: decode('public/audio/de/meet.hello__any__base.m4a'),
        'pt-BR': decode('public/audio/vi/meet.hello__any__ong.m4a'),
        vi: decode('public/audio/pt-BR/meet.hello__any__base.m4a'),
      }
      try {
        const lines = allSpeechLines(rawCatalog.concepts)
        for (const voice of VOICES.filter((item) => item.bundled)) {
          const row = empty()
          byVoice.set(voice.id, row)
          const heard: Float32Array[] = []
          const scorers: Array<(userSamples: Float32Array) => number> = []
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
            const modelEnergy = frameEnergy(samples, 16000)
            const modelBands = bandShape(samples, 16000)
            const region: 'south' | 'north' = file.includes('__north__') ? 'north' : 'south'
            const base = {
              model,
              modelHop: 0.01,
              userHop: 0.01,
              words,
              lang: line.lang,
              region,
              modelEnergy,
              modelBands,
            }
            const take = (userSamples: Float32Array) =>
              scoreRepeat({
                ...base,
                user: contourFromSamples(userSamples, 16000),
                userEnergy: frameEnergy(userSamples, 16000),
                userDuration: userSamples.length / 16000,
                userBands: closestBands(modelBands, userSamples, 16000),
              })
            heard.push(samples)
            scorers.push((userSamples) => take(userSamples).stars)
            row.timed += 1
            const self = scoreRepeat({ ...base, user: model, userEnergy: modelEnergy, userDuration: duration, userBands: modelBands })
            if (self.stars > 0) row.self += 1
            const reversedSamples = Float32Array.from(samples).reverse()
            const rev = take(reversedSamples)
            if (rev.stars > 0) {
              row.rev += 1
              reversedStars.push(`${file} ${rev.stars}`)
            }
            const toneSamples = tone(120, samples.length)
            const drone = take(toneSamples)
            if (drone.stars > 0) row.tone += 1
            const hummed = take(humRhythm(samples.length))
            if (hummed.stars > 0) row.hum += 1
            if (hummed.stars === 3) row.hum3 += 1
            const foreign = backgroundOf[line.lang]
            if (foreign) {
              const babble = take(foreign)
              if (babble.stars > 0) row.background += 1
              if (babble.stars === 3) row.background3 += 1
            }
            if (self.stars < 2) continue
            row.varied += 1
            execFileSync(
              'ffmpeg',
              [
                '-y',
                '-v',
                'error',
                '-f',
                'f32le',
                '-ar',
                '16000',
                '-ac',
                '1',
                '-i',
                'pipe:0',
                '-filter_complex',
                `[0:a]${pitchFilter(3)}[up];[0:a]${pitchFilter(-3)}[down];[0:a]atempo=1.1[fast];[0:a]atempo=0.9[slow]`,
                '-map',
                '[up]',
                '-f',
                'f32le',
                paths.up,
                '-map',
                '[down]',
                '-f',
                'f32le',
                paths.down,
                '-map',
                '[fast]',
                '-f',
                'f32le',
                paths.fast,
                '-map',
                '[slow]',
                '-f',
                'f32le',
                paths.slow,
              ],
              { input: Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength), maxBuffer: 8 * 1024 * 1024 },
            )
            const shifted: Array<[keyof Pick<Counts, 'up' | 'down' | 'fast' | 'slow'>, string]> = [
              ['up', paths.up],
              ['down', paths.down],
              ['fast', paths.fast],
              ['slow', paths.slow],
            ]
            for (const [key, rawPath] of shifted) {
              const raw = readBytes(rawPath)
              const userSamples = pcm(raw)
              const score = take(userSamples)
              if (score.stars >= 2) row[key] += 1
              if (voice.id === 'joe' && (key === 'up' || key === 'down')) {
                const noisy = mixPink(userSamples, key === 'up' ? 3 : 5)
                const withNoise = take(noisy)
                if (key === 'up') joeNoise.varied += 1
                if (withNoise.stars >= 2) joeNoise[key] += 1
              }
            }
            if (take(reverb(samples)).stars >= 2) row.reverb += 1
            if (take(mixPink(samples, 11, 25)).stars >= 2) row.noise += 1
          }
          const otherShift = Math.max(1, Math.floor(scorers.length / 2))
          for (let index = 0; index < scorers.length; index += 1) {
            const other = heard[(index + otherShift) % heard.length]
            const scorer = scorers[index]
            if (!other || !scorer || scorers.length < 2) continue
            const stars = scorer(other)
            if (stars > 0) row.other += 1
            if (stars === 3) row.other3 += 1
          }
          const lang = byLang.get(voice.lang) ?? empty()
          add(lang, row)
          byLang.set(voice.lang, lang)
        }
        const table = [...byVoice.entries()].map(([id, row]) => ({
          id,
          self: `${row.self}/${row.timed}`,
          reversed: `${row.rev}/${row.timed}`,
          tone: row.tone,
          up: `${row.up}/${row.varied}`,
          down: `${row.down}/${row.varied}`,
          fast: `${row.fast}/${row.varied}`,
          slow: `${row.slow}/${row.varied}`,
          reverb: `${row.reverb}/${row.varied}`,
          noise: `${row.noise}/${row.varied}`,
          hum: `${row.hum}/${row.timed}`,
          hum3: row.hum3,
          background: `${row.background}/${row.timed}`,
          background3: row.background3,
          other: `${row.other}/${row.timed}`,
          other3: row.other3,
        }))
        const languages = [...byLang.entries()].map(([id, row]) => ({
          id,
          self: `${row.self}/${row.timed}`,
          reversed: `${row.rev}/${row.timed}`,
          tone: row.tone,
          up: `${row.up}/${row.varied}`,
          down: `${row.down}/${row.varied}`,
          fast: `${row.fast}/${row.varied}`,
          slow: `${row.slow}/${row.varied}`,
          reverb: `${row.reverb}/${row.varied}`,
          noise: `${row.noise}/${row.varied}`,
          hum: `${row.hum}/${row.timed}`,
          hum3: row.hum3,
          background: `${row.background}/${row.timed}`,
          background3: row.background3,
          other: `${row.other}/${row.timed}`,
          other3: row.other3,
        }))
        const report = { languages, voices: table, reversedStars, joeNoise }
        console.error(JSON.stringify(report, null, 2))
        writeFileSync('/tmp/tt-clip-stats.json', JSON.stringify(report, null, 2))
        const pitchFloor: Record<string, number> = { joe: 0.35, cadu: 0.4 }
        const tempoFloor: Record<string, number> = { joe: 0.55 }
        for (const [id, row] of byVoice) {
          const pitch = pitchFloor[id] ?? 0.65
          const tempo = tempoFloor[id] ?? 0.7
          expect(row.tone, `${id} steady tone`).toBe(0)
          expect(share(row.rev, row.timed), `${id} reversed`).toBeLessThanOrEqual(0.05)
          expect(share(row.self, row.timed), `${id} self`).toBeGreaterThanOrEqual(id === 'joe' ? 0.94 : 0.97)
          expect(share(row.up, row.varied), `${id} +3 st`).toBeGreaterThanOrEqual(pitch)
          expect(share(row.down, row.varied), `${id} -3 st`).toBeGreaterThanOrEqual(pitch)
          expect(share(row.fast, row.varied), `${id} +10%`).toBeGreaterThanOrEqual(tempo)
          expect(share(row.slow, row.varied), `${id} -10%`).toBeGreaterThanOrEqual(tempo)
        }
        for (const [id, row] of byLang) {
          expect(share(row.hum, row.timed), `${id} hum`).toBeLessThanOrEqual(0.05)
          expect(row.hum3, `${id} hum with three stars`).toBe(0)
          expect(share(row.background, row.timed), `${id} background`).toBeLessThanOrEqual(0.05)
          expect(row.background3, `${id} background with three stars`).toBe(0)
          expect(share(row.other, row.timed), `${id} other sentence`).toBeLessThanOrEqual(0.05)
          expect(row.other3, `${id} other sentence with three stars`).toBe(0)
          expect(share(row.reverb, row.varied), `${id} reverb`).toBeGreaterThanOrEqual(0.6)
          expect(share(row.noise, row.varied), `${id} light noise`).toBeGreaterThanOrEqual(0.6)
        }
        expect([...reversedStars].sort()).toEqual([...SYMMETRIC_REVERSED])
        for (const file of missing) expect(KNOWN_MISSING.has(file), file).toBe(true)
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    },
    1_200_000,
  )
})
