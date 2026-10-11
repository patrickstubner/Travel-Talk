import { execFileSync } from 'node:child_process'
import { readFileSync as readBytes } from 'fs'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
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

/**
 * Regression for the star score, outside `npm test`.
 * Reversed takes stay under 5 % with any stars. A few symmetric sentences
 * still reach 2 or 3, because pitch and loudness look the same forwards
 * and backwards. Cutting those also cuts ±3 semitones and ±10 % tempo
 * below 2 stars, so the cap stays at 5 %. A steady tone never gets stars.
 * Joe stays under the 98 % self-score of the other voices: clarity 0.6
 * recovered most of that low voice, and the 70 Hz floor was not the cause.
 */

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
}

function empty(): Counts {
  return { timed: 0, self: 0, rev: 0, tone: 0, up: 0, down: 0, fast: 0, slow: 0, varied: 0 }
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

function pitchFilter(semitones: number): string {
  const factor = 2 ** (semitones / 12)
  return `asetrate=${(16000 * factor).toFixed(3)},aresample=16000,atempo=${factor.toFixed(6)}`
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
      try {
        const lines = allSpeechLines(rawCatalog.concepts)
        for (const voice of VOICES.filter((item) => item.bundled)) {
          const row = empty()
          byVoice.set(voice.id, row)
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
            const region: 'south' | 'north' = file.includes('__north__') ? 'north' : 'south'
            const base = {
              model,
              modelHop: 0.01,
              userHop: 0.01,
              words,
              lang: line.lang,
              region,
              modelEnergy,
            }
            row.timed += 1
            const self = scoreRepeat({ ...base, user: model, userEnergy: modelEnergy, userDuration: duration })
            if (self.stars > 0) row.self += 1
            const reversedSamples = Float32Array.from(samples).reverse()
            const rev = scoreRepeat({
              ...base,
              user: contourFromSamples(reversedSamples, 16000),
              userEnergy: frameEnergy(reversedSamples, 16000),
              userDuration: duration,
            })
            if (rev.stars > 0) {
              row.rev += 1
              reversedStars.push(`${file} ${rev.stars}`)
            }
            const toneSamples = tone(120, samples.length)
            const drone = scoreRepeat({
              ...base,
              user: contourFromSamples(toneSamples, 16000),
              userEnergy: frameEnergy(toneSamples, 16000),
              userDuration: duration,
            })
            if (drone.stars > 0) row.tone += 1
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
              const score = scoreRepeat({
                ...base,
                user: contourFromSamples(userSamples, 16000),
                userEnergy: frameEnergy(userSamples, 16000),
                userDuration: userSamples.length / 16000,
              })
              if (score.stars >= 2) row[key] += 1
            }
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
        }))
        console.error(JSON.stringify({ languages, voices: table, reversedStars }, null, 2))
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
        for (const file of missing) expect(KNOWN_MISSING.has(file), file).toBe(true)
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    },
    1_200_000,
  )
})
