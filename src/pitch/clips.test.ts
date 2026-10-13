import { execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync as readBytes } from 'fs'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createServer, type IncomingMessage } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { rawCatalog } from '../../content'
import { splitWords } from '../../content/gloss'
import { alignmentFitsDuration, parseAlignment } from '../audio/align'
import { tempoFile } from '../audio/speed'
import { VOICES } from '../audio/voices'
import { allSpeechLines, voiceFile } from '../content/resolve'
import { WORDS, wordAudioFile } from '../../content/words'
import { analyzeModel, analyzeUser } from './analyze'
import { clipProblem, lengthProblem } from './clip-plausible'
import { contourFromSamples, frameEnergy } from './contour'
import { scoreRepeat, type RepeatScore } from './feedback'
import { bandShape } from './spectrum'

/**
 * The shipped clips still decode, and the melody score still runs on each
 * timed line. Version 0.8.0 does not grade the sentence, so this file does
 * not count stars. ffmpeg is required in CI and skipped locally when absent.
 */

/**
 * The file against itself has no usable pitch, so test (a) does not ask it
 * for colours. joe «Help!» and «I cannot breathe.» have no voiced frame at
 * clarity 0.6. joe «It hurts here.» and «Where is the hospital?» now have
 * a scorable word, and that word stays green. vais1000 «Dạ.» and «Vâng.»
 * are shorter than 0.3 seconds.
 */
