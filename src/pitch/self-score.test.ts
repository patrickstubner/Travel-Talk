import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { rawCatalog } from '../../content'
import { splitWords } from '../../content/gloss'
import { alignmentFitsDuration, parseAlignment } from '../audio/align'
import { allSpeechLines } from '../content/resolve'
import { analysisHop, contourFromSamples } from './contour'
import { scoreRepeat } from './feedback'

/**
 * A reference scored against itself still has no stars for these clips.
 * «zu kurz»: the file is under 0.3 s. «zu wenig Stimme»: fewer than five
 * voiced frames. «zu wenige Wörter»: no word holds three voiced frames,
 * so nothing is scorable. The bars stay empty; the reason is not «passt».
 */
const EXCEPTIONS: Array<{ file: string; reason: string }> = [
  { file: 'vi/meet.hello__any__bac.m4a', reason: 'zu wenig Stimme' },
  { file: 'vi/meet.yes__south__base.m4a', reason: 'zu kurz' },
  { file: 'vi/meet.yes__north__base.m4a', reason: 'zu kurz' },
  { file: 'en/food.good__any__base.m4a', reason: 'zu wenige Wörter' },
  { file: 'pt-BR/sight.close__any__base.m4a', reason: 'zu wenig Stimme' },
  { file: 'en/day.please__any__base.m4a', reason: 'zu wenig Stimme' },
  { file: 'en/transport.01.taxi__any__base.m4a', reason: 'zu wenige Wörter' },
  { file: 'pt-BR/transport.08.plate__any__base.m4a', reason: 'zu wenig Stimme' },
  { file: 'en/transport.10.ticket__any__base.m4a', reason: 'zu wenig Stimme' },
]

/** These legacy clips have no timing file, so the scorer has no words. */
const NO_TIMING = [
  'en/emergency.allergic__any__base.m4a',
  'en/emergency.peanut__any__base.m4a',
  'en/emergency.lost__any__base.m4a',
  'en/emergency.understand__any__base.m4a',
  'en/emergency.accident__any__base.m4a',
  'en/meet.origin__any__base.m4a',
  'en/meet.family__any__base.m4a',
  'en/meet.why__any__base.m4a',
  'en/meet.stay__any__base.m4a',
  'en/arrival.tourist__any__base.m4a',
  'en/arrival.days__any__base.m4a',
  'en/arrival.hotel__any__base.m4a',
  'en/arrival.purpose__any__base.m4a',
  'en/arrival.level__any__base.m4a',
  'en/food.order__any__base.m4a',
  'en/visa.evisa__any__base.m4a',
  'en/stay.problem__any__base.m4a',
  'de/stay.noisy__any__base.m4a',
  'en/shop.look__any__base.m4a',
  'en/transport.09.app__any__base.m4a',
]

function decode(path: string): Float32Array {
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', path, '-ac', '1', '-ar', '16000', '-f', 'f32le', 'pipe:1'], {
    maxBuffer: 8 * 1024 * 1024,
  })
  const bytes = Uint8Array.from(raw)
  return new Float32Array(bytes.buffer)
}

describe('shipped reference scored against itself', () => {
  it('gives stars for every phrase that has a timing file', () => {
    const stats = new Map<string, { stars: number; total: number }>()
    const missed: Array<{ file: string; reason: string }> = []
    const hop = analysisHop(16000)
    for (const line of allSpeechLines(rawCatalog.concepts)) {
      const audio = `public/audio/${line.file}`
      if (!existsSync(audio)) continue
      const bucket = stats.get(line.lang) ?? { stars: 0, total: 0 }
      bucket.total += 1
      stats.set(line.lang, bucket)
      const alignPath = audio.replace(/\.m4a$/, '.align.json')
      if (!existsSync(alignPath)) {
        missed.push({ file: line.file, reason: 'keine Zeitdatei' })
        continue
      }
      const times = parseAlignment(JSON.parse(readFileSync(alignPath, 'utf8')), splitWords(line.text).length)
      if (!times) {
        missed.push({ file: line.file, reason: 'Zeitdatei passt nicht zur Zeile' })
        continue
      }
      const samples = decode(audio)
      const duration = samples.length / 16000
      if (!alignmentFitsDuration(times, duration)) {
        missed.push({ file: line.file, reason: 'Zeitdatei länger als die Aufnahme' })
        continue
      }
      const contour = contourFromSamples(samples, 16000)
      const region = line.file.includes('__north__') ? 'north' : 'south'
      const score = scoreRepeat({
        model: contour,
        user: contour,
        modelHop: hop,
        userHop: hop,
        words: times.map((word, index) => ({ ...word, text: splitWords(line.text)[index] ?? '' })),
        lang: line.lang,
        region,
        userDuration: duration,
      })
      if (score.stars > 0) {
        bucket.stars += 1
        continue
      }
      const reason = score.unclear
        ? 'unklar'
        : score.tooShort
          ? 'zu kurz'
          : score.tooLittleVoice
            ? 'zu wenig Stimme'
            : score.fewWords
              ? 'zu wenige Wörter'
              : 'ohne Sterne'
      missed.push({ file: line.file, reason })
    }
    const label = (row: { file: string; reason: string }) => `${row.file} ${row.reason}`
    const noTiming = missed.filter((row) => row.reason === 'keine Zeitdatei')
    const scoredMiss = missed.filter((row) => row.reason !== 'keine Zeitdatei')
    expect(noTiming.map((row) => row.file).sort()).toEqual([...NO_TIMING].sort())
    expect(scoredMiss.map(label).sort()).toEqual(EXCEPTIONS.map(label).sort())
    expect([...stats.entries()].sort()).toEqual([
      ['de', { stars: 136, total: 137 }],
      ['en', { stars: 100, total: 123 }],
      ['pt-BR', { stars: 148, total: 150 }],
      ['vi', { stars: 216, total: 219 }],
    ])
  }, 180_000)
})
