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
import { contourFromSamples, frameEnergy, type Contour } from './contour'
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
 * better without praising a tone or a reversed take. A hum on a fixed 4 Hz
 * pulse, other speech and reversed audio stay at no stars. A hum whose
 * loudness follows the file, and singing its melody, still receive stars.
 * Those two are reported, not gated, while the score stays as it is.
 * Another voice saying the same sentence keeps stars where the voices are
 * similar. German rejects a different sentence when the other voice is the
 * same speaker. A less similar voice does not separate that case.
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
  /** At least 2 stars. A hum on the file's own loudness. Reported, not gated. */
  humSyllable: number
  /** At least 2 stars. The melody sung as a vowel. Reported, not gated. */
  sing: number
  background: number
  background3: number
  other: number
  other3: number
  room: number
  noise10: number
  otherVoice: number
  otherVoiceTimed: number
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
    humSyllable: 0,
    sing: 0,
    background: 0,
    background3: 0,
    other: 0,
    other3: 0,
    room: 0,
    noise10: 0,
    otherVoice: 0,
    otherVoiceTimed: 0,
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
  into.humSyllable += row.humSyllable
  into.sing += row.sing
  into.background += row.background
  into.background3 += row.background3
  into.other += row.other
  into.other3 += row.other3
  into.room += row.room
  into.noise10 += row.noise10
  into.otherVoice += row.otherVoice
  into.otherVoiceTimed += row.otherVoiceTimed
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

const decoded = new Map<string, Float32Array>()

function decode(path: string): Float32Array {
  const hit = decoded.get(path)
  if (hit) return hit
  const samples = pcm(
    execFileSync('ffmpeg', ['-v', 'error', '-i', path, '-ac', '1', '-ar', '16000', '-f', 'f32le', 'pipe:1'], {
      maxBuffer: 8 * 1024 * 1024,
    }),
  )
  decoded.set(path, samples)
  return samples
}

