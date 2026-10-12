import type { Lang } from '../../content/phrase'
import { centerSlackFrames, describeShape, voicedValues, type Contour, type ShapeName } from './contour'
import { bandDistance } from './spectrum'

/**
 * Bands for the first version. They are a starting point set by the author,
 * not a learner study. The fixtures in feedback.test.ts are what they have
 * to survive. A mean path distance above UNCLEAR_SEMITONES stays on the
 * curve as a colour. It no longer drops the words. That cutoff is a choice.
 *
 * Rhythm colour of a word is that word's duration against the file,
 * divided by the tempo of the whole take, times the local scale. A take
 * that is only slower still has the file's proportions, so the words stay
 * green. The rhythm bar is the worse of that word bar and the band of the
 * whole-span ratio, so a uniform 0.7 take is not a perfect bar. The local
 * search (about 0.75–1.33) is part of the word ratio: without it a word
 * that moved against the rest looks like the global tempo. Comparison is
 * against the file that was heard.
 *
 * A take is «unklar» when its voiced range stays under FLAT_RANGE and the
 * reference moves by at least that much more, and the take is not itself
 * speech-loud. A short flat phrase matched to itself is not unklar. A take
 * is also «unklar» when every measured word runs the other way (Pearson
 * under DIRECTION_OPPOSED) and none of those words has a colour. One
 * mirrored syllable stays a partial score. When a band shape was measured,
 * the take is «unklar» when the file fits better backwards by
 * REVERSE_BAND_GAP. That gap sits between a reversed clip and another
 * voice of the same sentence, so the other voice keeps its colours.
 * Without bands, a contour that matches better backwards is still
 * «unklar». A steady tone against a spoken file is «unklar» when the
 * file's loudness moves and the tone's pitch does not. A large pitch
 * offset and a loudness envelope that runs the other way do not hide the
 * bars. This release does not hint that the sentence was a different one.
 * «unklar» is set only when the bars are absent. A model file
 * with fewer than MIN_VOICED frames says the file is thin, not that the
 * take was quiet. The old 1–3 grade is in sentence-grade.ts, which the
 * app does not import. Bars stay when at least one word has a colour.
 * Under COLOURED_SHARE the words still show, the bars cover the coloured
 * part, and the page says so. The timed span ends on the last run of at
 * least three frames that rises above the loudness floor. A near-silent
 * tail, or one or two leftover frames, would stretch the map and drop
 * later words into the gaps. A word whose model moves by MOVING_RANGE
 * needs that movement in the same direction, otherwise it stays at most
 * yellow. Local stretch stays inside about 0.75–1.33. When the local
 * window misses every word but the model word has enough voice, the
 * whole-path distance still colours those words. A second voice often
 * sits outside the four-frame window.
 */
export const MELODY_GREEN = 1.5
export const MELODY_YELLOW = 3
export const RHYTHM_GREEN_MIN = 0.7
export const RHYTHM_GREEN_MAX = 1.4
export const RHYTHM_YELLOW_MIN = 0.5
export const RHYTHM_YELLOW_MAX = 1.8
export const UNCLEAR_SEMITONES = 6
export const SHORT_SECONDS = 0.3
export const MIN_VOICED = 5
export const MIN_WORD_VOICED = 3
export const FLAT_RANGE = 1.2
export const COLOURED_SHARE = 0.6
export const VOICE_COVERAGE = 0.5
/** A word below this correlation does not stay green. */
export const DIRECTION_MIN = 0.3
/** Below this, a word runs the other way. Every such word makes the take «unklar». */
export const DIRECTION_OPPOSED = -0.15
/** Loudness of a drone barely moves. Speech does. */
export const DRONE_ENERGY = 0.12
export const SPEECH_ENERGY = 0.15
/** A negative loudness correlation means the envelope runs the other way. */
export const ENERGY_ALIGN_MIN = 0
/**
 * Band-distance gap that means the take is the file played backwards.
 * Reversed clips sit above 0.26. Another bundled voice of the same sentence
 * stays under 0.05. 0.12 is the space between those two.
 */
export const REVERSE_BAND_GAP = 0.12
/** A model word that moves by this much needs the same movement in the take. */
export const MOVING_RANGE = 1
/**
 * DTW cost after per-coefficient mean and variance normalisation, and
 * after a frequency warp of about ±20 %. Chosen on every fourth timed
 * line: the same sentence by another bundled voice is the positive, a
 * different sentence is the negative, and the full clip run is the check.
 * German still separates the two. English, Portuguese and Vietnamese do
 * not, so there the limit only keeps hum, a tone, reversed audio and
 * background speech from filling the bars. It does not decide the sentence.
 */
export const SPECTRAL_DISTANCE_MAX: Record<Lang, number> = {
  de: 0.5,
  en: 0.5,
  'pt-BR': 0.5,
  vi: 0.44,
}
const MAX_FRAMES = 800

export type Band = 'green' | 'yellow' | 'red'
export type BarState = 'passt' | 'teilweise' | 'daneben'
export type ToneId = 'ngang' | 'huyen' | 'sac' | 'hoi' | 'nga' | 'nang'
export type ToneShape = 'level' | 'rising' | 'falling' | 'dipping'

export type ToneSentence = {
  you: ToneShape
  should: ToneShape
  tone: ToneId
}

