/**
 * Half B, Portuguese, after Opus. Not part of CI.
 * Correct takes, a different sentence, and reversed speech.
 * Run: npx tsx tools/measure-pt-half-b.ts
 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createServer } from 'node:http'
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from '@playwright/test'
import { rawCatalog } from '../content/index'
import { splitWords } from '../content/gloss'
import { parseAlignment } from '../src/audio/align'
import { VOICES } from '../src/audio/voices'
import { allSpeechLines, voiceFile } from '../src/content/resolve'
import { analyzeModel, analyzeUser } from '../src/pitch/analyze'
import { scoreRepeat, starsFromVerdict, type RepeatScore } from '../src/pitch/feedback'
import { foldSpeech, portugueseContentRate } from '../src/speech/text-match'

type Row = {
  voice: string
  gender: 'male' | 'female'
  text: string
  file: string
  audio: string
  words: number
  samples: Float32Array
  model: ReturnType<typeof analyzeModel>
  align: { text: string; start: number; end: number }[] | null
}

type Heard = { text: string; confidence: number | null }

const RATE = 16000

function pcm(raw: Uint8Array): Float32Array {
  const bytes = Uint8Array.from(raw)
  return new Float32Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 4))
}

function decode(path: string): Float32Array {
  return pcm(
    execFileSync('ffmpeg', ['-v', 'error', '-i', path, '-ac', '1', '-ar', String(RATE), '-f', 'f32le', 'pipe:1'], {
      maxBuffer: 16 * 1024 * 1024,
    }),
  )
}

function throughOpus(samples: Float32Array): Float32Array {
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
    header.writeUInt32LE(RATE, 24)
    header.writeUInt32LE(RATE * 4, 28)
    header.writeUInt16LE(4, 32)
    header.writeUInt16LE(32, 34)
    header.write('data', 36)
    header.writeUInt32LE(data.length, 40)
    writeFileSync(wav, Buffer.concat([header, data]) as unknown as string)
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', wav, '-c:a', 'libopus', '-b:a', '32k', '-application', 'voip', webm])
    return decode(webm)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

function halfB(file: string): boolean {
  const byte = createHash('sha1').update(file).digest()[0] ?? 0
  return byte % 2 === 1
}

function loadRows(only: readonly string[]): Row[] {
  const voices = VOICES.filter((voice) => voice.bundled && voice.lang === 'pt-BR')
  const lines = allSpeechLines(rawCatalog.concepts).filter((line) => {
    if (line.lang !== 'pt-BR' || !halfB(line.file)) return false
    return only.length === 0 || only.some((part) => line.text.includes(part))
  })
  const rows: Row[] = []
  for (const voice of voices) {
    for (const line of lines) {
      const audio = `public/audio/${voiceFile(line.file, voice.id, voice.legacy)}`
      const alignPath = `public/audio/${voiceFile(line.file, 'cadu', false)}`.replace(/\.m4a$/, '.align.json')
      if (!existsSync(audio) || !existsSync(alignPath)) continue
      const texts = splitWords(line.text)
      const times = parseAlignment(JSON.parse(readFileSync(alignPath, 'utf8')), texts.length)
      const samples = decode(audio)
      const words = (times ?? []).map((word, index) => ({ ...word, text: texts[index] ?? '' }))
      rows.push({
        voice: voice.id,
        gender: voice.gender,
        text: line.text,
        file: line.file,
        audio,
        words: foldSpeech(line.text).split(' ').filter(Boolean).length,
        samples,
        model: analyzeModel(samples, RATE),
        align: words,
      })
    }
  }
  return rows
}

function scoreTake(row: Row, userSamples: Float32Array): RepeatScore {
  const user = analyzeUser(userSamples, RATE, row.model.bands)
  return scoreRepeat({
    model: row.model.contour,
    user: user.contour,
    modelHop: 0.01,
    userHop: 0.01,
    words: row.align,
    lang: 'pt-BR',
    region: row.file.includes('__north__') ? 'north' : 'south',
    userDuration: userSamples.length / RATE,
    modelEnergy: row.model.energy,
    userEnergy: user.energy,
    modelBands: row.model.bands,
    userBands: user.bands,
    userPlainBands: user.plainBands,
    modelSpeechBands: row.model.speechBands,
    userSpeechBands: user.speechBands,
  })
}

function packSamples(samples: Float32Array): string {
  return Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength).toString('base64')
}

function starsOf(row: Row, scored: RepeatScore, heard: Heard | null): number | null {
  if (!scored.verdict) return null
  const wer = heard ? portugueseContentRate(row.text, heard.text, heard.confidence) : null
  return starsFromVerdict(
    scored.verdict,
    scored.melodyBar,
    scored.rhythmBar,
    scored.sentenceCheck?.backwards ?? false,
    'pt-BR',
    { template: row.gender, user: row.gender },
    { modelHz: row.model.medianHz, userHz: null },
    { bands: scored.sentenceCheck?.bands, prosody: scored.melodyFit, wer },
  )
}

const pageSource = `<!doctype html><meta charset="utf-8"><script>
let worker
let ready
const waiters = new Map()
function start(buffer) {
  worker = new Worker('/vosk-worker.js')
  ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('load-timeout')), 90000)
    worker.onmessage = (event) => {
      const message = event.data
      if (!message) return
      if (message.event === 'load') {
        clearTimeout(timer)
        if (message.result) resolve(true)
        else reject(new Error('load'))
        return
      }
      if (message.event === 'error' && !message.recognizerId) {
        clearTimeout(timer)
        reject(new Error(message.error || 'worker'))
        return
      }
      const waiter = message.recognizerId ? waiters.get(message.recognizerId) : null
      if (waiter) waiter(message)
    }
    worker.onerror = () => reject(new Error('worker-error'))
    worker.postMessage({ action: 'load', modelUrl: location.origin + '/model.tar.gz', modelBytes: buffer }, [buffer])
  })
  return ready
}
function hear(samples, sampleRate, grammar) {
  const recognizerId = crypto.randomUUID()
  return ready.then(() => new Promise((resolve) => {
    let text = ''
    let confidence = null
    let finalRequested = false
    let quiet = 0
    const finish = (value) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      clearTimeout(quiet)
      waiters.delete(recognizerId)
      worker.postMessage({ action: 'remove', recognizerId })
      resolve(value)
    }
    let settled = false
    const arm = () => {
      clearTimeout(quiet)
      quiet = setTimeout(() => finish({ text, confidence }), 800)
    }
    const timer = setTimeout(() => finish(null), 20000)
    const floatsFromBase64 = (value) => {
      const binary = atob(value)
      const bytes = new Uint8Array(binary.length)
      for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
      return new Float32Array(bytes.buffer)
    }
    waiters.set(recognizerId, (message) => {
      if (message.event === 'error') {
        finish(null)
        return
      }
      if (message.event !== 'result') return
      const next = message.result && message.result.text ? message.result.text : ''
      if (next) text = next
      const words = message.result && message.result.result
      if (words && words.length) {
        let sum = 0
        let count = 0
        for (const word of words) {
          if (typeof word.conf === 'number') { sum += word.conf; count += 1 }
        }
        if (count) confidence = sum / count
      }
      if (finalRequested) arm()
    })
    worker.postMessage({ action: 'create', recognizerId, sampleRate, grammar: grammar || undefined })
    worker.postMessage({ action: 'set', recognizerId, key: 'words', value: true })
    const pcm = samples instanceof Float32Array ? samples : floatsFromBase64(samples)
    const data = Float32Array.from(pcm, (value) => value * 32768)
    const width = 4800
    for (let index = 0; index < data.length; index += width) {
      const chunk = data.slice(index, index + width)
      worker.postMessage({ action: 'audioChunk', recognizerId, data: chunk, sampleRate }, [chunk.buffer])
    }
    finalRequested = true
    worker.postMessage({ action: 'retrieveFinalResult', recognizerId })
  }))
}
window.start = start
window.hear = hear
</script>`

async function main(): Promise<void> {
  writeFileSync('.cache/pt-half-b.jsonl', '')
  console.error('loading clips')
  const limit = Number(process.env.LIMIT || 0)
  const only = (process.env.ONLY ?? '').split('|').filter(Boolean)
  const loaded = loadRows(only)
  const rows = limit > 0 ? loaded.slice(0, limit) : loaded
  console.error('rows', rows.length, 'of', loaded.length)
  const opus = new Map<string, Float32Array>()
  const coded = (key: string, samples: Float32Array) => {
    const hit = opus.get(key)
    if (hit) return hit
    const next = throughOpus(samples)
    opus.set(key, next)
    return next
  }
  const server = createServer((request, response) => {
    const url = request.url ?? '/'
    if (url === '/') {
      response.writeHead(200, { 'content-type': 'text/html' })
      response.end(pageSource)
      return
    }
    if (url === '/vosk-worker.js') {
      response.writeHead(200, { 'content-type': 'text/javascript' })
      response.end(readFileSync('public/vosk-worker.js'))
      return
    }
    if (url === '/model.tar.gz') {
      response.writeHead(200, { 'content-type': 'application/gzip' })
      response.end(readFileSync('public/models/vosk-model-small-pt-0.3.tar.gz'))
      return
    }
    response.writeHead(404)
    response.end()
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('PORT')
  const browser = await chromium.launch()
  const page = await browser.newPage()
  page.on('pageerror', (error) => console.error('page', error.message))
  await page.goto(`http://127.0.0.1:${address.port}/`)
  console.error('loading model')
  await page.evaluate(async () => {
    const response = await fetch('/model.tar.gz')
    const buffer = await response.arrayBuffer()
    await window.start(buffer)
  })
  console.error('model ready')
  const buckets = {
    correct: { judged: 0, low: 0, shortJudged: 0, shortLow: 0 },
    different: { judged: 0, low: 0 },
    reversed: { judged: 0, low: 0 },
  }
  const examples: string[] = []
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    if (!row) continue
    const next = rows.slice(index + 1).find((item) => item.voice === row.voice && item.text !== row.text) ?? rows.find((item) => item.voice === row.voice && item.text !== row.text)
    const reversed = Float32Array.from(row.samples)
    reversed.reverse()
    const jobs: Array<['correct' | 'different' | 'reversed', Float32Array]> = [
      ['correct', coded(`c:${row.audio}`, row.samples)],
      ['reversed', coded(`r:${row.audio}`, reversed)],
    ]
    if (next) jobs.push(['different', coded(`c:${next.audio}`, next.samples)])
    for (const [kind, samples] of jobs) {
      const grammar = null
      const heard = (await page.evaluate(
        async ([encoded, grammarText]) => window.hear(encoded, 16000, grammarText),
        [packSamples(samples), grammar] as const,
      )) as Heard | null
      const scored = scoreTake(row, samples)
      const stars = starsOf(row, scored, heard)
      appendFileSync(
        '.cache/pt-half-b.jsonl',
        `${JSON.stringify({
          kind,
          voice: row.voice,
          text: row.text,
          words: row.words,
          heard: heard?.text ?? null,
          confidence: heard?.confidence ?? null,
          stars,
          verdict: scored.verdict,
          melody: scored.melodyBar,
          rhythm: scored.rhythmBar,
          backwards: scored.sentenceCheck?.backwards ?? false,
          bands: scored.sentenceCheck?.bands ?? null,
          prosody: scored.melodyFit ?? null,
          gender: row.gender,
          modelHz: row.model.medianHz,
        })}\n`,
      )
      if (stars == null) continue
      const bucket = buckets[kind]
      bucket.judged += 1
      if (stars <= 1) bucket.low += 1
      if (kind === 'correct' && row.words >= 1 && row.words <= 4) {
        buckets.correct.shortJudged += 1
        if (stars <= 1) buckets.correct.shortLow += 1
      }
      const missed =
        (kind === 'correct' && stars <= 1) || (kind !== 'correct' && stars > 1)
      if (missed && examples.length < 200) {
        examples.push(`${kind} ${stars} heard=${heard?.text ?? '—'} conf=${heard?.confidence ?? '—'} | ${row.text} | ${row.voice} words=${row.words}`)
        console.error(examples[examples.length - 1])
      }
    }
    if ((index + 1) % 10 === 0) console.error(index + 1, JSON.stringify(buckets))
  }
  console.error(JSON.stringify({ buckets, examples }, null, 2))
  await browser.close()
  server.close()
}

declare global {
  interface Window {
    start: (buffer: ArrayBuffer) => Promise<unknown>
    hear: (samples: string, sampleRate: number, grammar: string | null) => Promise<Heard | null>
  }
}

mkdirSync('.cache', { recursive: true })
main().catch((error) => {
  console.error(error)
  process.exit(1)
})
