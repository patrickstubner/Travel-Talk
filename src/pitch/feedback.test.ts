import { describe, expect, it } from 'vitest'
import { contourFromSamples, dtwDistance, voicedValues, type Contour } from './contour'
import {
  DRONE_ENERGY,
  MELODY_GREEN,
  contentMismatch,
  barFromColours,
  droneAgainstSpeech,
  flatContour,
  matchesBetterBackwards,
  melodyBand,
  rhythmBand,
  scoreRepeat,
  starsFromBars,
  takeRunsBackwards,
  thin,
  toneSentence,
} from './feedback'

function flat(count: number, value: number | null): Contour {
  return Array.from({ length: count }, () => value)
}

function ramp(count: number, from: number, to: number): Contour {
  if (count <= 1) return [from]
  return Array.from({ length: count }, (_, index) => from + ((to - from) * index) / (count - 1))
}

function stretch(contour: Contour, factor: number): Contour {
  const out: Contour = []
  for (let index = 0; index < contour.length; index += 1) {
    const next = Math.round((index + 1) * factor)
    const prev = Math.round(index * factor)
    const copies = Math.max(1, next - prev)
    for (let copy = 0; copy < copies; copy += 1) out.push(contour[index] ?? null)
  }
  return out
}

function tone(startHz: number, endHz: number, seconds = 1.2): Float32Array {
  const sampleRate = 16000
  const length = Math.floor(sampleRate * seconds)
  const samples = new Float32Array(length)
  let phase = 0
  for (let index = 0; index < length; index += 1) {
    const hz = startHz + (endHz - startHz) * (index / length)
    phase += (2 * Math.PI * hz) / sampleRate
    samples[index] = Math.sin(phase) * 0.8
  }
  return samples
}

const three = [
  { text: 'qua', start: 0, end: 0.4 },
  { text: 'cần', start: 0.4, end: 0.8 },
  { text: 'nước', start: 0.8, end: 1.2 },
]

describe('scoring bands', () => {
  it('keeps the melody and rhythm edges from the concept', () => {
    expect(melodyBand(0)).toBe('green')
    expect(melodyBand(1.49)).toBe('green')
    expect(melodyBand(1.5)).toBe('yellow')
    expect(melodyBand(3)).toBe('yellow')
    expect(melodyBand(3.01)).toBe('red')
    expect(rhythmBand(0.7)).toBe('green')
    expect(rhythmBand(1)).toBe('green')
    expect(rhythmBand(1.4)).toBe('green')
    expect(rhythmBand(1.41)).toBe('yellow')
    expect(rhythmBand(1.8)).toBe('yellow')
    expect(rhythmBand(1.81)).toBe('red')
    expect(rhythmBand(0.5)).toBe('yellow')
    expect(rhythmBand(0.69)).toBe('yellow')
    expect(rhythmBand(0.49)).toBe('red')
  })

  it('builds the bars and the stars without a percentage', () => {
    expect(barFromColours(['green', 'green', 'red'])).toBe('teilweise')
    expect(barFromColours(['green', 'green', 'green'])).toBe('passt')
    expect(barFromColours(['red', 'red', 'green'])).toBe('daneben')
    expect(barFromColours(['yellow'])).toBe('teilweise')
    expect(barFromColours(['green'])).toBe('passt')
    expect(barFromColours(['green', 'yellow'])).toBe('passt')
    expect(barFromColours([null, 'green'])).toBe('passt')
    expect(starsFromBars('teilweise', 'passt')).toBe(2)
    expect(starsFromBars('passt', 'passt')).toBe(3)
    expect(starsFromBars('daneben', 'passt')).toBe(1)
    expect(starsFromBars('daneben', 'daneben')).toBe(1)
    expect(starsFromBars(null, 'passt')).toBe(0)
  })
})