export type FeedbackWord = {
  text: string
  start: number
  end: number
  color: Band | null
  melody: Band | null
  rhythm: Band | null
  melodyDistance: number | null
  rawRatio: number | null
  userStart: number
  userEnd: number
  modelFrame: number
  modelFrameEnd: number
  userFrame: number
  userFrameEnd: number
  tone: ToneId | null
  userShape: ShapeName
  sentence: ToneSentence | null
  scorable: boolean
}

export type PathPoint = { model: number; user: number }

export type RepeatScore = {
  model: Contour
  user: Contour
  userOnModel: Contour
  modelHop: number
  userHop: number
  path: PathPoint[]
  meanDistance: number | null
  words: FeedbackWord[] | null
  melodyBar: BarState | null
  rhythmBar: BarState | null
  unclear: boolean
  tooLittleVoice: boolean
  tooShort: boolean
  fewWords: boolean
  globalRatio: number | null
  /** Why the take cannot be scored as a whole. Null when the bars stand. */
  reason: 'short' | 'quiet' | 'file' | 'noTimes' | 'unclear' | 'few' | null
  /** The band shape is closer to a different sentence. The bars can stay. */
  otherSentence: boolean
}

export function melodyBand(distance: number): Band {
  if (distance < MELODY_GREEN) return 'green'
  if (distance <= MELODY_YELLOW) return 'yellow'
  return 'red'
}

export function rhythmBand(ratio: number): Band {
  if (ratio >= RHYTHM_GREEN_MIN && ratio <= RHYTHM_GREEN_MAX) return 'green'
  if ((ratio >= RHYTHM_YELLOW_MIN && ratio < RHYTHM_GREEN_MIN) || (ratio > RHYTHM_GREEN_MAX && ratio <= RHYTHM_YELLOW_MAX)) {
    return 'yellow'
  }
  return 'red'
}

export function barFromColours(colours: Array<Band | null>): BarState | null {
  const used = colours.filter((colour): colour is Band => colour != null)
  if (used.length === 0) return null
  const reds = used.filter((colour) => colour === 'red').length
  const greens = used.filter((colour) => colour === 'green').length
  if (reds * 2 >= used.length) return 'daneben'
  if (used.length < 3) {
    if (reds > 0) return 'teilweise'
    if (used.length === 1 && used[0] === 'yellow') return 'teilweise'
    return 'passt'
  }
  if (reds === 0 && greens / used.length >= 0.7) return 'passt'
  return 'teilweise'
}

const TONE_MARK: Record<string, ToneId> = {}

function addMarks(chars: string, tone: ToneId): void {
  for (const char of chars) TONE_MARK[char] = tone
}

addMarks('àằầèềìòồờùừỳÀẰẦÈỀÌÒỒỜÙỪỲ', 'huyen')
addMarks('áắấéếíóốớúứýÁẮẤÉẾÍÓỐỚÚỨÝ', 'sac')
addMarks('ảẳẩẻểỉỏổởủửỷẢẲẨẺỂỈỎỔỞỦỬỶ', 'hoi')
addMarks('ãẵẫẽễĩõỗỡũữỹÃẴẪẼỄĨÕỖỠŨỮỸ', 'nga')
addMarks('ạặậẹệịọộợụựỵẠẶẬẸỆỊỌỘỢỤỰỴ', 'nang')

export function toneOf(text: string): ToneId {
  for (const char of text) {
    const tone = TONE_MARK[char]
    if (tone) return tone
  }
  return 'ngang'
}

function acceptedShapes(tone: ToneId, region: 'south' | 'north'): ShapeName[] {
  if (region === 'south' && (tone === 'hoi' || tone === 'nga')) return ['level', 'rising', 'falling', 'dipping']
  if (tone === 'ngang') return ['level']
  if (tone === 'huyen' || tone === 'nang') return ['falling']
  if (tone === 'sac') return ['rising']
  if (tone === 'nga') return ['dipping', 'rising']
  return ['dipping']
}

function shouldShape(tone: ToneId): ToneShape {
  if (tone === 'ngang') return 'level'
  if (tone === 'sac') return 'rising'
  if (tone === 'huyen' || tone === 'nang') return 'falling'
  return 'dipping'
}

export function toneSentence(text: string, shape: ShapeName, lang: Lang, region: 'south' | 'north'): ToneSentence | null {
  if (lang !== 'vi' || shape === 'unknown') return null
  const tone = toneOf(text)
  if (acceptedShapes(tone, region).includes(shape)) return null
  if (shape !== 'level' && shape !== 'rising' && shape !== 'falling' && shape !== 'dipping') return null
  return { you: shape, should: shouldShape(tone), tone }
}

export function thin(contour: Contour, hop: number): { contour: Contour; hop: number } {
  if (contour.length <= MAX_FRAMES) return { contour, hop }
  const step = Math.ceil(contour.length / MAX_FRAMES)
  const next: Contour = []
  for (let index = 0; index < contour.length; index += step) next.push(contour[index] ?? null)
  return { contour: next, hop: hop * step }
}

/** Quiet pitch after the last loud frame of a run may be the syllable dying away. */
const DECAY_FRAMES = 6

/**
 * First run of three voiced frames, and the last voiced frame. When
 * loudness is known, the end is the last run of at least three frames
 * that rises above the floor. A near-silent continuation, or one or two
 * leftover frames, does not stretch the map. Later words would otherwise
 * land in the gaps.
 */
