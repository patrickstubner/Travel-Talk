import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync as readBytes } from 'fs'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { rawCatalog } from '../../content'
import { splitWords } from '../../content/gloss'
import { alignmentFitsDuration, parseAlignment } from '../audio/align'
import { VOICES } from '../audio/voices'
import { allSpeechLines, voiceFile } from '../content/resolve'
import { analyzeModel, analyzeUser } from './analyze'
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
          }
          expectReversed(samples, words, line.lang, region, duration, file)
        }
        timed += 1
      }
    }
    expect(timed, only).toBeGreaterThan(0)
    for (const file of missing) expect(KNOWN_MISSING.has(file), file).toBe(true)
    expectOtherVoice(only)
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
    it.skipIf(!ready)(`decodes ${lang} and scores the melody`, () => checkLanguage(lang), 1_080_000)
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
})