describe('repeat alignment', () => {
  it('keeps the path and paints the same curve green with three stars', () => {
    const model = [...flat(40, -2), ...flat(40, 1.6), ...flat(40, 0)]
    const score = scoreRepeat({
      model,
      user: model,
      modelHop: 0.01,
      userHop: 0.01,
      words: three.map((word) => ({ ...word, text: 'qua' })),
      lang: 'vi',
      region: 'south',
      userDuration: 1.2,
    })
    expect(score.path.length).toBeGreaterThan(model.length - 5)
    expect(score.path[0]?.model).toBe(0)
    expect(score.path[score.path.length - 1]?.model).toBe(model.length - 1)
    expect(score.meanDistance ?? 1).toBeLessThan(0.05)
    const legacy = dtwDistance(voicedValues(model), voicedValues(model))
    expect(legacy ?? 1).toBeLessThan(0.05)
    expect(score.words?.every((word) => word.color === 'green')).toBe(true)
    expect(score.melodyBar).toBe('passt')
    expect(score.rhythmBar).toBe('passt')
    expect(score.stars).toBe(3)
    expect(score.words?.every((word) => word.sentence == null)).toBe(true)
  })

  it('calls a steady tone unclear, and stays green when the same rising shape sits higher', () => {
    const hop = 160 / 16000
    const words = [
      { text: 'qua', start: 0.2, end: 0.45 },
      { text: 'xin', start: 0.45, end: 0.7 },
      { text: 'nha', start: 0.7, end: 0.95 },
    ]
    const steady = scoreRepeat({
      model: contourFromSamples(tone(140, 280), 16000),
      user: contourFromSamples(tone(220, 220), 16000),
      modelHop: hop,
      userHop: hop,
      words,
      lang: 'vi',
      region: 'south',
      userDuration: 1.2,
    })
    expect(steady.tooLittleVoice).toBe(false)
    expect(steady.unclear).toBe(true)
    expect(steady.stars).toBe(0)
    expect(steady.words).toBeNull()
    const moving = scoreRepeat({
      model: contourFromSamples(tone(140, 240), 16000),
      user: contourFromSamples(tone(200, 343), 16000),
      modelHop: hop,
      userHop: hop,
      words,
      lang: 'vi',
      region: 'south',
      userDuration: 1.2,
    })
    expect(moving.unclear).toBe(false)
    expect(moving.meanDistance ?? 9).toBeLessThan(1.5)
    expect(moving.words?.every((word) => word.melody === 'green')).toBe(true)
    expect(moving.stars).toBe(3)
  })

  it('marks a uniform 0.7 stretch against the normal file, and not against the slow file', () => {
    const model = [...ramp(30, -1, 1), ...ramp(30, 1, -1), ...flat(30, 0)]
    const slow = stretch(model, 1 / 0.7)
    const factor = slow.length / model.length
    const fitted = [
      { text: 'qua', start: 0, end: 0.3 },
      { text: 'qua', start: 0.3, end: 0.6 },
      { text: 'qua', start: 0.6, end: 0.9 },
    ]
    const againstNormal = scoreRepeat({
      model,
      user: slow,
      modelHop: 0.01,
      userHop: 0.01,
      words: fitted,
      lang: 'de',
      region: 'south',
      userDuration: slow.length * 0.01,
    })
    expect(factor).toBeGreaterThan(1.4)
    expect(factor).toBeLessThan(1.8)
    expect(againstNormal.words?.every((word) => word.melody === 'green')).toBe(true)
    expect(againstNormal.words?.every((word) => word.color !== 'red')).toBe(true)
    expect(againstNormal.rhythmBar).not.toBe('passt')
    expect(againstNormal.melodyBar).toBe('passt')
    const heard = scoreRepeat({
      model: slow,
      user: slow,
      modelHop: 0.01,
      userHop: 0.01,
      words: fitted.map((word) => ({
        text: 'qua',
        start: word.start * factor,
        end: word.end * factor,
      })),
      lang: 'de',
      region: 'south',
      userDuration: slow.length * 0.01,
    })
    expect(heard.rhythmBar).toBe('passt')
    expect(heard.melodyBar).toBe('passt')
    expect(heard.stars).toBe(3)
  })

  it('finds the voice after a leading silence and still lines the words up', () => {
    const model = [...ramp(30, -2, 2), ...ramp(30, 2, -1)]
    const user = [...flat(25, null), ...model]
    const score = scoreRepeat({
      model,
      user,
      modelHop: 0.01,
      userHop: 0.01,
      words: [{ text: 'qua', start: 0, end: 0.6 }],
      lang: 'en',
      region: 'south',
      userDuration: 0.85,
    })
    expect(score.globalRatio ?? 0).toBeGreaterThan(0.9)
    expect(score.globalRatio ?? 9).toBeLessThan(1.15)
    expect(score.words?.[0]?.color).toBe('green')
    expect(score.path[0]?.user).toBeGreaterThanOrEqual(25)
  })

  it('paints only the mirrored syllable red and says you rose when the script falls', () => {
    const model = [...flat(40, 0), ...ramp(40, 4, -4), ...ramp(40, -2, 2)]
    const user = [...flat(40, 0), ...ramp(40, -4, 4), ...ramp(40, -2, 2)]
    const shared = {
      model,
      user,
      modelHop: 0.01,
      userHop: 0.01,
      words: three,
      userDuration: 1.2,
    }
    const vietnamese = scoreRepeat({ ...shared, lang: 'vi', region: 'south' })
    expect(vietnamese.words?.[0]?.color).toBe('green')
    expect(vietnamese.words?.[1]?.color).toBe('red')
    expect(vietnamese.words?.[2]?.color).toBe('green')
    expect(vietnamese.melodyBar).toBe('teilweise')
    expect(vietnamese.rhythmBar).toBe('passt')
    expect(vietnamese.stars).toBe(2)
    expect(vietnamese.words?.[0]?.sentence).toBeNull()
    expect(vietnamese.words?.[1]?.sentence).toEqual({ you: 'rising', should: 'falling', tone: 'huyen' })
    expect(vietnamese.words?.[2]?.sentence).toBeNull()
    expect(vietnamese.unclear).toBe(false)
    for (const lang of ['de', 'en', 'pt-BR'] as const) {
      const other = scoreRepeat({ ...shared, lang, region: 'south' })
      expect(other.words?.[1]?.color).toBe('red')
      expect(other.words?.every((word) => word.sentence == null)).toBe(true)
      expect(other.stars).toBe(2)
    }
  })

  it('does not mark hỏi against ngã in the south, and does not call a close curve red', () => {
    const model = [1.2, 1.0, 0.6, -0.8, -1.0, -0.2, 0.6, 1.0]
    const user = [-1.2, -1.0, -0.8, -0.4, 0, 0.4, 0.8, 1.2]
    const south = scoreRepeat({
      model,
      user,
      modelHop: 0.05,
      userHop: 0.05,
      words: [{ text: 'hỏi', start: 0, end: 0.4 }],
      lang: 'vi',
      region: 'south',
      userDuration: 0.4,
    })
    const north = scoreRepeat({
      model,
      user,
      modelHop: 0.05,
      userHop: 0.05,
      words: [{ text: 'hỏi', start: 0, end: 0.4 }],
      lang: 'vi',
      region: 'north',
      userDuration: 0.4,
    })
    expect(south.words?.[0]?.color).not.toBe('red')
    expect(south.words?.[0]?.sentence).toBeNull()
    expect(north.words?.[0]?.color).not.toBe('red')
    expect(north.words?.[0]?.sentence?.should).toBe('dipping')
    expect(toneSentence('ngã', 'dipping', 'vi', 'south')).toBeNull()
    expect(toneSentence('nặng', 'falling', 'vi', 'north')).toBeNull()
    expect(toneSentence('nặng', 'rising', 'vi', 'north')?.should).toBe('falling')
  })

  it('withholds stars for silence, noise, and a short take', () => {
    const silence = contourFromSamples(new Float32Array(16000), 16000)
    const quiet = scoreRepeat({
      model: flat(80, 0),
      user: silence,
      modelHop: 0.01,
      userHop: 160 / 16000,
      words: three,
      lang: 'vi',
      region: 'south',
      userDuration: 1,
    })
    expect(quiet.tooLittleVoice).toBe(true)
    expect(quiet.stars).toBe(0)
    expect(quiet.words).toBeNull()
    const noiseSamples = new Float32Array(16000)
    let seed = 17
    for (let index = 0; index < noiseSamples.length; index += 1) {
      seed = (seed * 16807) % 2147483647
      noiseSamples[index] = (seed / 2147483647 - 0.5) * 0.3
    }
    const noise = contourFromSamples(noiseSamples, 16000)
    const noisy = scoreRepeat({
      model: flat(80, 0),
      user: noise,
      modelHop: 0.01,
      userHop: 160 / 16000,
      words: three,
      lang: 'de',
      region: 'south',
      userDuration: 1,
    })
    expect(noisy.tooLittleVoice).toBe(true)
    expect(noisy.stars).toBe(0)
    const short = scoreRepeat({
      model: flat(40, 0),
      user: contourFromSamples(tone(220, 220, 0.2), 16000),
      modelHop: 0.01,
      userHop: 0.01,
      words: [{ text: 'qua', start: 0, end: 0.2 }],
      lang: 'en',
      region: 'south',
      userDuration: 0.2,
    })
    expect(short.tooShort).toBe(true)
    expect(short.stars).toBe(0)
    expect(short.words).toBeNull()
  })

  it('draws curves without colours when the timing file is missing or a different sentence is forced on', () => {
    const model = ramp(40, -1, 1)
    const missing = scoreRepeat({
      model,
      user: model,
      modelHop: 0.01,
      userHop: 0.01,
      words: null,
      lang: 'pt-BR',
      region: 'south',
      userDuration: 0.4,
    })
    expect(missing.words).toBeNull()
    expect(missing.stars).toBe(0)
    expect(missing.path.length).toBeGreaterThan(0)
    expect(missing.userOnModel.some((value) => value != null)).toBe(true)
    const apart = scoreRepeat({
      model: flat(30, -4),
      user: flat(30, 4),
      modelHop: 0.01,
      userHop: 0.01,
      words: [{ text: 'qua', start: 0, end: 0.3 }],
      lang: 'vi',
      region: 'south',
      userDuration: 0.3,
    })
    expect(apart.unclear).toBe(true)
    expect(apart.stars).toBe(0)
    expect(apart.words).toBeNull()
    expect(apart.meanDistance ?? 0).toBeGreaterThan(6)
  })

  it('keeps a monotonic linear path when the take is slower', () => {
    const model = [...ramp(20, -2, 2), ...ramp(20, 2, -1), ...flat(20, 0.5)]
    const user = stretch(model, 1.5)
    const score = scoreRepeat({
      model,
      user,
      modelHop: 0.01,
      userHop: 0.01,
      words: [{ text: 'qua', start: 0, end: 0.6 }],
      lang: 'en',
      region: 'south',
      userDuration: user.length * 0.01,
    })
    let lastModel = -1
    let lastUser = -1
    for (const point of score.path) {
      expect(point.model).toBeGreaterThanOrEqual(lastModel)
      expect(point.user).toBeGreaterThanOrEqual(lastUser)
      lastModel = point.model
      lastUser = point.user
    }
    expect(score.path[0]).toEqual({ model: 0, user: 0 })
    expect(score.path[score.path.length - 1]).toEqual({ model: model.length - 1, user: user.length - 1 })
    expect(score.meanDistance ?? 1).toBeLessThan(0.2)
  })

  it('withholds stars for a steady tone, a hum, a reversed take and a thin colouring', () => {
    const hop = 0.01
    const words = [
      { text: 'qua', start: 0.15, end: 0.4 },
      { text: 'xin', start: 0.4, end: 0.65 },
      { text: 'nha', start: 0.65, end: 0.9 },
    ]
    const steady = scoreRepeat({
      model: contourFromSamples(tone(140, 280), 16000),
      user: contourFromSamples(tone(220, 220), 16000),
      modelHop: hop,
      userHop: hop,
      words,
      lang: 'de',
      region: 'south',
      userDuration: 1.2,
    })
    expect(flatContour(steady.user, steady.model)).toBe(true)
    expect(steady.unclear).toBe(true)
    expect(steady.stars).toBe(0)
    expect(steady.words).toBeNull()
    const level = flat(40, 0.2)
    const shortPhrase = scoreRepeat({
      model: level,
      user: level,
      modelHop: hop,
      userHop: hop,
      words: [{ text: 'Bitte.', start: 0, end: 0.4 }],
      lang: 'de',
      region: 'south',
      userDuration: 0.4,
    })
    expect(flatContour(level, level)).toBe(false)
    expect(shortPhrase.unclear).toBe(false)
    expect(shortPhrase.stars).toBe(3)
    const humSamples = new Float32Array(16000 * 1.2)
    for (let index = 0; index < humSamples.length; index += 1) {
      const time = index / 16000
      humSamples[index] = (Math.sin(2 * Math.PI * 50 * time) + Math.sin(2 * Math.PI * 100 * time) + Math.sin(2 * Math.PI * 150 * time)) * 0.25
    }
    const hum = scoreRepeat({
      model: contourFromSamples(tone(140, 280), 16000),
      user: contourFromSamples(humSamples, 16000),
      modelHop: hop,
      userHop: hop,
      words,
      lang: 'en',
      region: 'south',
      userDuration: 1.2,
    })
    expect(hum.stars).toBe(0)
    expect(hum.words == null || hum.words.every((word) => word.color !== 'green' || hum.unclear)).toBe(true)
    const rising = tone(140, 280)
    const reversed = Float32Array.from(rising).reverse()
    const backwards = scoreRepeat({
      model: contourFromSamples(rising, 16000),
      user: contourFromSamples(reversed, 16000),
      modelHop: hop,
      userHop: hop,
      words,
      lang: 'pt-BR',
      region: 'south',
      userDuration: 1.2,
    })
    expect(backwards.stars).not.toBe(3)
    expect(backwards.words?.every((word) => word.color === 'green') ?? false).toBe(false)
    const piece = ramp(20, -2, 2)
    const gap = flat(20, null)
    const partial = [...piece, ...piece, ...gap, ...gap, ...gap]
    const sparse = scoreRepeat({
      model: partial,
      user: partial,
      modelHop: hop,
      userHop: hop,
      words: [0, 1, 2, 3, 4].map((index) => ({ text: 'qua', start: index * 0.2, end: (index + 1) * 0.2 })),
      lang: 'de',
      region: 'south',
      userDuration: 1,
    })
    expect(sparse.words?.filter((word) => word.scorable)).toHaveLength(2)
    expect(sparse.words?.filter((word) => word.color != null)).toHaveLength(2)
    expect(sparse.fewWords).toBe(false)
    expect(sparse.melodyBar).toBe('passt')
    expect(sparse.stars).toBe(3)
    const full = [...piece, ...piece, ...piece, ...piece, ...piece]
    const thinUser = full.map((value, index) => (index < 40 || index % 5 === 0 ? value : null))
    const held = scoreRepeat({
      model: full,
      user: thinUser,
      modelHop: hop,
      userHop: hop,
      words: [0, 1, 2, 3, 4].map((index) => ({ text: 'qua', start: index * 0.2, end: (index + 1) * 0.2 })),
      lang: 'de',
      region: 'south',
      userDuration: 1,
    })
    expect(held.words?.filter((word) => word.scorable)).toHaveLength(5)
    expect(held.words?.filter((word) => word.color != null).length ?? 5).toBeLessThan(3)
    expect(held.stars).toBe(0)
    expect(held.fewWords).toBe(true)
    expect(held.melodyBar).toBeNull()
    expect(held.rhythmBar).toBeNull()
    const enough = [...piece, ...piece, ...piece, ...gap, ...gap]
    const covered = scoreRepeat({
      model: enough,
      user: enough,
      modelHop: hop,
      userHop: hop,
      words: [0, 1, 2, 3, 4].map((index) => ({ text: 'qua', start: index * 0.2, end: (index + 1) * 0.2 })),
      lang: 'de',
      region: 'south',
      userDuration: 1,
    })
    expect(covered.words?.filter((word) => word.color != null)).toHaveLength(3)
    expect(covered.stars).toBe(3)
  })

  it('keeps a uniform 0.7 recording green on the words and off a perfect rhythm bar', () => {
    const samples = tone(150, 260, 1.2)
    const factor = 1 / 0.7
    const slow = new Float32Array(Math.floor(samples.length * factor))
    for (let index = 0; index < slow.length; index += 1) {
      const source = index / factor
      const left = Math.floor(source)
      const frac = source - left
      const a = samples[Math.min(left, samples.length - 1)] ?? 0
      const b = samples[Math.min(left + 1, samples.length - 1)] ?? a
      slow[index] = a + (b - a) * frac
    }
    const model = contourFromSamples(samples, 16000)
    const user = contourFromSamples(slow, 16000)
    const score = scoreRepeat({
      model,
      user,
      modelHop: 0.01,
      userHop: 0.01,
      words: [
        { text: 'qua', start: 0.15, end: 0.4 },
        { text: 'qua', start: 0.4, end: 0.65 },
        { text: 'qua', start: 0.65, end: 0.9 },
      ],
      lang: 'de',
      region: 'south',
      userDuration: slow.length / 16000,
    })
    expect(score.unclear).toBe(false)
    expect(score.words?.every((word) => word.melody === 'green')).toBe(true)
    expect(score.words?.some((word) => word.color === 'red')).toBe(false)
    expect(score.rhythmBar).not.toBe('passt')
    expect(score.stars).not.toBe(1)
    expect(score.stars).toBe(2)
  })

  it('thins a long contour before the score uses it', () => {
    const long = ramp(1600, -3, 3)
    const thinned = thin(long, 0.01)
    expect(thinned.contour.length).toBeLessThanOrEqual(800)
    expect(thinned.contour.length).toBeGreaterThan(100)
    expect(thinned.hop).toBeGreaterThan(0.01)
    const score = scoreRepeat({
      model: long,
      user: long,
      modelHop: 0.01,
      userHop: 0.01,
      words: [{ text: 'qua', start: 0, end: 1 }],
      lang: 'de',
      region: 'south',
      userDuration: 16,
    })
    expect(score.model.length).toBeLessThanOrEqual(800)
    expect(score.user.length).toBeLessThanOrEqual(800)
    expect(score.modelHop).toBeGreaterThan(0.01)
  })

  it('refuses a local stretch of 0.6 or 1.6', () => {
    const scoreAt = (scale: number) => {
      const count = 80
      const user: Contour = Array.from({ length: count }, (_, index) => ((index % 7) - 3) * 2.5)
      const model = user.map((_, index) => user[Math.min(count - 1, Math.max(0, Math.round(index * scale)))] ?? null)
      return scoreRepeat({
        model,
        user,
        modelHop: 0.01,
        userHop: 0.01,
        words: [{ text: 'qua', start: 0, end: 0.8 }],
        lang: 'de',
        region: 'south',
        userDuration: 0.8,
      })
    }
    const compressed = scoreAt(0.6)
    const expanded = scoreAt(1.6)
    expect(compressed.unclear).toBe(false)
    expect(expanded.unclear).toBe(false)
    expect(compressed.words?.[0]?.melody).toBe('red')
    expect(expanded.words?.[0]?.melody).toBe('red')
  })

  it('calls a take flat only when the reference moves by about another semitone', () => {
    const oneSemi = ramp(40, -0.5, 0.5)
    const moving = ramp(40, -2, 2)
    const atEdge = ramp(40, -0.6, 0.6)
    expect(flatContour(oneSemi, moving)).toBe(true)
    expect(flatContour(oneSemi, oneSemi)).toBe(false)
    expect(flatContour(atEdge, moving)).toBe(false)
  })

  it('colours a word when a bit more than half of the model frames are voiced in the take', () => {
    const model = flat(20, 0.4)
    const user = model.map((value, index) => (index % 5 < 3 ? value : null))
    const score = scoreRepeat({
      model,
      user,
      modelHop: 0.01,
      userHop: 0.01,
      words: [{ text: 'Bitte.', start: 0, end: 0.2 }],
      lang: 'de',
      region: 'south',
      userDuration: 0.4,
    })
    expect(score.words?.[0]?.color).not.toBeNull()
  })

  it('withholds stars when a steady tone meets a spoken envelope, and keeps a flat phrase against itself', () => {
    const level = flat(80, 0.2)
    const speech: number[] = []
    for (let index = 0; index < 80; index += 1) speech.push(index < 18 ? 0.05 : index < 42 ? 0.5 : 0.08)
    const toneEnergy = speech.map(() => 0.2)
    const shared = {
      model: level,
      user: level,
      modelHop: 0.01,
      userHop: 0.01,
      words: [
        { text: 'Bitte.', start: 0, end: 0.4 },
        { text: 'Danke.', start: 0.4, end: 0.8 },
      ],
      lang: 'de' as const,
      region: 'south' as const,
      userDuration: 0.8,
    }
    const drone = scoreRepeat({ ...shared, modelEnergy: speech, userEnergy: toneEnergy })
    expect(drone.unclear).toBe(true)
    expect(drone.stars).toBe(0)
    const reversed = scoreRepeat({ ...shared, modelEnergy: speech, userEnergy: [...speech].reverse() })
    expect(reversed.unclear).toBe(true)
    expect(reversed.stars).toBe(0)
    const itself = scoreRepeat({ ...shared, modelEnergy: speech, userEnergy: speech })
    expect(itself.unclear).toBe(false)
    expect(itself.stars).toBe(3)
  })

  it('calls a reversed contour unclear and keeps the same contour', () => {
    const rising = ramp(60, -3, 3)
    const falling = ramp(60, 3, -3)
    const words = [{ text: 'qua', start: 0, end: 0.6 }]
    const reversed = scoreRepeat({
      model: rising,
      user: falling,
      modelHop: 0.01,
      userHop: 0.01,
      words,
      lang: 'vi',
      region: 'south',
      userDuration: 0.6,
    })
    expect(matchesBetterBackwards(rising, falling, null)).toBe(true)
    expect(reversed.unclear).toBe(true)
    expect(reversed.stars).toBe(0)
    const same = scoreRepeat({
      model: rising,
      user: rising,
      modelHop: 0.01,
      userHop: 0.01,
      words,
      lang: 'vi',
      region: 'south',
      userDuration: 0.6,
    })
    expect(same.unclear).toBe(false)
    expect(same.stars).toBe(3)
  })

  it('calls the take unclear when every word runs the other way', () => {
    const model = [...ramp(30, -1, 2), ...ramp(30, -2.5, 0.5), ...ramp(30, 0, 2.4)]
    const user = [...ramp(30, 1.5, -1.2), ...ramp(30, 0.4, -2), ...ramp(30, 2.2, -0.4)]
    const words = [0, 1, 2].map((index) => ({ text: 'qua', start: index * 0.3, end: (index + 1) * 0.3 }))
    const opposed = scoreRepeat({
      model,
      user,
      modelHop: 0.01,
      userHop: 0.01,
      words,
      lang: 'de',
      region: 'south',
      userDuration: 0.9,
    })
    expect(matchesBetterBackwards(model, user, null)).toBe(false)
    expect(takeRunsBackwards(['opposed', 'opposed', 'opposed'])).toBe(true)
    expect(takeRunsBackwards(['opposed', 'same', 'opposed'])).toBe(false)
    expect(takeRunsBackwards(['unknown'])).toBe(false)
    expect(opposed.unclear).toBe(true)
    expect(opposed.stars).toBe(0)
    const last = [...user.slice(0, 60), ...model.slice(60)]
    const partial = scoreRepeat({
      model,
      user: last,
      modelHop: 0.01,
      userHop: 0.01,
      words,
      lang: 'de',
      region: 'south',
      userDuration: 0.9,
    })
    expect(partial.unclear).toBe(false)
  })

  it('drops a close word from green to yellow when the direction only partly agrees', () => {
    const count = 32
    const model = Array.from({ length: count }, (_, index) => Math.sin((2 * Math.PI * index) / 8))
    const user = Array.from({ length: count }, (_, index) => Math.sin((2 * Math.PI * index) / 8 + 1.5))
    const score = scoreRepeat({
      model,
      user,
      modelHop: 0.01,
      userHop: 0.01,
      words: [{ text: 'qua', start: 0, end: 0.32 }],
      lang: 'de',
      region: 'south',
      userDuration: 0.4,
    })
    expect(score.words?.[0]?.melodyDistance ?? 9).toBeLessThan(MELODY_GREEN)
    expect(score.words?.[0]?.melody).toBe('yellow')
  })

  it('treats a slightly moving tone as a drone until the loudness variation passes 0.12', () => {
    expect(DRONE_ENERGY).toBe(0.12)
    const level = flat(40, 0.1)
    const speech = Array.from({ length: 40 }, (_, index) => (index % 2 === 0 ? 0.2 : 0.9))
    const mild = Array.from({ length: 40 }, (_, index) => (index % 2 === 0 ? 1 : 1.173913))
    expect(droneAgainstSpeech(mild, speech)).toBe(true)
    const tone = scoreRepeat({
      model: level,
      user: level,
      modelHop: 0.01,
      userHop: 0.01,
      words: [{ text: 'Bitte.', start: 0, end: 0.4 }],
      lang: 'de',
      region: 'south',
      userDuration: 0.4,
      modelEnergy: speech,
      userEnergy: mild,
    })
    expect(tone.unclear).toBe(true)
    expect(tone.stars).toBe(0)
    const lively = Array.from({ length: 40 }, (_, index) => (index % 2 === 0 ? 1 : 1.5))
    expect(droneAgainstSpeech(lively, speech)).toBe(false)
  })

  it('withholds stars when most moving words do not follow the melody', () => {
    const wave = (phase: number) => Array.from({ length: 32 }, (_, index) => Math.sin((2 * Math.PI * index) / 8 + phase))
    const model = [...wave(0), ...wave(0), ...wave(0)]
    const user = [...wave(1.5), ...wave(1.5), ...wave(0)]
    const score = scoreRepeat({
      model,
      user,
      modelHop: 0.01,
      userHop: 0.01,
      words: [0, 1, 2].map((index) => ({ text: 'qua', start: index * 0.32, end: (index + 1) * 0.32 })),
      lang: 'de',
      region: 'south',
      userDuration: 1,
    })
    expect(score.unclear).toBe(false)
    expect(score.words?.[0]?.melody).toBe('yellow')
    expect(score.words?.[2]?.melody).toBe('green')
    expect(score.stars).toBe(0)
  })

  it('calls a hum unclear when the band shape does not move with the file', () => {
    const speech = Array.from({ length: 48 }, (_, index) => Array.from({ length: 12 }, (_, band) => ((index + band) % 5 === 0 ? 6 : -4)))
    const hum = Array.from({ length: 48 }, () => new Array<number>(12).fill(0.2))
    expect(contentMismatch(speech, hum, 'de')).toBe(true)
    expect(contentMismatch(speech, speech, 'de')).toBe(false)
    const contour = ramp(48, -1, 2)
    const score = scoreRepeat({
      model: contour,
      user: contour,
      modelHop: 0.01,
      userHop: 0.01,
      words: [{ text: 'qua', start: 0, end: 0.48 }],
      lang: 'de',
      region: 'south',
      userDuration: 0.6,
      modelBands: speech,
      userBands: hum,
    })
    expect(score.unclear).toBe(true)
    expect(score.stars).toBe(0)
    expect(score.melodyBar).toBeNull()
  })
})