function sustained(contour: Contour, energy?: readonly number[] | null): { start: number; end: number } | null {
  let start = -1
  for (let index = 0; index <= contour.length - 3; index += 1) {
    if (contour[index] != null && contour[index + 1] != null && contour[index + 2] != null) {
      start = index
      break
    }
  }
  if (start < 0) return null
  let end = start + 1
  const levels = loudLevels(energy, contour.length)
  if (levels == null) {
    for (let index = contour.length - 1; index >= start; index -= 1) {
      if (contour[index] != null) {
        end = index + 1
        break
      }
    }
    return { start, end }
  }
  let index = start
  while (index < contour.length) {
    if (contour[index] == null) {
      index += 1
      continue
    }
    const runStart = index
    let lastLoud = -1
    while (index < contour.length && contour[index] != null) {
      const level = levels[index] ?? 0
      if (level >= LOUD_FRACTION) lastLoud = index
      index += 1
    }
    const runEnd = index - 1
    const length = runEnd - runStart + 1
    if (lastLoud < 0 || length < 3) continue
    const decayEnd = Math.min(runEnd, lastLoud + DECAY_FRAMES)
    end = Math.max(end, decayEnd + 1)
  }
  return { start, end }
}

/** Loudness of each frame as a fraction of the peak. Null when loudness is missing. */
function loudLevels(energy: readonly number[] | null | undefined, length: number): number[] | null {
  if (!energy || energy.length !== length) return null
  let peak = 0
  for (const value of energy) if (value > peak) peak = value
  if (!(peak > 0)) return null
  return energy.map((value) => value / peak)
}

function warp(model: Contour, user: Contour, path: PathPoint[]): Contour {
  const buckets: number[][] = model.map(() => [])
  for (const point of path) {
    const value = user[point.user]
    if (value != null) buckets[point.model]?.push(value)
  }
  return buckets.map((bucket) => {
    if (bucket.length === 0) return null
    bucket.sort((a, b) => a - b)
    return bucket[Math.floor(bucket.length / 2)] ?? null
  })
}

function linearPath(modelSpan: { start: number; end: number }, userSpan: { start: number; end: number }): PathPoint[] {
  const modelLength = modelSpan.end - modelSpan.start
  const userLength = userSpan.end - userSpan.start
  const path: PathPoint[] = []
  for (let offset = 0; offset < modelLength; offset += 1) {
    const rel = modelLength <= 1 ? 0 : offset / (modelLength - 1)
    const user = userSpan.start + Math.round(rel * Math.max(0, userLength - 1))
    path.push({ model: modelSpan.start + offset, user })
  }
  return path
}

function pathMean(model: Contour, user: Contour, path: PathPoint[]): number | null {
  let sum = 0
  let count = 0
  for (const point of path) {
    const left = model[point.model]
    const right = user[point.user]
    if (left == null || right == null) continue
    sum += Math.abs(left - right)
    count += 1
  }
  return count === 0 ? null : sum / count
}

const LOCAL_SCALES = [0.75, 0.9, 1, 1.15, 1.33]

function mappedFrame(
  modelFrame: number,
  modelSpan: { start: number; end: number },
  userSpan: { start: number; end: number },
): number {
  const modelLength = Math.max(1, modelSpan.end - modelSpan.start - 1)
  const rel = (modelFrame - modelSpan.start) / modelLength
  return userSpan.start + rel * Math.max(0, userSpan.end - userSpan.start - 1)
}

/**
 * How long the word lasts in the take, once the global map has lined the
 * two spans up. A uniform stretch cancels when this is divided by the
 * span ratio. The local scale then keeps a word that moved against the rest.
 */
function wordRhythmRatio(
  start: number,
  end: number,
  scale: number,
  globalRatio: number,
  modelSpan: { start: number; end: number },
  userSpan: { start: number; end: number },
  modelHop: number,
  userHop: number,
): number {
  const fileDuration = end - start
  if (!(fileDuration > 0) || !(globalRatio > 0) || !(scale > 0)) return scale
  const modelStart = modelSpan.start * modelHop
  const modelLength = Math.max(modelHop, (modelSpan.end - 1) * modelHop - modelStart)
  const userStart = userSpan.start * userHop
  const userLength = Math.max(0, (userSpan.end - 1) * userHop - userStart)
  const userDuration = ((end - start) / modelLength) * userLength * scale
  const ratio = userDuration / fileDuration / globalRatio
  return Number.isFinite(ratio) && ratio > 0 ? ratio : scale
}

/**
 * The global map already took out a uniform tempo. A small shift and a
 * local scale of about 0.75–1.33 then catch one word that moved against
 * the rest. The scale is only trusted when it actually lowers the distance
 * under the green band: a mirrored syllable stays on scale 1, so the
 * melody stays red. A wider scale would hide a reversal or paint a uniform
 * 0.7 take red.
 */