const SELF_THIN = new Set([
  'en/joe/emergency.help__any__base.m4a',
  'en/joe/emergency.breathe__any__base.m4a',
  'vi/meet.yes__south__base.m4a',
  'vi/meet.yes__north__base.m4a',
])

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
  'pt-BR/daisy-studious/day.toilet__any__base.m4a',
  'pt-BR/daisy-studious/emergency.accident__any__base.m4a',
  'pt-BR/daisy-studious/emergency.doctor__any__base.m4a',
  'pt-BR/daisy-studious/emergency.hurt__any__base.m4a',
  'pt-BR/daisy-studious/emergency.passport__any__base.m4a',
  'pt-BR/daisy-studious/emergency.peanut__any__base.m4a',
  'pt-BR/daisy-studious/meet.contact__any__senhor.m4a',
  'pt-BR/daisy-studious/meet.contact__any__senhora.m4a',
  'pt-BR/daisy-studious/meet.father__any__base.m4a',
  'pt-BR/daisy-studious/meet.food-q__any__senhor.m4a',
  'pt-BR/daisy-studious/meet.hobby-q__any__senhor.m4a',
  'pt-BR/daisy-studious/meet.hobby-q__any__senhora.m4a',
  'pt-BR/daisy-studious/meet.nice__any__senhor.m4a',
  'pt-BR/daisy-studious/meet.where-from__any__senhor.m4a',
  'pt-BR/daisy-studious/meet.where-from__any__senhora.m4a',
  'pt-BR/daisy-studious/meet.your-name__any__voce.m4a',
  'pt-BR/daisy-studious/shop.receipt__any__base.m4a',
  'pt-BR/daisy-studious/sight.open__any__base.m4a',
  'pt-BR/daisy-studious/stay.checkout__any__base.m4a',
  'pt-BR/daisy-studious/stay.reservation__any__base.m4a',
  'pt-BR/daisy-studious/transport.16.gate__any__base.m4a',
  'pt-BR/daisy-studious/transport.19.ferry__any__base.m4a',
  'pt-BR/gracie-wise/arrival.luggage__any__base.m4a',
  'pt-BR/gracie-wise/arrival.passport__any__base.m4a',
  'pt-BR/gracie-wise/day.today__any__base.m4a',
  'pt-BR/gracie-wise/day.toilet__any__base.m4a',
  'pt-BR/gracie-wise/emergency.accident__any__base.m4a',
  'pt-BR/gracie-wise/emergency.family__any__base.m4a',
  'pt-BR/gracie-wise/emergency.hurt__any__base.m4a',
  'pt-BR/gracie-wise/emergency.passport__any__base.m4a',
  'pt-BR/gracie-wise/food.recommend__any__senhora.m4a',
  'pt-BR/gracie-wise/meet.father__any__base.m4a',
  'pt-BR/gracie-wise/meet.hobby-q__any__senhor.m4a',
  'pt-BR/gracie-wise/meet.job-q__any__senhor.m4a',
  'pt-BR/gracie-wise/meet.job-q__any__senhora.m4a',
  'pt-BR/gracie-wise/meet.nice__any__senhor.m4a',
  'pt-BR/gracie-wise/meet.origin__any__base.m4a',
  'pt-BR/gracie-wise/meet.thanks__any__obrigada.m4a',
  'pt-BR/gracie-wise/meet.where-from__any__senhor.m4a',
  'pt-BR/gracie-wise/meet.yes__any__base.m4a',
  'pt-BR/gracie-wise/meet.your-name__any__senhor.m4a',
  'pt-BR/gracie-wise/meet.your-name__any__senhora.m4a',
  'pt-BR/gracie-wise/meet.your-name__any__voce.m4a',
  'pt-BR/gracie-wise/shop.receipt__any__base.m4a',
  'pt-BR/gracie-wise/sight.price__any__base.m4a',
  'pt-BR/gracie-wise/sight.where__any__base.m4a',
  'pt-BR/gracie-wise/stay.address__any__base.m4a',
  'pt-BR/gracie-wise/stay.checkout__any__base.m4a',
  'pt-BR/gracie-wise/stay.reservation__any__base.m4a',
  'pt-BR/gracie-wise/transport.04.airport__any__base.m4a',
  'pt-BR/gracie-wise/transport.05.price__any__base.m4a',
  'pt-BR/gracie-wise/transport.09.app__any__base.m4a',
  'pt-BR/gracie-wise/transport.13.line__any__base.m4a',
  'pt-BR/gracie-wise/transport.19.ferry__any__base.m4a',
  'pt-BR/tammie-ema/arrival.exit__any__base.m4a',
  'pt-BR/tammie-ema/arrival.luggage__any__base.m4a',
  'pt-BR/tammie-ema/arrival.passport__any__base.m4a',
  'pt-BR/tammie-ema/day.excuse__any__base.m4a',
  'pt-BR/tammie-ema/day.toilet__any__base.m4a',
  'pt-BR/tammie-ema/emergency.accident__any__base.m4a',
  'pt-BR/tammie-ema/emergency.allergic__any__base.m4a',
  'pt-BR/tammie-ema/emergency.ambulance__any__base.m4a',
  'pt-BR/tammie-ema/emergency.doctor__any__base.m4a',
  'pt-BR/tammie-ema/emergency.hurt__any__base.m4a',
  'pt-BR/tammie-ema/emergency.passport__any__base.m4a',
  'pt-BR/tammie-ema/emergency.peanut__any__base.m4a',
  'pt-BR/tammie-ema/meet.contact__any__senhor.m4a',
  'pt-BR/tammie-ema/meet.contact__any__senhora.m4a',
  'pt-BR/tammie-ema/meet.father__any__base.m4a',
  'pt-BR/tammie-ema/meet.job-q__any__senhora.m4a',
  'pt-BR/tammie-ema/meet.job-q__any__voce.m4a',
  'pt-BR/tammie-ema/meet.nice__any__senhor.m4a',
  'pt-BR/tammie-ema/meet.origin__any__base.m4a',
  'pt-BR/tammie-ema/meet.where-from__any__senhora.m4a',
  'pt-BR/tammie-ema/meet.where-from__any__voce.m4a',
  'pt-BR/tammie-ema/meet.your-name__any__voce.m4a',
  'pt-BR/tammie-ema/sight.price__any__base.m4a',
  'pt-BR/tammie-ema/sight.where__any__base.m4a',
  'pt-BR/tammie-ema/stay.reservation__any__base.m4a',
  'pt-BR/tammie-ema/transport.03.hotel__any__base.m4a',
  'pt-BR/tammie-ema/transport.08.plate__any__base.m4a',
  'pt-BR/tammie-ema/transport.19.ferry__any__base.m4a',
  'pt-BR/tammie-ema/visa.rules__any__senhor.m4a',
  'pt-BR/tammie-ema/visa.where__any__base.m4a',
  'pt-BR/claribel-dervla/arrival.luggage__any__base.m4a',
  'pt-BR/claribel-dervla/arrival.passport__any__base.m4a',
  'pt-BR/claribel-dervla/day.morning__any__base.m4a',
  'pt-BR/claribel-dervla/day.tomorrow__any__base.m4a',
  'pt-BR/claribel-dervla/emergency.accident__any__base.m4a',
  'pt-BR/claribel-dervla/emergency.doctor__any__base.m4a',
  'pt-BR/claribel-dervla/emergency.hospital__any__base.m4a',
  'pt-BR/claribel-dervla/emergency.hurt__any__base.m4a',
  'pt-BR/claribel-dervla/emergency.lost__any__base.m4a',
  'pt-BR/claribel-dervla/emergency.passport__any__base.m4a',
  'pt-BR/claribel-dervla/emergency.peanut__any__base.m4a',
  'pt-BR/claribel-dervla/food.recommend__any__senhor.m4a',
  'pt-BR/claribel-dervla/meet.address-ask__any__senhora.m4a',
  'pt-BR/claribel-dervla/meet.contact__any__senhor.m4a',
  'pt-BR/claribel-dervla/meet.contact__any__senhora.m4a',
  'pt-BR/claribel-dervla/meet.father__any__base.m4a',
  'pt-BR/claribel-dervla/meet.food-q__any__senhora.m4a',
  'pt-BR/claribel-dervla/meet.hobby-q__any__senhora.m4a',
  'pt-BR/claribel-dervla/meet.job-q__any__senhor.m4a',
  'pt-BR/claribel-dervla/meet.job-q__any__senhora.m4a',
  'pt-BR/claribel-dervla/meet.thanks__any__obrigada.m4a',
  'pt-BR/claribel-dervla/meet.where-from__any__senhora.m4a',
  'pt-BR/claribel-dervla/meet.your-name__any__voce.m4a',
  'pt-BR/claribel-dervla/shop.have__any__base.m4a',
  'pt-BR/claribel-dervla/shop.receipt__any__base.m4a',
  'pt-BR/claribel-dervla/sight.open__any__base.m4a',
  'pt-BR/claribel-dervla/sight.where__any__base.m4a',
  'pt-BR/claribel-dervla/stay.address__any__base.m4a',
  'pt-BR/claribel-dervla/stay.checkout__any__base.m4a',
  'pt-BR/claribel-dervla/transport.03.hotel__any__base.m4a',
  'pt-BR/claribel-dervla/transport.04.airport__any__base.m4a',
  'pt-BR/claribel-dervla/transport.13.line__any__base.m4a',
  'pt-BR/claribel-dervla/transport.16.gate__any__base.m4a',
  'pt-BR/claribel-dervla/visa.where__any__base.m4a',
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
        const samples = decode(audio)
        expect(clipProblem(file, samples), file).toBeNull()
        if (voice.provider === 'xtts') expect(lengthProblem(line.text, samples.length / 16000), file).toBeNull()
        for (const step of [0.7, 0.85] as const) {
          const slow = tempoFile(file, step)
          const slowPath = `public/audio/${slow}`
          if (!existsSync(slowPath)) continue
          expect(clipProblem(slow, decode(slowPath)), slow).toBeNull()
        }
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
        if (file === 'en/joe/emergency.help__any__base.m4a' || file === 'en/joe/emergency.breathe__any__base.m4a') {
          expect(score.reason, file).toBe('file')
          expect(score.tooLittleVoice, file).toBe(false)
          expect(score.melodyBar, file).toBeNull()
          expect(score.rhythmBar, file).toBeNull()
        }
        if (!SELF_THIN.has(file)) {
          expectAssessed(score, file)
          expect(score.otherSentence, file).toBe(false)
          for (const word of score.words ?? []) {
            if (word.scorable) expect(word.rhythm, `${file} ${word.text}`).toBe('green')
            if (word.melody != null) expect(word.melody, `${file} ${word.text}`).toBe('green')
          }
          expectReversed(samples, words, line.lang, region, duration, file)
        }
        timed += 1
      }
    }
    expect(timed, only).toBeGreaterThan(0)
    for (const file of missing) expect(KNOWN_MISSING.has(file), file).toBe(true)
    expectOtherVoice(only)
    if (only !== 'pt-BR') return
    for (const voice of VOICES.filter((item) => item.lang === 'pt-BR' && item.provider === 'xtts')) {
      for (const word of WORDS) {
        const file = voiceFile(wordAudioFile(word, 'pt-BR', 'south'), voice.id, false)
        const audio = `public/audio/${file}`
        expect(existsSync(audio), file).toBe(true)
        const samples = decode(audio)
        expect(clipProblem(file, samples), file).toBeNull()
        expect(lengthProblem(word.citation['pt-BR'], samples.length / 16000), file).toBeNull()
        for (const step of [0.7, 0.85] as const) {
          const slow = tempoFile(file, step)
          const slowPath = `public/audio/${slow}`
          expect(existsSync(slowPath), slow).toBe(true)
          expect(clipProblem(slow, decode(slowPath)), slow).toBeNull()
        }
        expect(existsSync(audio.replace(/\.m4a$/, '.align.json')), file).toBe(false)
      }
    }
  }

  function reverseSamples(samples: Float32Array): Float32Array {
    const reversed = new Float32Array(samples.length)
    for (let index = 0; index < samples.length; index += 1) reversed[index] = samples[samples.length - 1 - index] ?? 0
    return reversed
  }

  function expectReversed(
    samples: Float32Array,
    words: Array<{ text: string; start: number; end: number }>,
    lang: 'de' | 'en' | 'pt-BR' | 'vi',
    region: 'south' | 'north',
    duration: number,
    file: string,
  ): void {
    const reversed = reverseSamples(samples)
    const modelFeatures = analyzeModel(samples, 16000)
    const userFeatures = analyzeUser(reversed, 16000, modelFeatures.bands)
    const score = scoreRepeat({
      model: modelFeatures.contour,
      user: userFeatures.contour,
      modelHop: 0.01,
      userHop: 0.01,
      words,
      lang,
      region,
      userDuration: duration,
      modelEnergy: modelFeatures.energy,
      userEnergy: userFeatures.energy,
      modelBands: modelFeatures.bands,
      userBands: userFeatures.bands,
      userPlainBands: userFeatures.plainBands,
    })
    expect(score.unclear, file).toBe(true)
    expect(score.reason, file).toBe('unclear')
    expect(score.melodyBar, file).toBeNull()
    expect(score.rhythmBar, file).toBeNull()
    expect(score.words == null || score.words.every((word) => word.color == null), file).toBe(true)
  }

  function expectAssessed(score: RepeatScore, file: string): void {
    expect(score.words?.some((word) => word.color != null), file).toBe(true)
    expect(score.melodyBar, file).not.toBeNull()
    expect(score.rhythmBar, file).not.toBeNull()
  }

  function expectOtherVoice(only: string): void {
    const lines = allSpeechLines(rawCatalog.concepts).filter((line) => line.lang === only)
    const voices = VOICES.filter((item) => item.bundled && item.lang === only)
    for (const line of lines) {
      const ready = voices.flatMap((voice) => {
        const file = voiceFile(line.file, voice.id, voice.legacy)
        const audio = `public/audio/${file}`
        const alignPath = audio.replace(/\.m4a$/, '.align.json')
        if (!existsSync(audio) || !existsSync(alignPath)) return []
        const times = parseAlignment(JSON.parse(readFileSync(alignPath, 'utf8')), splitWords(line.text).length)
        if (!times) return []
        return [{ file, audio, times }]
      })
      for (const modelVoice of ready) {
        for (const userVoice of ready) {
          if (modelVoice.file === userVoice.file) continue
          if (SELF_THIN.has(modelVoice.file) || SELF_THIN.has(userVoice.file)) continue
          const modelSamples = decode(modelVoice.audio)
          const userSamples = decode(userVoice.audio)
          const duration = userSamples.length / 16000
          if (!alignmentFitsDuration(modelVoice.times, modelSamples.length / 16000)) continue
          const words = modelVoice.times.map((word, index) => ({ ...word, text: splitWords(line.text)[index] ?? '' }))
          const region: 'south' | 'north' = modelVoice.file.includes('__north__') ? 'north' : 'south'
          const score = scoreRepeat({
            model: contourFromSamples(modelSamples, 16000),
            user: contourFromSamples(userSamples, 16000),
            modelHop: 0.01,
            userHop: 0.01,
            words,
            lang: line.lang,
            region,
            userDuration: duration,
            modelEnergy: frameEnergy(modelSamples, 16000),
            userEnergy: frameEnergy(userSamples, 16000),
            modelBands: bandShape(modelSamples, 16000),
            userBands: bandShape(userSamples, 16000),
          })
          expectAssessed(score, `${modelVoice.file} <- ${userVoice.file}`)
          expect(score.otherSentence, `${modelVoice.file} <- ${userVoice.file}`).toBe(false)
        }
      }
    }
  }


  const allLangs = ['de', 'en', 'pt-BR', 'vi'] as const
  const requested = process.env.CLIP_LANG
  if (requested && !allLangs.includes(requested as (typeof allLangs)[number])) {
    throw new Error(`CLIP_LANG must be one of ${allLangs.join(', ')}`)
  }
  const clipLangs = requested ? allLangs.filter((lang) => lang === requested) : [...allLangs]

  for (const lang of clipLangs) {
    it.skipIf(!ready)(`decodes ${lang} and scores the melody`, () => checkLanguage(lang), 2_400_000)
  }

  const microphone = [
    { lang: 'de' as const, text: 'Können Sie das bitte aufschreiben?', file: 'public/audio/de/thorsten-high/emergency.write__any__base.m4a' },
    { lang: 'en' as const, text: 'Could you write that down, please?', file: 'public/audio/en/joe/emergency.write__any__base.m4a' },
    { lang: 'pt-BR' as const, text: 'Você pode escrever isso, por favor?', file: 'public/audio/pt-BR/cadu/emergency.write__any__base.m4a' },
    { lang: 'vi' as const, text: 'Xin viết ra giúp tôi.', file: 'public/audio/vi/vivos-22/emergency.write__any__base.m4a' },
  ]

  it.skipIf(!ready)('keeps rhythm green when the model clip is padded and resampled from 48 kHz', () => {
    for (const item of microphone) {
      if (!clipLangs.includes(item.lang)) continue
      const alignPath = item.file.replace(/\.m4a$/, '.align.json')
      const texts = splitWords(item.text)
      const times = parseAlignment(JSON.parse(readFileSync(alignPath, 'utf8')), texts.length)
      expect(times, item.file).not.toBeNull()
      const words = (times ?? []).map((word, index) => ({ ...word, text: texts[index] ?? '' }))
      const modelSamples = pcm(
        execFileSync('ffmpeg', ['-v', 'error', '-i', item.file, '-ac', '1', '-ar', '48000', '-f', 'f32le', 'pipe:1'], {
          maxBuffer: 16 * 1024 * 1024,
        }),
      )
      const lead = Math.floor(48000 * 0.45)
      const tail = Math.floor(48000 * 0.7)
      const userSamples = new Float32Array(lead + modelSamples.length + tail)
      userSamples.set(modelSamples, lead)
      const model = analyzeModel(modelSamples, 48000)
      const user = analyzeUser(userSamples, 48000, model.bands)
      const score = scoreRepeat({
        model: model.contour,
        user: user.contour,
        modelHop: 0.01,
        userHop: 0.01,
        words,
        lang: item.lang,
        region: 'south',
        userDuration: userSamples.length / 48000,
        modelEnergy: model.energy,
        userEnergy: user.energy,
        modelBands: model.bands,
        userBands: user.bands,
        userPlainBands: user.plainBands,
      })
      expectAssessed(score, item.file)
      for (const word of score.words ?? []) {
        if (word.scorable) expect(word.rhythm, `${item.file} ${word.text}`).toBe('green')
      }
      if (item.lang === 'en') expect(score.words?.find((word) => word.text === 'down,')?.rhythm, item.file).toBe('green')
      if (item.lang === 'pt-BR') {
        for (const text of ['isso,', 'favor?']) {
          const word = score.words?.find((candidate) => candidate.text === text)
          expect(word?.scorable, `${item.file} ${text}`).toBe(true)
          expect(word?.melody, `${item.file} ${text}`).toBe('green')
          expect(word?.rhythm, `${item.file} ${text}`).toBe('green')
        }
      }
      if (item.lang === 'vi') {
        expect(score.words, item.file).toHaveLength(5)
        expect(score.words?.every((word) => word.rhythm === 'green'), item.file).toBe(true)
      }
    }
  }, 120_000)

  it.skipIf(!ready)('keeps a short clip in time when the microphone has a lead-in', () => {
    const file = 'public/audio/vi/vivos-22/transport.05.price__any__base.m4a'
    const texts = splitWords('Bao nhiêu?')
    const times = parseAlignment(JSON.parse(readFileSync(file.replace(/\.m4a$/, '.align.json'), 'utf8')), texts.length)
    expect(times, file).not.toBeNull()
    const words = (times ?? []).map((word, index) => ({ ...word, text: texts[index] ?? '' }))
    const modelSamples = pcm(
      execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', '48000', '-f', 'f32le', 'pipe:1'], {
        maxBuffer: 16 * 1024 * 1024,
      }),
    )
    const lead = Math.floor(48000 * 0.45)
    const tail = Math.floor(48000 * 0.7)
    const userSamples = new Float32Array(lead + modelSamples.length + tail)
    userSamples.set(modelSamples, lead)
    const model = analyzeModel(modelSamples, 48000)
    const user = analyzeUser(userSamples, 48000, model.bands)
    const score = scoreRepeat({
      model: model.contour,
      user: user.contour,
      modelHop: 0.01,
      userHop: 0.01,
      words,
      lang: 'vi',
      region: 'south',
      userDuration: userSamples.length / 48000,
      modelEnergy: model.energy,
      userEnergy: user.energy,
      modelBands: model.bands,
      userBands: user.bands,
      userPlainBands: user.plainBands,
    })
    expect(score.globalRatio ?? 0, file).toBeGreaterThan(0.85)
    expect(score.globalRatio ?? 9, file).toBeLessThan(1.2)
    expect(score.rhythmBar, file).toBe('passt')
    for (const word of score.words ?? []) {
      if (word.scorable) expect(word.rhythm, `${file} ${word.text}`).toBe('green')
    }
  }, 60_000)

  it.skipIf(!ready)('dates a short word of a real clip at the centre of the window', () => {
    const file = 'public/audio/en/joe/emergency.ambulance__any__base.m4a'
    const texts = splitWords('Please call an ambulance.')
    const times = parseAlignment(JSON.parse(readFileSync(file.replace(/\.m4a$/, '.align.json'), 'utf8')), texts.length)
    const word = times?.find((_, index) => texts[index] === 'an')
    expect(word, file).toBeTruthy()
    const samples = decode(file)
    const contour = contourFromSamples(samples, 16000)
    const from = Math.floor((word?.start ?? 0) / 0.01)
    const to = Math.ceil((word?.end ?? 0) / 0.01)
    let voiced = 0
    for (let index = from; index < to && index < contour.length; index += 1) if (contour[index] != null) voiced += 1
    expect(voiced, file).toBeGreaterThanOrEqual(3)
  }, 30_000)

  it.skipIf(!ready)('keeps the tempo when a real clip is followed by a quiet copy', () => {
    const file = 'public/audio/vi/vivos-22/transport.05.price__any__base.m4a'
    const texts = splitWords('Bao nhiêu?')
    const times = parseAlignment(JSON.parse(readFileSync(file.replace(/\.m4a$/, '.align.json'), 'utf8')), texts.length)
    const words = (times ?? []).map((word, index) => ({ ...word, text: texts[index] ?? '' }))
    const modelSamples = decode(file)
    const gap = Math.floor(16000 * 0.12)
    const quiet = new Float32Array(modelSamples.length)
    for (let index = 0; index < modelSamples.length; index += 1) quiet[index] = (modelSamples[index] ?? 0) * 0.04
    const userSamples = new Float32Array(modelSamples.length + gap + quiet.length)
    userSamples.set(modelSamples, 0)
    userSamples.set(quiet, modelSamples.length + gap)
    const model = analyzeModel(modelSamples, 16000)
    const user = analyzeUser(userSamples, 16000, model.bands)
    const score = scoreRepeat({
      model: model.contour,
      user: user.contour,
      modelHop: 0.01,
      userHop: 0.01,
      words,
      lang: 'vi',
      region: 'south',
      userDuration: userSamples.length / 16000,
      modelEnergy: model.energy,
      userEnergy: user.energy,
      modelBands: model.bands,
      userBands: user.bands,
      userPlainBands: user.plainBands,
    })
    const modelVoiced = model.contour.filter((value) => value != null).length
    const userVoiced = user.contour.filter((value) => value != null).length
    expect(userVoiced, file).toBeGreaterThan(modelVoiced + 8)
    expect(score.globalRatio ?? 9, file).toBeLessThan(1.25)
    expect(score.rhythmBar, file).toBe('passt')
    expect(score.words?.some((word) => word.rhythm === 'green'), file).toBe(true)
  }, 30_000)

  it.skipIf(!ready)('paints at least one word yellow when another voice says the same line', () => {
    const text = 'Mir ist schwindlig.'
    const texts = splitWords(text)
    const modelFile = 'public/audio/de/emergency.dizzy__any__base.m4a'
    const userFile = 'public/audio/de/thorsten-high/emergency.dizzy__any__base.m4a'
    const times = parseAlignment(JSON.parse(readFileSync(modelFile.replace(/\.m4a$/, '.align.json'), 'utf8')), texts.length)
    const words = (times ?? []).map((word, index) => ({ ...word, text: texts[index] ?? '' }))
    const modelSamples = decode(modelFile)
    const userSamples = decode(userFile)
    const score = scoreRepeat({
      model: contourFromSamples(modelSamples, 16000),
      user: contourFromSamples(userSamples, 16000),
      modelHop: 0.01,
      userHop: 0.01,
      words,
      lang: 'de',
      region: 'south',
      userDuration: userSamples.length / 16000,
      modelEnergy: frameEnergy(modelSamples, 16000),
      userEnergy: frameEnergy(userSamples, 16000),
      modelBands: bandShape(modelSamples, 16000),
      userBands: bandShape(userSamples, 16000),
    })
    const schwindlig = score.words?.find((word) => word.text === 'schwindlig.')
    expect(schwindlig?.rhythm, modelFile).toBe('yellow')
    expect(score.melodyBar, modelFile).not.toBeNull()
    expect(score.rhythmBar, modelFile).not.toBeNull()
    expect(score.otherSentence, modelFile).toBe(false)
  }, 30_000)

  function decodeRate(path: string, rate: number): Float32Array {
    return pcm(
      execFileSync('ffmpeg', ['-v', 'error', '-i', path, '-ac', '1', '-ar', String(rate), '-f', 'f32le', 'pipe:1'], {
        maxBuffer: 16 * 1024 * 1024,
      }),
    )
  }

  function withLead(samples: Float32Array, rate: number): Float32Array {
    const lead = Math.floor(rate * 0.45)
    const tail = Math.floor(rate * 0.7)
    const padded = new Float32Array(lead + samples.length + tail)
    padded.set(samples, lead)
    return padded
  }

  /** Opus at 32 kbit/s, the codec the browser records into. */
  function throughOpus(samples: Float32Array, rate: number): Float32Array {
    const dir = mkdtempSync(join(tmpdir(), 'tt-opus-'))
    try {
      const wav = join(dir, 'in.wav')
      const webm = join(dir, 'out.webm')
      const data = Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength)
      const header = Buffer.alloc(44)
      header.write('RIFF', 0)
      header.writeUInt32LE(36 + data.length, 4)
      header.write('WAVE', 8)
      header.write('fmt ', 12)
      header.writeUInt32LE(16, 16)
      header.writeUInt16LE(3, 20)
      header.writeUInt16LE(1, 22)
      header.writeUInt32LE(rate, 24)
      header.writeUInt32LE(rate * 4, 28)
      header.writeUInt16LE(4, 32)
      header.writeUInt16LE(32, 34)
      header.write('data', 36)
      header.writeUInt32LE(data.length, 40)
      writeFileSync(wav, Buffer.concat([header, data]) as unknown as string)
      execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', wav, '-c:a', 'libopus', '-b:a', '32k', '-application', 'voip', webm])
      return decodeRate(webm, rate)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  }

  function scorePadded(
    modelFile: string,
    userSamples: Float32Array,
    text: string,
    lang: 'de' | 'en' | 'pt-BR' | 'vi',
  ): RepeatScore {
    const rate = 48000
    const texts = splitWords(text)
    const times = parseAlignment(JSON.parse(readFileSync(modelFile.replace(/\.m4a$/, '.align.json'), 'utf8')), texts.length)
    const words = (times ?? []).map((word, index) => ({ ...word, text: texts[index] ?? '' }))
    const modelSamples = decodeRate(modelFile, rate)
    const model = analyzeModel(modelSamples, rate)
    const user = analyzeUser(userSamples, rate, model.bands)
    return scoreRepeat({
      model: model.contour,
      user: user.contour,
      modelHop: 0.01,
      userHop: 0.01,
      words,
      lang,
      region: 'south',
      userDuration: userSamples.length / rate,
      modelEnergy: model.energy,
      userEnergy: user.energy,
      modelBands: model.bands,
      userBands: user.bands,
      userPlainBands: user.plainBands,
    })
  }

  it.skipIf(!ready || !clipLangs.includes('de'))(
    'marks a longer word when another German voice is padded like a microphone',
    () => {
      const text = 'Können Sie das bitte aufschreiben?'
      const modelFile = 'public/audio/de/thorsten-high/emergency.write__any__base.m4a'
      const userFile = 'public/audio/de/emergency.write__any__base.m4a'
      const user = withLead(decodeRate(userFile, 48000), 48000)
      const score = scorePadded(modelFile, user, text, 'de')
      const sie = score.words?.find((word) => word.text === 'Sie')
      expect(sie?.scorable, modelFile).toBe(true)
      expect(['yellow', 'red']).toContain(sie?.rhythm)
      const own = scorePadded(modelFile, withLead(decodeRate(modelFile, 48000), 48000), text, 'de')
      for (const word of own.words ?? []) {
        if (word.scorable) expect(word.rhythm, `${modelFile} ${word.text}`).toBe('green')
      }
    },
    60_000,
  )

  it.skipIf(!ready || !clipLangs.includes('en'))(
    'keeps «down,» green after the padded take is encoded with opus',
    () => {
      const text = 'Could you write that down, please?'
      const file = 'public/audio/en/joe/emergency.write__any__base.m4a'
      const coded = throughOpus(withLead(decodeRate(file, 48000), 48000), 48000)
      const score = scorePadded(file, coded, text, 'en')
      const down = score.words?.find((word) => word.text === 'down,')
      expect(down?.rhythm, file).toBe('green')
      for (const word of score.words ?? []) {
        if (word.scorable) expect(word.rhythm, `${file} ${word.text}`).toBe('green')
      }
      const where = 'public/audio/en/transport.02.where__any__base.m4a'
      const short = scorePadded(where, withLead(decodeRate(where, 48000), 48000), 'Where to?', 'en')
      expect(short.globalRatio ?? 0, where).toBeGreaterThan(0.85)
      expect(short.globalRatio ?? 9, where).toBeLessThan(1.2)
      for (const word of short.words ?? []) {
        if (word.scorable) expect(word.rhythm, `${where} ${word.text}`).toBe('green')
      }
    },
    60_000,
  )

  it.skipIf(!ready || !clipLangs.includes('pt-BR'))(
    'keeps cadu «isso,» and «favor?» green after the padded take is encoded with opus',
    () => {
      const line = 'Você pode escrever isso, por favor?'
      const file = 'public/audio/pt-BR/cadu/emergency.write__any__base.m4a'
      const coded = throughOpus(withLead(decodeRate(file, 48000), 48000), 48000)
      const score = scorePadded(file, coded, line, 'pt-BR')
      for (const text of ['isso,', 'favor?']) {
        const word = score.words?.find((candidate) => candidate.text === text)
        expect(word?.scorable, `${file} ${text}`).toBe(true)
        expect(word?.melody, `${file} ${text}`).toBe('green')
        expect(word?.rhythm, `${file} ${text}`).toBe('green')
      }
      expect(score.rhythmBar, file).toBe('passt')
    },
    60_000,
  )

  /**
   * Coloured-word red share against cadu, before the wider pt-BR band,
   * on the clips in this tree. A drop of ten points is the floor.
   * Putting pt-BR back to 1.5/3 leaves faber at 240 of 591, above the floor.
   * Turning the clear-turn rule off leaves the reversed senhora line, and
   * «Bom dia.» for Daisy, Tammie and Claribel, short of «daneben».
   */
  const RED_BEFORE_CADU: Record<string, number> = {
    faber: 262 / 591,
    'daisy-studious': 227 / 595,
    'gracie-wise': 263 / 575,
    'tammie-ema': 252 / 579,
    'claribel-dervla': 230 / 585,
  }
  const MIN_RED_DROP = 0.1

  function scoreHeard(
    modelFile: string,
    userSamples: Float32Array,
    text: string,
  ): RepeatScore {
    const texts = splitWords(text)
    const times = parseAlignment(JSON.parse(readFileSync(modelFile.replace(/\.m4a$/, '.align.json'), 'utf8')), texts.length)
    const words = (times ?? []).map((word, index) => ({ ...word, text: texts[index] ?? '' }))
    const modelSamples = decode(modelFile)
    const model = analyzeModel(modelSamples, 16000)
    const user = analyzeUser(userSamples, 16000, model.bands)
    return scoreRepeat({
      model: model.contour,
      user: user.contour,
      modelHop: 0.01,
      userHop: 0.01,
      words,
      lang: 'pt-BR',
      region: 'south',
      userDuration: userSamples.length / 16000,
      modelEnergy: model.energy,
      userEnergy: user.energy,
      modelBands: model.bands,
      userBands: user.bands,
      userPlainBands: user.plainBands,
    })
  }

  it.skipIf(!ready || !clipLangs.includes('pt-BR'))(
    'marks fewer words red when another correct pt-BR voice is scored against cadu',
    () => {
      const others = VOICES.filter((voice) => voice.bundled && voice.lang === 'pt-BR' && voice.id !== 'cadu')
      expect(others.map((voice) => voice.id)).toContain('faber')
      const lines = allSpeechLines(rawCatalog.concepts).filter((line) => line.lang === 'pt-BR')
      for (const voice of others) {
        const before = RED_BEFORE_CADU[voice.id]
        expect(before, voice.id).toBeTypeOf('number')
        let red = 0
        let coloured = 0
        let sentences = 0
        for (const line of lines) {
          const modelFile = `public/audio/${voiceFile(line.file, 'cadu', false)}`
          const userFile = `public/audio/${voiceFile(line.file, voice.id, voice.legacy)}`
          const alignPath = modelFile.replace(/\.m4a$/, '.align.json')
          if (!existsSync(modelFile) || !existsSync(userFile) || !existsSync(alignPath)) continue
          const texts = splitWords(line.text)
          const times = parseAlignment(JSON.parse(readFileSync(alignPath, 'utf8')), texts.length)
          if (!times) continue
          const modelSamples = decode(modelFile)
          if (!alignmentFitsDuration(times, modelSamples.length / 16000)) continue
          const score = scoreHeard(modelFile, decode(userFile), line.text)
          sentences += 1
          for (const word of score.words ?? []) {
            if (word.color == null) continue
            coloured += 1
            if (word.color === 'red') red += 1
          }
        }
        expect(sentences, voice.id).toBeGreaterThan(100)
        expect(coloured, voice.id).toBeGreaterThan(0)
        const share = red / coloured
        expect(share, `${voice.id} ${red}/${coloured}`).toBeLessThanOrEqual((before ?? 1) - MIN_RED_DROP)
      }
    },
    600_000,
  )

  it.skipIf(!ready || !clipLangs.includes('pt-BR'))(
    'keeps a different sentence and a reversed take mostly red',
    () => {
      const wrongModel = 'public/audio/pt-BR/cadu/transport.07.here__any__base.m4a'
      const wrongUser = 'public/audio/pt-BR/cadu/emergency.doctor__any__base.m4a'
      const wrong = scoreHeard(wrongModel, decode(wrongUser), 'Por favor, pare aqui.')
      const wrongColoured = (wrong.words ?? []).filter((word) => word.color != null)
      const wrongRed = wrongColoured.filter((word) => word.color === 'red')
      expect(wrong.unclear, wrongModel).toBe(false)
      expect(wrong.melodyBar, wrongModel).toBe('daneben')
      expect(wrongRed.length * 2, wrongModel).toBeGreaterThanOrEqual(wrongColoured.length)

      const reverseModel = 'public/audio/pt-BR/cadu/meet.repeat__any__senhora.m4a'
      const reverseUser = 'public/audio/pt-BR/meet.repeat__any__senhora.m4a'
      const reversed = Float32Array.from(decode(reverseUser))
      reversed.reverse()
      const back = scoreHeard(reverseModel, reversed, 'A senhora pode repetir, por favor?')
      const backColoured = (back.words ?? []).filter((word) => word.color != null)
      const backRed = backColoured.filter((word) => word.color === 'red')
      expect(back.unclear, reverseModel).toBe(false)
      expect(back.melodyBar, reverseModel).toBe('daneben')
      expect(backRed.length * 2, reverseModel).toBeGreaterThanOrEqual(backColoured.length)

      const morning = 'pt-BR/day.morning__any__base.m4a'
      const morningModel = `public/audio/${voiceFile(morning, 'cadu', false)}`
      for (const voice of VOICES.filter((item) => item.bundled && item.lang === 'pt-BR' && item.id !== 'cadu')) {
        const userFile = `public/audio/${voiceFile(morning, voice.id, voice.legacy)}`
        const turned = Float32Array.from(decode(userFile))
        turned.reverse()
        const score = scoreHeard(morningModel, turned, 'Bom dia.')
        const coloured = (score.words ?? []).filter((word) => word.color != null)
        const reds = coloured.filter((word) => word.color === 'red')
        expect(score.unclear, voice.id).toBe(false)
        expect(score.melodyBar, voice.id).toBe('daneben')
        expect(reds.length * 2, voice.id).toBeGreaterThanOrEqual(coloured.length)
      }
    },
    60_000,
  )

  it.skipIf(!ready || !clipLangs.includes('vi'))(
    'keeps the rhythm bar when a real clip fades and the decay still counts',
    () => {
      const file = 'public/audio/vi/day.please__any__base.m4a'
      const texts = splitWords('Làm ơn.')
      const times = parseAlignment(JSON.parse(readFileSync(file.replace(/\.m4a$/, '.align.json'), 'utf8')), texts.length)
      const words = (times ?? []).map((word, index) => ({ ...word, text: texts[index] ?? '' }))
      const samples = decode(file)
      const model = analyzeModel(samples, 16000)
      expect(model.contour.length, file).toBe(41)
      const userEnergy = model.energy.map((value, index) => (index < 26 ? value : value * 0.05))
      const score = scoreRepeat({
        model: model.contour,
        user: model.contour,
        modelHop: 0.01,
        userHop: 0.01,
        words,
        lang: 'vi',
        region: 'south',
        userDuration: samples.length / 16000,
        modelEnergy: model.energy,
        userEnergy,
        modelBands: model.bands,
        userBands: model.bands,
        userPlainBands: model.plainBands,
      })
      expect(score.globalRatio ?? 0, file).toBeGreaterThan(0.7)
      expect(score.globalRatio ?? 9, file).toBeLessThan(0.9)
      expect(score.rhythmBar, file).toBe('passt')
      expect(score.words?.every((word) => word.rhythm === 'green'), file).toBe(true)
    },
    30_000,
  )

  function chromeBinary(): string | null {
    for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
      try {
        const found = execFileSync('which', [name], { encoding: 'utf8' }).trim()
        if (found) return found
      } catch {
        // The next name may still be installed.
      }
    }
    return null
  }

  function requireChrome(): string | null {
    const bin = chromeBinary()
    if (bin) return bin
    expect(process.env.CI, 'Chrome fehlt. Der Mikrofonweg wird in CI für pt-BR und vi verlangt.').not.toBe('true')
    return null
  }

  function writePcm16Wav(path: string, samples: Float32Array, rate: number): void {
    const data = Buffer.alloc(samples.length * 2)
    for (let index = 0; index < samples.length; index += 1) {
      const clamped = Math.max(-1, Math.min(1, samples[index] ?? 0))
      data.writeInt16LE(Math.round(clamped * 32767), index * 2)
    }
    const header = Buffer.alloc(44)
    header.write('RIFF', 0)
    header.writeUInt32LE(36 + data.length, 4)
    header.write('WAVE', 8)
    header.write('fmt ', 12)
    header.writeUInt32LE(16, 16)
    header.writeUInt16LE(1, 20)
    header.writeUInt16LE(1, 22)
    header.writeUInt32LE(rate, 24)
    header.writeUInt32LE(rate * 2, 28)
    header.writeUInt16LE(2, 32)
    header.writeUInt16LE(16, 34)
    header.write('data', 36)
    header.writeUInt32LE(data.length, 40)
    writeFileSync(path, Buffer.concat([header, data]) as unknown as string)
  }

  function readPostedSamples(body: Buffer): { rate: number; samples: Float32Array } {
    const view = new DataView(body.buffer, body.byteOffset, body.byteLength)
    const rate = view.getUint32(0, true)
    const length = view.getUint32(4, true)
    if (length <= 0 || 8 + length * 4 > body.byteLength) throw new Error('Chrome hat keine Samples geschickt.')
    const samples = new Float32Array(length)
    for (let index = 0; index < length; index += 1) samples[index] = view.getFloat32(8 + index * 4, true)
    return { rate, samples }
  }

  /**
   * The same path as a take in the app: Chrome decodes the file, and
   * MediaRecorder with echo cancellation writes the fake microphone.
   * Each take opens the microphone again, as «Nochmal» does.
   */
  async function captureChrome(
    bin: string,
    modelFile: string,
    userSamples: Float32Array,
    rate: number,
    takes: number,
  ): Promise<Array<{ tag: string; rate: number; samples: Float32Array }>> {
    const dir = mkdtempSync(join(tmpdir(), 'tt-chrome-'))
    const wav = join(dir, 'mic.wav')
    writePcm16Wav(wav, userSamples, rate)
    const ms = Math.max(800, Math.round((userSamples.length / rate) * 1000) - 200)
    const page = `<!doctype html>
<meta charset="utf-8" />
<script>
async function postSamples(samples, sampleRate, tag) {
  const raw = new Uint8Array(samples.buffer.slice(0))
  const body = new Uint8Array(8 + raw.length)
  const view = new DataView(body.buffer)
  view.setUint32(0, sampleRate, true)
  view.setUint32(4, samples.length, true)
  body.set(raw, 8)
  const response = await fetch('/save?tag=' + encodeURIComponent(tag), { method: 'POST', body })
  if (!response.ok) throw new Error(tag + ' ' + response.status)
}
async function decodeFile(url, tag) {
  const context = new AudioContext()
  const bytes = await (await fetch(url)).arrayBuffer()
  const buffer = await context.decodeAudioData(bytes.slice(0))
  const mixed = new Float32Array(buffer.length)
  for (let index = 0; index < buffer.length; index += 1) {
    let sum = 0
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) sum += buffer.getChannelData(channel)[index] || 0
    mixed[index] = sum / buffer.numberOfChannels
  }
  await postSamples(mixed, buffer.sampleRate, tag)
  await context.close()
}
async function recordOnce(durationMs, tag) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false },
  })
  const recorder = new MediaRecorder(stream)
  const chunks = []
  recorder.addEventListener('dataavailable', (event) => { if (event.data.size > 0) chunks.push(event.data) })
  const stopped = new Promise((resolve) => recorder.addEventListener('stop', resolve))
  recorder.start()
  await new Promise((resolve) => setTimeout(resolve, durationMs))
  recorder.stop()
  await stopped
  for (const track of stream.getTracks()) track.stop()
  const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
  const context = new AudioContext()
  const buffer = await context.decodeAudioData(await blob.arrayBuffer())
  await postSamples(buffer.getChannelData(0).slice(0), buffer.sampleRate, tag)
  await context.close()
}
async function main() {
  const params = new URLSearchParams(location.search)
  await decodeFile(params.get('file'), 'model')
  const count = Number(params.get('takes') || '1')
  const durationMs = Number(params.get('ms') || '1000')
  for (let index = 1; index <= count; index += 1) {
    await recordOnce(durationMs, 'take' + index)
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
  await fetch('/done', { method: 'POST' })
}
main().catch((error) => fetch('/fail', { method: 'POST', body: String(error && error.stack ? error.stack : error) }))
</script>`
    writeFileSync(join(dir, 'page.html'), page)
    const saved = new Map<string, { rate: number; samples: Float32Array }>()
    let failure = ''
    let settle: (() => void) | null = null
    const finished = new Promise<void>((resolve) => {
      settle = resolve
    })
    const server = createServer(async (request, response) => {
      try {
        const url = new URL(request.url || '/', 'http://127.0.0.1')
        if (request.method === 'GET' && url.pathname === '/page.html') {
          const bytes = readBytes(join(dir, 'page.html'))
          response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
          response.write(bytes)
          response.end()
          return
        }
        if (request.method === 'GET' && url.pathname === '/model.m4a') {
          const bytes = readBytes(modelFile)
          response.writeHead(200, { 'content-type': 'audio/mp4' })
          response.write(bytes)
          response.end()
          return
        }
        const body = await readRequest(request)
        if (request.method === 'POST' && url.pathname === '/fail') {
          failure = body.toString('utf8')
          response.writeHead(204)
          response.end()
          settle?.()
          return
        }
        if (request.method === 'POST' && url.pathname === '/done') {
          response.writeHead(204)
          response.end()
          settle?.()
          return
        }
        if (request.method === 'POST' && url.pathname === '/save') {
          const tag = url.searchParams.get('tag') || ''
          saved.set(tag, readPostedSamples(body))
          response.writeHead(204)
          response.end()
          return
        }
        response.writeHead(404)
        response.end()
      } catch (error) {
        failure = error instanceof Error ? error.message : String(error)
        response.writeHead(500)
        response.end()
        settle?.()
      }
    })
    const child = await new Promise<ReturnType<typeof spawn>>((resolve, reject) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address()
        if (!address || typeof address === 'string') {
          reject(new Error('Der lokale Server hat keinen Port.'))
          return
        }
        const profile = join(dir, 'profile')
        const chrome = spawn(
          bin,
          [
            '--headless=new',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--use-fake-device-for-media-stream',
            `--use-file-for-fake-audio-capture=${wav}`,
            '--use-fake-ui-for-media-stream',
            '--autoplay-policy=no-user-gesture-required',
            `--user-data-dir=${profile}`,
            `http://127.0.0.1:${address.port}/page.html?file=model.m4a&ms=${ms}&takes=${takes}`,
          ],
          { detached: true, stdio: 'ignore' },
        )
        resolve(chrome)
      })
      server.on('error', reject)
    })
    const timer = setTimeout(() => {
      failure = failure || 'Chrome hat die Takes nicht rechtzeitig geschickt.'
      settle?.()
    }, ms * takes + 20_000)
    try {
      await finished
      if (failure) throw new Error(failure)
      const model = saved.get('model')
      if (!model) throw new Error('Chrome hat die Datei nicht dekodiert.')
      const takesOut = []
      for (let index = 1; index <= takes; index += 1) {
        const take = saved.get(`take${index}`)
        if (!take) throw new Error(`Chrome hat Take ${index} nicht geschickt.`)
        takesOut.push({ tag: `take${index}`, ...take })
      }
      return [{ tag: 'model', ...model }, ...takesOut]
    } finally {
      clearTimeout(timer)
      if (child.pid != null) {
        try {
          process.kill(-child.pid, 'SIGKILL')
        } catch {
          child.kill('SIGKILL')
        }
      }
      await new Promise<void>((resolve) => server.close(() => resolve()))
      rmSync(dir, { recursive: true, force: true })
    }
  }

  function scoreChrome(
    modelFile: string,
    text: string,
    lang: 'pt-BR' | 'vi',
    modelTake: { rate: number; samples: Float32Array },
    userTake: { rate: number; samples: Float32Array },
  ): RepeatScore {
    const texts = splitWords(text)
    const times = parseAlignment(JSON.parse(readFileSync(modelFile.replace(/\.m4a$/, '.align.json'), 'utf8')), texts.length)
    const words = (times ?? []).map((word, index) => ({ ...word, text: texts[index] ?? '' }))
    const model = analyzeModel(modelTake.samples, modelTake.rate)
    const user = analyzeUser(userTake.samples, userTake.rate, model.bands)
    return scoreRepeat({
      model: model.contour,
      user: user.contour,
      modelHop: 0.01,
      userHop: 0.01,
      words,
      lang,
      region: 'south',
      userDuration: userTake.samples.length / userTake.rate,
      modelEnergy: model.energy,
      userEnergy: user.energy,
      modelBands: model.bands,
      userBands: user.bands,
      userPlainBands: user.plainBands,
    })
  }

  function expectStableGreen(scores: RepeatScore[], file: string, required: readonly string[]): void {
    expect(scores.length, file).toBeGreaterThanOrEqual(3)
    for (const score of scores) {
      expect(score.melodyBar, file).toBe('passt')
      expect(score.rhythmBar, file).toBe('passt')
      for (const word of score.words ?? []) {
        if (!word.scorable) continue
        expect(word.melody, `${file} ${word.text}`).toBe('green')
        expect(word.rhythm, `${file} ${word.text}`).toBe('green')
      }
      for (const text of required) {
        const word = score.words?.find((item) => item.text === text)
        expect(word?.melody, `${file} ${text}`).toBe('green')
        expect(word?.rhythm, `${file} ${text}`).toBe('green')
      }
    }
    const first = scores[0]?.words ?? []
    for (const word of first) {
      if (word.rawRatio == null) continue
      for (const score of scores.slice(1)) {
        const again = score.words?.find((item) => item.text === word.text)
        const delta = Math.abs((again?.rawRatio ?? 0) - word.rawRatio)
        expect(delta, `${file} ${word.text}`).toBeLessThanOrEqual(0.08)
      }
    }
  }

  it.skipIf(!ready || !clipLangs.includes('pt-BR'))(
    'keeps cadu green across three Chrome microphone takes',
    async () => {
      const bin = requireChrome()
      if (!bin) return
      const text = 'Você pode escrever isso, por favor?'
      const file = 'public/audio/pt-BR/cadu/emergency.write__any__base.m4a'
      const padded = withLead(decodeRate(file, 48000), 48000)
      const captured = await captureChrome(bin, file, padded, 48000, 3)
      const model = captured[0]
      if (!model) throw new Error('Chrome hat die Datei nicht dekodiert.')
      const scores = captured.slice(1).map((take) => scoreChrome(file, text, 'pt-BR', model, take))
      expectStableGreen(scores, file, ['Você', 'pode', 'escrever', 'isso,', 'por', 'favor?'])
    },
    90_000,
  )

  it.skipIf(!ready || !clipLangs.includes('vi'))(
    'keeps the heard Vietnamese file green across three Chrome microphone takes',
    async () => {
      const bin = requireChrome()
      if (!bin) return
      const text = 'Xin viết ra giúp tôi.'
      const file = 'public/audio/vi/vivos-22/emergency.write__any__base.m4a'
      const padded = withLead(decodeRate(file, 48000), 48000)
      const captured = await captureChrome(bin, file, padded, 48000, 3)
      const model = captured[0]
      if (!model) throw new Error('Chrome hat die Datei nicht dekodiert.')
      const scores = captured.slice(1).map((take) => scoreChrome(file, text, 'vi', model, take))
      expectStableGreen(scores, file, ['Xin', 'viết', 'ra', 'giúp', 'tôi.'])
    },
    90_000,
  )

  it.skipIf(!ready || !clipLangs.includes('vi'))(
    'marks a shorter word when another Vietnamese voice is recorded in Chrome',
    async () => {
      const bin = requireChrome()
      if (!bin) return
      const writeText = 'Xin viết ra giúp tôi.'
      const writeModel = 'public/audio/vi/vivos-22/emergency.write__any__base.m4a'
      const writeUser = 'public/audio/vi/vivos-32/emergency.write__any__base.m4a'
      const writeCapture = await captureChrome(bin, writeModel, withLead(decodeRate(writeUser, 48000), 48000), 48000, 2)
      const writeHeard = writeCapture[0]
      if (!writeHeard) throw new Error('Chrome hat die Datei nicht dekodiert.')
      const writeScores = writeCapture.slice(1).map((take) => scoreChrome(writeModel, writeText, 'vi', writeHeard, take))
      for (const score of writeScores) {
        expect(score.rhythmBar, writeModel).not.toBeNull()
        const toi = score.words?.find((word) => word.text === 'tôi.')
        expect(toi?.scorable, writeModel).toBe(true)
        expect(['yellow', 'red']).toContain(toi?.rhythm)
        expect(toi?.rawRatio ?? 1, writeModel).toBeLessThan(0.7)
      }
      const first = writeScores[0]?.words ?? []
      for (const word of first) {
        if (word.rawRatio == null) continue
        const again = writeScores[1]?.words?.find((item) => item.text === word.text)
        expect(Math.abs((again?.rawRatio ?? 0) - word.rawRatio), word.text).toBeLessThanOrEqual(0.05)
        if (word.text === 'tôi.') continue
        if (word.scorable) expect(word.rhythm, word.text).toBe('green')
      }
      // The older bundled voice stays inside the green band. Its alignment
      // does too. The longer vivos-32 take is the one that leaves it.
      const legacyUser = 'public/audio/vi/emergency.write__any__base.m4a'
      const legacyCapture = await captureChrome(bin, writeModel, withLead(decodeRate(legacyUser, 48000), 48000), 48000, 1)
      const legacyHeard = legacyCapture[0]
      const legacyTake = legacyCapture[1]
      if (!legacyHeard || !legacyTake) throw new Error('Chrome hat die Datei nicht dekodiert.')
      const legacy = scoreChrome(writeModel, writeText, 'vi', legacyHeard, legacyTake)
      expect(legacy.rhythmBar, legacyUser).not.toBeNull()
      expect(legacy.words?.some((word) => word.melody != null && word.melody !== 'green'), legacyUser).toBe(true)
      for (const word of legacy.words ?? []) {
        if (!word.scorable) continue
        if (word.text === 'giúp') expect(word.rawRatio ?? 9, word.text).toBeLessThanOrEqual(1.45)
        else expect(word.rhythm, `${legacyUser} ${word.text}`).toBe('green')
      }
    },
    90_000,
  )
})

function readRequest(request: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)))
    request.on('end', () => resolve(Buffer.concat(chunks)))
    request.on('error', reject)
  })
}
