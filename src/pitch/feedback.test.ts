import { describe, expect, it } from 'vitest'
import { contourFromSamples, dtwDistance, voicedValues, type Contour } from './contour'
import { alignContours, barFromColours, melodyBand, rhythmBand, scoreRepeat, starsFromBars, toneSentence } from './feedback'

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
    const model = [...flat(40, 0), ...ramp(40, 0.2, -0.2), ...flat(40, 0.1)]
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

  it('stays green when the whole voice is shifted in hertz', () => {
    const low = contourFromSamples(tone(160, 160), 16000)
    const high = contourFromSamples(tone(280, 280), 16000)
    const hop = 160 / 16000
    const score = scoreRepeat({
      model: low,
      user: high,
      modelHop: hop,
      userHop: hop,
      words: [
        { text: 'qua', start: 0.2, end: 0.5 },
        { text: 'xin', start: 0.5, end: 0.8 },
        { text: 'nha', start: 0.8, end: 1.1 },
      ],
      lang: 'vi',
      region: 'south',
      userDuration: 1.2,
    })
    expect(score.tooLittleVoice).toBe(false)
    expect(score.meanDistance ?? 9).toBeLessThan(1.5)
    expect(score.words?.every((word) => word.melody === 'green')).toBe(true)
    expect(score.stars).toBe(3)
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
    const model = flat(60, 0)
    const user = [...flat(25, null), ...flat(60, 0)]
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

  it('keeps a monotonic path when the take is slower', () => {
    const model = [...ramp(20, -2, 2), ...ramp(20, 2, -1), ...flat(20, 0)]
    const user = stretch(model, 1.5)
    const aligned = alignContours(model, user)
    expect(aligned).not.toBeNull()
    let lastModel = -1
    let lastUser = -1
    for (const point of aligned?.path ?? []) {
      expect(point.model).toBeGreaterThanOrEqual(lastModel)
      expect(point.user).toBeGreaterThanOrEqual(lastUser)
      lastModel = point.model
      lastUser = point.user
    }
    expect(aligned?.path[0]).toEqual({ model: 0, user: 0 })
    expect(aligned?.path[aligned.path.length - 1]).toEqual({ model: model.length - 1, user: user.length - 1 })
    expect(aligned?.mean ?? 1).toBeLessThan(0.05)
  })
})