function distanceAt(
  model: Contour,
  user: Contour,
  frame: number,
  frameEnd: number,
  modelSpan: { start: number; end: number },
  userSpan: { start: number; end: number },
  scale: number,
  shift: number,
): { mean: number; count: number } | null {
  let sum = 0
  let count = 0
  let voicedModel = 0
  const origin = mappedFrame(frame, modelSpan, userSpan) + shift
  const base = mappedFrame(frame, modelSpan, userSpan)
  const limitStart = Math.min(base, mappedFrame(frameEnd - 1, modelSpan, userSpan)) - 4
  const limitEnd = Math.max(base, mappedFrame(frameEnd - 1, modelSpan, userSpan)) + 4
  for (let index = frame; index < frameEnd; index += 1) {
    const left = model[index]
    if (left == null) continue
    voicedModel += 1
    const delta = mappedFrame(index, modelSpan, userSpan) - base
    const at = Math.round(origin + delta * scale)
    if (at < limitStart || at > limitEnd) continue
    const right = user[at]
    if (right == null) continue
    sum += Math.abs(left - right)
    count += 1
  }
  if (voicedModel < MIN_WORD_VOICED || count < voicedModel * VOICE_COVERAGE) return null
  return { mean: sum / count, count }
}

function matchLocal(
  model: Contour,
  user: Contour,
  frame: number,
  frameEnd: number,
  modelSpan: { start: number; end: number },
  userSpan: { start: number; end: number },
): { mean: number; scale: number; shift: number; count: number } | null {
  let atOne: { mean: number; scale: number; shift: number; count: number } | null = null
  for (let shift = -4; shift <= 4; shift += 2) {
    const found = distanceAt(model, user, frame, frameEnd, modelSpan, userSpan, 1, shift)
    if (found && (!atOne || found.mean < atOne.mean)) atOne = { ...found, scale: 1, shift }
  }
  if (!atOne) return null
  if (atOne.mean < MELODY_GREEN) return atOne
  let best = atOne
  for (const scale of LOCAL_SCALES) {
    if (scale === 1) continue
    for (let shift = -4; shift <= 4; shift += 2) {
      const found = distanceAt(model, user, frame, frameEnd, modelSpan, userSpan, scale, shift)
      if (!found || found.mean >= MELODY_GREEN) continue
      if (found.mean < best.mean) best = { ...found, scale, shift }
    }
  }
  return best
}

function pairedValues(model: Contour, user: Contour, path: PathPoint[]): { left: number[]; right: number[] } {
  const left: number[] = []
  const right: number[] = []
  for (const point of path) {
    const modelValue = model[point.model]
    const userValue = user[point.user]
    if (modelValue == null || userValue == null) continue
    left.push(modelValue)
    right.push(userValue)
  }
  return { left, right }
}

/** Pearson correlation. Null when either side barely moves, so a level phrase is not punished. */
export function correlation(left: readonly number[], right: readonly number[]): number | null {
  const count = Math.min(left.length, right.length)
  if (count < 8) return null
  let sumLeft = 0
  let sumRight = 0
  for (let index = 0; index < count; index += 1) {
    sumLeft += left[index] ?? 0
    sumRight += right[index] ?? 0
  }
  const meanLeft = sumLeft / count
  const meanRight = sumRight / count
  let varLeft = 0
  let varRight = 0
  let product = 0
  for (let index = 0; index < count; index += 1) {
    const deltaLeft = (left[index] ?? 0) - meanLeft
    const deltaRight = (right[index] ?? 0) - meanRight
    varLeft += deltaLeft * deltaLeft
    varRight += deltaRight * deltaRight
    product += deltaLeft * deltaRight
  }
  if (varLeft < 0.16 * count || varRight < 0.16 * count) return null
  return product / Math.sqrt(varLeft * varRight)
}

export function contourCorrelation(model: Contour, user: Contour, path: PathPoint[]): number | null {
  const paired = pairedValues(model, user, path)
  return correlation(paired.left, paired.right)
}

/** Pearson without the semitone floor. Loudness values are much smaller than a semitone. */
export function seriesCorrelation(left: readonly number[], right: readonly number[]): number | null {
  const count = Math.min(left.length, right.length)
  if (count < 8) return null
  let sumLeft = 0
  let sumRight = 0
  for (let index = 0; index < count; index += 1) {
    sumLeft += left[index] ?? 0
    sumRight += right[index] ?? 0
  }
  const meanLeft = sumLeft / count
  const meanRight = sumRight / count
  let varLeft = 0
  let varRight = 0
  let product = 0
  for (let index = 0; index < count; index += 1) {
    const deltaLeft = (left[index] ?? 0) - meanLeft
    const deltaRight = (right[index] ?? 0) - meanRight
    varLeft += deltaLeft * deltaLeft
    varRight += deltaRight * deltaRight
    product += deltaLeft * deltaRight
  }
  if (varLeft <= 1e-12 || varRight <= 1e-12) return null
  return product / Math.sqrt(varLeft * varRight)
}

export function energyCorrelation(
  path: readonly PathPoint[],
  modelEnergy: readonly number[],
  userEnergy: readonly number[],
): number | null {
  const left: number[] = []
  const right: number[] = []
  for (const point of path) {
    const modelValue = modelEnergy[point.model]
    const userValue = userEnergy[point.user]
    if (modelValue == null || userValue == null) continue
    left.push(modelValue)
    right.push(userValue)
  }
  return seriesCorrelation(left, right)
}

function wordCorrelation(model: Contour, user: Contour, path: readonly PathPoint[], frame: number, frameEnd: number): number | null {
  const left: number[] = []
  const right: number[] = []
  for (const point of path) {
    if (point.model < frame || point.model >= frameEnd) continue
    const modelValue = model[point.model]
    const userValue = user[point.user]
    if (modelValue == null || userValue == null) continue
    left.push(modelValue)
    right.push(userValue)
  }
  return correlation(left, right)
}