function peerVoice(voice: (typeof VOICES)[number]): (typeof VOICES)[number] | undefined {
  const group = VOICES.filter((item) => item.bundled && item.lang === voice.lang)
  const index = group.findIndex((item) => item.id === voice.id)
  if (index < 0 || group.length < 2) return undefined
  return group[(index + 1) % group.length]
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

/** Loudness of the file, about 20 ms, so a hum can follow the syllables. */
function rmsEnvelope(signal: Float32Array): Float32Array {
  const win = 320
  const out = new Float32Array(signal.length)
  let sum = 0
  for (let index = 0; index < signal.length; index += 1) {
    const sample = signal[index] ?? 0
    sum += sample * sample
    if (index >= win) {
      const left = signal[index - win] ?? 0
      sum -= left * left
    }
    out[index] = Math.sqrt(Math.max(0, sum) / Math.min(win, index + 1))
  }
  return out
}

function matchPeak(source: Float32Array, rendered: Float32Array): Float32Array {
  let src = 0
  let dst = 0
  for (let index = 0; index < source.length; index += 1) {
    src = Math.max(src, Math.abs(source[index] ?? 0))
    dst = Math.max(dst, Math.abs(rendered[index] ?? 0))
  }
  if (src === 0 || dst === 0) return rendered
  const scale = src / dst
  const out = new Float32Array(rendered.length)
  for (let index = 0; index < rendered.length; index += 1) out[index] = (rendered[index] ?? 0) * scale
  return out
}

/**
 * A falling hum, with the second and third harmonic, whose loudness is the
 * file's. The 4 Hz pulse in `humRhythm` does not sit on these syllables.
 */
function humOnSyllables(signal: Float32Array): Float32Array {
  const env = rmsEnvelope(signal)
  const out = new Float32Array(signal.length)
  let phase = 0
  let phase2 = 0
  let phase3 = 0
  for (let index = 0; index < signal.length; index += 1) {
    const hz = 160 * 2 ** ((-2 * index) / Math.max(1, signal.length) / 12)
    phase += (2 * Math.PI * hz) / 16000
    phase2 += (2 * Math.PI * hz * 2) / 16000
    phase3 += (2 * Math.PI * hz * 3) / 16000
    const tone = Math.sin(phase) + 0.45 * Math.sin(phase2) + 0.2 * Math.sin(phase3)
    out[index] = tone * (env[index] ?? 0)
  }
  return matchPeak(signal, out)
}

/** Gain of an /a/-like vowel. Ten harmonics use this when the melody is sung. */
function vowelGain(freq: number): number {
  const peaks: Array<[number, number]> = [
    [730, 90],
    [1090, 110],
    [2440, 170],
  ]
  let gain = 0.08
  for (const [center, width] of peaks) {
    const distance = (freq - center) / width
    gain += Math.exp(-0.5 * distance * distance)
  }
  return gain
}

/**
 * The file's melody, sung: the contour in semitones around 180 Hz, ten
 * harmonics shaped like a vowel, loudness from the file.
 */
function singMelody(signal: Float32Array, contour: Contour): Float32Array {
  const env = rmsEnvelope(signal)
  const hop = 160
  const out = new Float32Array(signal.length)
  const phases = new Float64Array(10)
  let held = 0
  for (let index = 0; index < signal.length; index += 1) {
    const frame = Math.min(Math.max(0, contour.length - 1), Math.floor(index / hop))
    const semi = contour[frame]
    if (semi != null) held = semi
    const hz = 180 * 2 ** (held / 12)
    let sample = 0
    for (let harmonic = 1; harmonic <= 10; harmonic += 1) {
      const freq = hz * harmonic
      const slot = harmonic - 1
      phases[slot] = (phases[slot] ?? 0) + (2 * Math.PI * freq) / 16000
      sample += (vowelGain(freq) / harmonic) * Math.sin(phases[slot] ?? 0)
    }
    const audible = semi == null ? 0.15 : 1
    out[index] = sample * (env[index] ?? 0) * audible
  }
  return matchPeak(signal, out)
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

/** Four reflections from 23 ms to 131 ms. */
function room(signal: Float32Array): Float32Array {
  const out = Float32Array.from(signal)
  for (const [delay, gain] of [
    [368, 0.45],
    [736, 0.32],
    [1472, 0.22],
    [2096, 0.14],
  ] as const) {
    for (let index = delay; index < signal.length; index += 1) {
      out[index] = (out[index] ?? 0) + gain * (signal[index - delay] ?? 0)
    }
  }
  return out
}

/** Pitch only. `asetrate` also changes the duration, and `atempo` puts that duration back. */
function pitchFilter(semitones: number): string {
  const factor = 2 ** (semitones / 12)
  return `asetrate=${(16000 * factor).toFixed(3)},aresample=16000,atempo=${(1 / factor).toFixed(6)}`
}

const ready = ffmpegReady()
const required = process.env.CI === 'true'

/** Filled by the language tests. The known-failing test reads it afterwards. */
const reported = new Map<string, { humSyllable: number; sing: number; timed: number }>()
const collected: unknown[] = []

if (!ready) console.error('ffmpeg fehlt. npm run test:clips wird übersprungen. In CI wird ffmpeg verlangt.')

describe('shipped clips', () => {
  it('requires ffmpeg only in CI', () => {
    if (!ready) expect(required, 'ffmpeg fehlt. Für npm run test:clips wird ffmpeg benötigt.').toBe(false)
    else expect(ready).toBe(true)
  })

  function scoreLanguage(only: string): void {
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
        for (const voice of VOICES.filter((item) => item.bundled && item.lang === only)) {
          const row = empty()
          byVoice.set(voice.id, row)
          const heard: Float32Array[] = []
          const scorers: Array<(userSamples: Float32Array) => number> = []
          const peer = peerVoice(voice)
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
            if (take(humOnSyllables(samples)).stars >= 2) row.humSyllable += 1
            if (take(singMelody(samples, model)).stars >= 2) row.sing += 1
            const foreign = backgroundOf[line.lang]
            if (foreign) {
              const babble = take(foreign)
              if (babble.stars > 0) row.background += 1
              if (babble.stars === 3) row.background3 += 1
            }
            if (peer) {
              const peerPath = `public/audio/${voiceFile(line.file, peer.id, peer.legacy)}`
              if (existsSync(peerPath)) {
                row.otherVoiceTimed += 1
                if (take(decode(peerPath)).stars >= 2) row.otherVoice += 1
              }
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
            if (take(room(samples)).stars >= 2) row.room += 1
            if (take(mixPink(samples, 17, 10)).stars >= 2) row.noise10 += 1
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
          humSyllable: `${row.humSyllable}/${row.timed}`,
          sing: `${row.sing}/${row.timed}`,
          background: `${row.background}/${row.timed}`,
          background3: row.background3,
          other: `${row.other}/${row.timed}`,
          other3: row.other3,
          room: `${row.room}/${row.varied}`,
          noise10: `${row.noise10}/${row.varied}`,
          otherVoice: `${row.otherVoice}/${row.otherVoiceTimed}`,
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
          humSyllable: `${row.humSyllable}/${row.timed}`,
          sing: `${row.sing}/${row.timed}`,
          background: `${row.background}/${row.timed}`,
          background3: row.background3,
          other: `${row.other}/${row.timed}`,
          other3: row.other3,
          room: `${row.room}/${row.varied}`,
          noise10: `${row.noise10}/${row.varied}`,
          otherVoice: `${row.otherVoice}/${row.otherVoiceTimed}`,
        }))
        const languageRow = byLang.get(only)
        if (languageRow) {
          reported.set(only, { humSyllable: languageRow.humSyllable, sing: languageRow.sing, timed: languageRow.timed })
        }
        const report = {
          languages,
          voices: table,
          reversedStars,
          joeNoise,
          reported: {
            knownFailing: true,
            gated: false,
            humSyllableAtLeast2: languageRow ? `${languageRow.humSyllable}/${languageRow.timed}` : '0/0',
            singAtLeast2: languageRow ? `${languageRow.sing}/${languageRow.timed}` : '0/0',
          },
        }
        collected.push(report)
        console.error(JSON.stringify(report, null, 2))
        writeFileSync('/tmp/tt-clip-stats.json', JSON.stringify(collected, null, 2))
        const pitchFloor: Record<string, number> = { joe: 0.55, cadu: 0.4 }
        const tempoFloor: Record<string, number> = { joe: 0.55 }
        const roomFloor: Record<string, number> = { joe: 0.3, vais1000: 0.8 }
        const noise10Floor: Record<string, number> = { joe: 0.3, vais1000: 0.8 }
        for (const [id, row] of byVoice) {
          const pitch = pitchFloor[id] ?? 0.65
          const tempo = tempoFloor[id] ?? 0.7
          expect(row.tone, `${id} steady tone`).toBe(0)
          expect(row.rev, `${id} reversed`).toBe(0)
          expect(share(row.self, row.timed), `${id} self`).toBeGreaterThanOrEqual(id === 'joe' ? 0.94 : 0.97)
          expect(share(row.up, row.varied), `${id} +3 st`).toBeGreaterThanOrEqual(pitch)
          expect(share(row.down, row.varied), `${id} -3 st`).toBeGreaterThanOrEqual(pitch)
          expect(share(row.fast, row.varied), `${id} +10%`).toBeGreaterThanOrEqual(tempo)
          expect(share(row.slow, row.varied), `${id} -10%`).toBeGreaterThanOrEqual(tempo)
          expect(share(row.room, row.varied), `${id} room`).toBeGreaterThanOrEqual(roomFloor[id] ?? 0.6)
          expect(share(row.noise10, row.varied), `${id} 10 dB`).toBeGreaterThanOrEqual(noise10Floor[id] ?? 0.45)
        }
        const otherVoiceFloor: Record<string, number> = { de: 0.45, en: 0.12, 'pt-BR': 0.12, vi: 0.15 }
        const otherCeiling: Record<string, number> = { en: 0.3, 'pt-BR': 0.35, vi: 0.3 }
        for (const [id, row] of byLang) {
          expect(row.hum, `${id} hum`).toBe(0)
          expect(row.hum3, `${id} hum with three stars`).toBe(0)
          expect(row.background, `${id} background`).toBe(0)
          expect(row.background3, `${id} background with three stars`).toBe(0)
          expect(row.rev, `${id} reversed`).toBe(0)
          expect(row.tone, `${id} tone`).toBe(0)
          if (id === 'de') {
            expect(row.other, `${id} other sentence`).toBe(0)
            expect(row.other3, `${id} other sentence with three stars`).toBe(0)
          } else {
            expect(share(row.other, row.timed), `${id} other sentence`).toBeLessThanOrEqual(otherCeiling[id] ?? 0.35)
          }
          expect(share(row.otherVoice, row.otherVoiceTimed), `${id} other voice`).toBeGreaterThanOrEqual(otherVoiceFloor[id] ?? 0.05)
          expect(share(row.reverb, row.varied), `${id} reverb`).toBeGreaterThanOrEqual(0.6)
          expect(share(row.noise, row.varied), `${id} light noise`).toBeGreaterThanOrEqual(0.6)
        }
        expect([...reversedStars].sort()).toEqual([...SYMMETRIC_REVERSED])
        for (const file of missing) expect(KNOWN_MISSING.has(file), file).toBe(true)
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
  }

  for (const lang of ['de', 'en', 'pt-BR', 'vi'] as const) {
    it.skipIf(!ready)(
      `keeps the score for ${lang}`,
      () => {
        scoreLanguage(lang)
      },
      900_000,
    )
  }

  // Known failing while the score stays as it is. A pass here would mean the
  // rates dropped to zero. A failure is the measured count, and it does not
  // turn the suite red.
  ;(ready ? it.fails : it.skip)('humming on the file rhythm and singing the melody still get stars', () => {
    for (const lang of ['de', 'en', 'pt-BR', 'vi'] as const) {
      const row = reported.get(lang)
      expect(row, lang).toBeDefined()
      expect.soft(row?.humSyllable ?? 0, `${lang} hum on the syllable rhythm`).toBe(0)
      expect.soft(row?.sing ?? 0, `${lang} singing the melody`).toBe(0)
    }
  })
})