/** Pitch quieter than this share of the peak does not move the timed span. */
const LOUD_FRACTION = 0.08

/** Coefficient of variation of a loudness curve. A pure tone sits near 0. */
export function energyVariation(energy: readonly number[] | null | undefined): number | null {
  if (!energy || energy.length < 8) return null
  let peak = 0
  for (const value of energy) if (value > peak) peak = value
  if (peak <= 0) return null
  const used = energy.filter((value) => value >= peak * LOUD_FRACTION)
  if (used.length < 8) return null
  let sum = 0
  for (const value of used) sum += value
  const mean = sum / used.length
  if (mean <= 0) return null
  let variance = 0
  for (const value of used) {
    const delta = value - mean
    variance += delta * delta
  }
  return Math.sqrt(variance / used.length) / mean
}

/**
 * A drone against a spoken file. The pitch can match a short level phrase;
 * the loudness of speech still moves, and a tone's does not.
 */
export function droneAgainstSpeech(
  userEnergy: readonly number[] | null | undefined,
  modelEnergy: readonly number[] | null | undefined,
): boolean {
  const user = energyVariation(userEnergy)
  const model = energyVariation(modelEnergy)
  if (user == null || model == null) return false
  return user < DRONE_ENERGY && model >= SPEECH_ENERGY
}

/**
 * The loudness of the take does not follow the file. A drone against
 * speech, or two speech-like envelopes that run apart. Missing curves,
 * and the synthetic fixtures that pass none, are left alone.
 */
export function envelopeMismatch(
  path: readonly PathPoint[],
  userEnergy: readonly number[] | null | undefined,
  modelEnergy: readonly number[] | null | undefined,
): boolean {
  if (droneAgainstSpeech(userEnergy, modelEnergy)) return true
  if (!userEnergy || !modelEnergy) return false
  const user = energyVariation(userEnergy)
  const model = energyVariation(modelEnergy)
  if (user == null || model == null) return false
  if (user < SPEECH_ENERGY || model < SPEECH_ENERGY) return false
  const aligned = energyCorrelation(path, modelEnergy, userEnergy)
  if (aligned == null) return false
  return aligned < ENERGY_ALIGN_MIN
}

/**
 * The MFCC trajectory does not follow the file. Missing bands, as in the
 * synthetic pitch fixtures, are left alone. A hum, other speech or another
 * sentence sits above the language limit.
 */
export function contentMismatch(
  modelBands: readonly (readonly number[])[] | null | undefined,
  userBands: readonly (readonly number[])[] | null | undefined,
  lang: Lang,
): boolean {
  if (!modelBands || !userBands) return false
  const distance = bandDistance(modelBands, userBands)
  if (distance == null) return false
  return distance > SPECTRAL_DISTANCE_MAX[lang]
}

/**
 * The band shape fits the file better when the file is flipped in time.
 * A straight imitation, including another voice, fits forwards. A reversed
 * recording fits backwards even when the pitch contour is almost the same.
 */
export function spectralReversed(
  modelBands: readonly (readonly number[])[] | null | undefined,
  userBands: readonly (readonly number[])[] | null | undefined,
): boolean {
  if (!modelBands || !userBands || modelBands.length < 8 || userBands.length < 8) return false
  const forward = bandDistance(modelBands, userBands)
  const backward = bandDistance([...modelBands].reverse(), userBands)
  if (forward == null || backward == null) return false
  // A short symmetric phrase is only a little closer backwards. 0.03 still
  // leaves a forward imitation, whose backward cost is higher, alone.
  return backward + 0.03 < forward
}

/**
 * The file played backwards. The gap is wider than spectralReversed, so a
 * second voice that is only a little closer backwards is not locked.
 */
export function reversedRecording(
  modelBands: readonly (readonly number[])[] | null | undefined,
  userBands: readonly (readonly number[])[] | null | undefined,
): boolean {
  if (!modelBands || !userBands || modelBands.length < 8 || userBands.length < 8) return false
  const forward = bandDistance(modelBands, userBands)
  const backward = bandDistance([...modelBands].reverse(), userBands)
  if (forward == null || backward == null) return false
  return backward + REVERSE_BAND_GAP < forward
}

function thinEnergy(energy: readonly number[] | null | undefined, contourLength: number): number[] | null {
  if (!energy || energy.length !== contourLength) return null
  if (contourLength <= MAX_FRAMES) return [...energy]
  const step = Math.ceil(contourLength / MAX_FRAMES)
  const next: number[] = []
  for (let index = 0; index < contourLength; index += step) next.push(energy[index] ?? 0)
  return next
}

type WordDirection = 'same' | 'opposed' | 'unknown'

function wordDirection(pitchCorr: number | null, modelShape: ShapeName, userShape: ShapeName): WordDirection {
  if (pitchCorr != null) {
    if (pitchCorr < DIRECTION_OPPOSED) return 'opposed'
    if (pitchCorr >= DIRECTION_MIN) return 'same'
    return 'unknown'
  }
  if ((modelShape === 'rising' && userShape === 'falling') || (modelShape === 'falling' && userShape === 'rising')) return 'opposed'
  return 'unknown'
}

/**
 * The take matches the file better when the contour is flipped in time.
 * A straight imitation matches forwards. The caller skips this when any
 * word still runs the same way, so one mirrored syllable stays a partial.
 */
/** Correlation of the model with the take flipped in time. Null when either side is level. */
export function backwardCorrelation(model: Contour, user: Contour): number | null {
  const flipped = [...user].reverse()
  const modelSpan = sustained(model)
  const userSpan = sustained(flipped)
  if (!modelSpan || !userSpan) return null
  return contourCorrelation(model, flipped, linearPath(modelSpan, userSpan))
}

export function matchesBetterBackwards(model: Contour, user: Contour, forward: number | null): boolean {
  const backward = backwardCorrelation(model, user)
  // A single mirrored syllable reaches about 0.8. A reversed recording sits near 1.
  if (backward == null || backward < 0.9) return false
  if (forward == null) return true
  return backward > forward + 0.05
}

/**
 * A reversed recording. Pitch near 1 when flipped is enough. A looser pitch
 * match still counts when the loudness is not the file played forwards.
 * The synthetic mirrored syllable passes no loudness, so it stays partial.
 */
export function reversedTake(
  model: Contour,
  user: Contour,
  forward: number | null,
  path: readonly PathPoint[],
  modelEnergy: readonly number[] | null,
  userEnergy: readonly number[] | null,
): boolean {
  if (matchesBetterBackwards(model, user, forward)) return true
  if (!modelEnergy || !userEnergy) return false
  const backward = backwardCorrelation(model, user)
  if (backward == null || backward < 0.65) return false
  if (forward != null && backward <= forward + 0.05) return false
  const aligned = energyCorrelation(path, modelEnergy, userEnergy)
  return aligned != null && aligned < 0.75
}

/** Every word we can judge runs the other way. One mirrored syllable does not. */
export function takeRunsBackwards(directions: readonly WordDirection[]): boolean {
  const known = directions.filter((direction) => direction !== 'unknown')
  if (known.length === 0) return false
  return known.every((direction) => direction === 'opposed')
}

const HARMONIC_SHIFTS = [12, -12, 19.02, -19.02, 24, -24]

/**
 * A frame sitting on a harmonic of the file is folded onto the file.
 * Only a take whose band shape already matches may call this. A tone
 * does not match, so it is not pulled onto the melody.
 */
function pullHarmonics(model: Contour, user: Contour, path: readonly PathPoint[]): Contour {
  const next = user.slice()
  let changed = false
  for (const point of path) {
    const target = model[point.model]
    const value = next[point.user]
    if (target == null || value == null) continue
    let best = value
    let bestDist = Math.abs(value - target)
    if (bestDist < 6) continue
    for (const shift of HARMONIC_SHIFTS) {
      const candidate = value + shift
      const dist = Math.abs(candidate - target)
      // ±3 st on top of an octave lands about 9 or 15 st away. A residual
      // under 4 st is that shift, not a new melody.
      if (dist <= 3.5 && bestDist - dist >= 6) {
        best = candidate
        bestDist = dist
      }
    }
    if (best !== value) {
      next[point.user] = best
      changed = true
    }
  }
  return changed ? next : user
}

function voicedRange(contour: Contour): number | null {
  let low = Number.POSITIVE_INFINITY
  let high = Number.NEGATIVE_INFINITY
  for (const value of contour) {
    if (value == null) continue
    if (value < low) low = value
    if (value > high) high = value
  }
  if (!Number.isFinite(low) || !Number.isFinite(high)) return null
  return high - low
}

/**
 * A drone against a moving reference is «unklar». The same flat shape on
 * both sides, as in a short level phrase, is not.
 */
export function flatContour(user: Contour, model: Contour): boolean {
  const userRange = voicedRange(user)
  const modelRange = voicedRange(model)
  if (userRange == null || modelRange == null) return false
  return userRange < FLAT_RANGE && modelRange >= userRange + FLAT_RANGE
}

function worseBand(left: Band, right: Band): Band {
  const rank: Record<Band, number> = { green: 0, yellow: 1, red: 2 }
  return rank[left] >= rank[right] ? left : right
}

function worseBar(left: BarState, right: BarState): BarState {
  const rank: Record<BarState, number> = { passt: 0, teilweise: 1, daneben: 2 }
  return rank[left] >= rank[right] ? left : right
}

function globalBar(ratio: number): BarState {
  const band = rhythmBand(ratio)
  if (band === 'green') return 'passt'
  if (band === 'yellow') return 'teilweise'
  return 'daneben'
}

export function scoreRepeat(input: {
  model: Contour
  user: Contour
  modelHop: number
  userHop: number
  words: Array<{ text: string; start: number; end: number }> | null
  lang: Lang
  region: 'south' | 'north'
  userDuration: number
  /** Loudness per contour frame. Absent in the synthetic fixtures. */
  modelEnergy?: readonly number[] | null
  userEnergy?: readonly number[] | null
  /** Loudness-free band shape, one vector per contour frame. */
  modelBands?: readonly (readonly number[])[] | null
  userBands?: readonly (readonly number[])[] | null
  /**
   * Unshifted user bands. A frequency warp can hide a reversed recording,
   * so the reverse lock uses these when they are present.
   */
  userPlainBands?: readonly (readonly number[])[] | null
}): RepeatScore {
  const modelThin = thin(input.model, input.modelHop > 0 ? input.modelHop : 0.01)
  const userThin = thin(input.user, input.userHop > 0 ? input.userHop : 0.01)
  const model = modelThin.contour
  const user = userThin.contour
  const modelHop = modelThin.hop
  const userHop = userThin.hop
  const voiced = voicedValues(user).length
  const modelVoiced = voicedValues(model).length
  const tooShort = input.userDuration < SHORT_SECONDS
  const fileThin = modelVoiced < MIN_VOICED
  const tooLittleVoice = voiced < MIN_VOICED
  const empty: RepeatScore = {
    model,
    user,
    userOnModel: model.map(() => null),
    modelHop,
    userHop,
    path: [],
    meanDistance: null,
    words: null,
    melodyBar: null,
    rhythmBar: null,
    unclear: false,
    tooLittleVoice,
    tooShort,
    fewWords: false,
    globalRatio: null,
    otherSentence: false,
    reason: tooShort ? 'short' : fileThin ? 'file' : tooLittleVoice ? 'quiet' : null,
  }
  const lockBands = input.userPlainBands && input.userPlainBands.length > 0 ? input.userPlainBands : input.userBands
  const lockKnown = Boolean(input.modelBands && lockBands && input.modelBands.length > 0 && lockBands.length > 0)
  const bandReversed = reversedRecording(input.modelBands, lockBands)
  if (tooShort) return empty
  if (fileThin) return { ...empty, tooLittleVoice: false, reason: 'file' }
  // A reversed file can lose its tracked pitch. That is still «unklar», not a quiet take.
  if (bandReversed) return { ...empty, tooLittleVoice: false, unclear: true, reason: 'unclear' }
  if (tooLittleVoice) return empty
  const modelEnergy = thinEnergy(input.modelEnergy, input.model.length)
  const userEnergy = thinEnergy(input.userEnergy, input.user.length)
  const modelSpan = sustained(model, modelEnergy)
  const userSpan = sustained(user, userEnergy)
  if (!modelSpan || !userSpan) return { ...empty, tooLittleVoice: true, reason: 'quiet' }
  const path = linearPath(modelSpan, userSpan)
  let heard = user
  let meanDistance = pathMean(model, heard, path)
  if (meanDistance == null) return { ...empty, tooLittleVoice: true, reason: 'quiet' }
  const content = contentMismatch(input.modelBands, input.userBands, input.lang)
  const flipped = spectralReversed(input.modelBands, input.userBands)
  const bandsKnown = Boolean(input.modelBands && input.userBands && input.modelBands.length > 0 && input.userBands.length > 0)
  if (bandsKnown && !content && !flipped && meanDistance > 4) {
    const pulled = pullHarmonics(model, heard, path)
    const pulledMean = pathMean(model, pulled, path)
    if (pulledMean != null && pulledMean + 0.5 < meanDistance) {
      heard = pulled
      meanDistance = pulledMean
    }
  }
  const userOnModel = warp(model, heard, path)
  const globalRatio = ((userSpan.end - userSpan.start) * userHop) / ((modelSpan.end - modelSpan.start) * modelHop)
  const forward = contourCorrelation(model, heard, path)
  // With bands, the hard lock already returned above. The loose contour
  // lock stays only for fixtures that have no bands, so another voice is
  // not caught by it.
  const reversed = lockKnown ? false : reversedTake(model, heard, forward, path, modelEnergy, userEnergy)
  const spoken = (energyVariation(userEnergy) ?? 0) >= SPEECH_ENERGY
  const flat = flatContour(heard, model) && !spoken
  const drone = droneAgainstSpeech(userEnergy, modelEnergy) && (voicedRange(heard) ?? 0) < FLAT_RANGE
  if (flat || drone || reversed) {
    return {
      ...empty,
      userOnModel,
      path,
      meanDistance,
      globalRatio,
      unclear: true,
      tooLittleVoice: false,
      reason: 'unclear',
    }
  }
  if (!input.words || input.words.length === 0) {
    return {
      ...empty,
      userOnModel,
      path,
      meanDistance,
      globalRatio,
      tooLittleVoice: false,
      reason: 'noTimes',
    }
  }
  const directions: WordDirection[] = []
  const words = input.words.map((word, wordIndex) => {
    const frame = Math.max(0, Math.min(model.length - 1, Math.floor(word.start / modelHop)))
    let frameEnd = Math.max(frame + 1, Math.min(model.length, Math.ceil(word.end / modelHop)))
    let modelVoiced = 0
    for (let index = frame; index < frameEnd; index += 1) if (model[index] != null) modelVoiced += 1
    // The centre of the analysis window can fall a few frames after the
    // aligner closed the word, still before the next one. A short word
    // otherwise keeps one or two frames and stays grey.
    if (modelVoiced < MIN_WORD_VOICED) {
      const next = input.words?.[wordIndex + 1]
      const nextFrame = next ? Math.floor(next.start / modelHop) : model.length
      const extended = Math.max(frameEnd, Math.min(nextFrame, model.length, frameEnd + centerSlackFrames(modelHop)))
      let added = modelVoiced
      for (let index = frameEnd; index < extended; index += 1) if (model[index] != null) added += 1
      if (added >= MIN_WORD_VOICED) {
        frameEnd = extended
        modelVoiced = added
      }
    }
    const scorable = modelVoiced >= MIN_WORD_VOICED
    const matched = scorable && word.end > word.start ? matchLocal(model, heard, frame, frameEnd, modelSpan, userSpan) : null
    const plainStart = mappedFrame(frame, modelSpan, userSpan)
    const plainEnd = mappedFrame(Math.max(frame, frameEnd - 1), modelSpan, userSpan)
    const userFrame = Math.max(0, Math.round(Math.min(plainStart, plainEnd)))
    const userFrameEnd = Math.min(heard.length, Math.max(userFrame + 1, Math.round(Math.max(plainStart, plainEnd)) + 1))
    const base: FeedbackWord = {
      text: word.text,
      start: word.start,
      end: word.end,
      color: null,
      melody: null,
      rhythm: null,
      melodyDistance: null,
      rawRatio: null,
      userStart: userFrame * userHop,
      userEnd: userFrameEnd * userHop,
      modelFrame: frame,
      modelFrameEnd: frameEnd,
      userFrame,
      userFrameEnd,
      tone: input.lang === 'vi' ? toneOf(word.text) : null,
      userShape: 'unknown',
      sentence: null,
      scorable,
    }
    if (!matched || word.end <= word.start) {
      directions.push('unknown')
      return base
    }
    const pitchCorr = wordCorrelation(model, heard, path, frame, frameEnd)
    const modelShape = describeShape(model.slice(frame, frameEnd))
    const userSlice = heard.slice(Math.min(userFrame, heard.length), Math.min(heard.length, userFrameEnd))
    const userShape = describeShape(userSlice)
    const direction = wordDirection(pitchCorr, modelShape, userShape)
    directions.push(direction)
    const modelRange = voicedRange(model.slice(frame, frameEnd)) ?? 0
    const userRange = voicedRange(userSlice) ?? 0
    // A null correlation is too little movement to judge.
    const follows = pitchCorr != null && pitchCorr >= DIRECTION_MIN && userRange >= MOVING_RANGE
    let melody = melodyBand(matched.mean)
    if (pitchCorr != null && pitchCorr < DIRECTION_OPPOSED) melody = 'red'
    else if (pitchCorr != null && pitchCorr < DIRECTION_MIN && melody === 'green') melody = 'yellow'
    if (scorable && modelRange >= MOVING_RANGE && pitchCorr != null && !follows && melody === 'green') {
      melody = 'yellow'
    }
    // The word's own duration against the file, with the whole-take tempo
    // divided out. The local scale stays in, so one word can still move
    // against the rest. The span ratio alone would paint every word with
    // the global tempo, and that scale by itself never leaves the green band.
    const rawRatio = wordRhythmRatio(word.start, word.end, matched.scale, globalRatio, modelSpan, userSpan, modelHop, userHop)
    const rhythm = rhythmBand(rawRatio)
    return {
      ...base,
      color: worseBand(melody, rhythm),
      melody,
      rhythm,
      melodyDistance: matched.mean,
      rawRatio,
      userShape,
      sentence: toneSentence(word.text, userShape, input.lang, input.region),
    }
  })
  const anyColour = words.some((word) => word.color != null)
  const scoredWords =
    anyColour || meanDistance == null
      ? words
      : words.map((word) => {
          if (!word.scorable) return word
          const melody = melodyBand(meanDistance)
          const rawRatio = wordRhythmRatio(word.start, word.end, 1, globalRatio, modelSpan, userSpan, modelHop, userHop)
          const rhythm = rhythmBand(rawRatio)
          return {
            ...word,
            color: worseBand(melody, rhythm),
            melody,
            rhythm,
            melodyDistance: meanDistance,
            rawRatio,
          }
        })
  const melodyColours = barFromColours(scoredWords.map((word) => word.melody))
  const rhythmWords = barFromColours(scoredWords.map((word) => word.rhythm))
  const rhythmColours = rhythmWords ? worseBar(globalBar(globalRatio), rhythmWords) : null
  const hasColour = scoredWords.some((word) => word.color != null)
  if (takeRunsBackwards(directions) && !hasColour) {
    return {
      model,
      user: heard,
      userOnModel,
      modelHop,
      userHop,
      path,
      meanDistance,
      words: scoredWords,
      melodyBar: null,
      rhythmBar: null,
      fewWords: false,
      unclear: true,
      tooLittleVoice: false,
      tooShort: false,
      globalRatio,
      otherSentence: false,
      reason: 'unclear',
    }
  }
  const melodyBar = melodyColours
  const rhythmBar = rhythmColours
  const scorable = scoredWords.filter((word) => word.scorable)
  const coloured = scorable.filter((word) => word.color != null).length
  const allowed = scorable.length > 0 && coloured / scorable.length >= COLOURED_SHARE
  const fewWords = !allowed
  // A far band shape does not take the bars, and this release does not
  // turn it into a sentence hint. Another voice of the right sentence
  // often sits past the old limit.
  return {
    model,
    user: heard,
    userOnModel,
    modelHop,
    userHop,
    path,
    meanDistance,
    words: scoredWords,
    melodyBar: hasColour ? melodyBar : null,
    rhythmBar: hasColour ? rhythmBar : null,
    fewWords,
    unclear: false,
    tooLittleVoice: false,
    tooShort: false,
    globalRatio,
    otherSentence: false,
    reason: hasColour && !fewWords ? null : 'few',
  }
}
