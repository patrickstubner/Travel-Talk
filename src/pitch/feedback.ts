import type { Lang } from '../../content/phrase'
import { describeShape, dtwDistance, voicedValues, type Contour, type ShapeName } from './contour'

/**
 * Bands for the first version. They are a starting point set by the author,
 * not a learner study. The fixtures in feedback.test.ts are what they have
 * to survive. A mean path distance above UNCLEAR_SEMITONES is «unklar»:
 * the curves stay, the words stay uncoloured. That cutoff is a choice.
 *
 * Rhythm colour of a word uses the word's duration ratio divided by the
 * ratio of the whole voiced spans, so a uniform slow take is not red on
 * every word. The rhythm bar is the worse of that word bar and the band
 * of the whole-span ratio. Comparison is against the file that was heard.
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
  legacyDistance: number | null
  words: FeedbackWord[] | null
  melodyBar: BarState | null
  rhythmBar: BarState | null
  stars: 0 | 1 | 2 | 3
  unclear: boolean
  tooLittleVoice: boolean
  tooShort: boolean
  globalRatio: number | null
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

export function starsFromBars(melody: BarState | null, rhythm: BarState | null): 0 | 1 | 2 | 3 {
  if (!melody || !rhythm) return 0
  if (melody === 'passt' && rhythm === 'passt') return 3
  if (melody === 'daneben' || rhythm === 'daneben') return 1
  return 2
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

function thin(contour: Contour, hop: number): { contour: Contour; hop: number } {
  if (contour.length <= MAX_FRAMES) return { contour, hop }
  const step = Math.ceil(contour.length / MAX_FRAMES)
  const next: Contour = []
  for (let index = 0; index < contour.length; index += step) next.push(contour[index] ?? null)
  return { contour: next, hop: hop * step }
}

function sustained(contour: Contour): { start: number; end: number } | null {
  let start = -1
  for (let index = 0; index <= contour.length - 3; index += 1) {
    if (contour[index] != null && contour[index + 1] != null && contour[index + 2] != null) {
      start = index
      break
    }
  }
  if (start < 0) return null
  let end = start + 1
  for (let index = contour.length - 1; index >= start; index -= 1) {
    if (contour[index] != null) {
      end = index + 1
      break
    }
  }
  return { start, end }
}

function frameCost(left: number | null, right: number | null): number {
  if (left == null && right == null) return 0.2
  if (left == null || right == null) return 4
  return Math.abs(left - right)
}

export function alignContours(model: Contour, user: Contour): { path: PathPoint[]; mean: number } | null {
  const rows = model.length
  const cols = user.length
  if (rows < 2 || cols < 2) return null
  const width = cols + 1
  const inf = 1e12
  const cost = new Float64Array((rows + 1) * width)
  cost.fill(inf)
  cost[0] = 0
  const step = new Uint8Array((rows + 1) * width)
  for (let i = 1; i <= rows; i += 1) {
    const left = model[i - 1] ?? null
    for (let j = 1; j <= cols; j += 1) {
      const local = frameCost(left, user[j - 1] ?? null)
      const diag = cost[(i - 1) * width + (j - 1)] ?? inf
      const up = cost[(i - 1) * width + j] ?? inf
      const stay = cost[i * width + (j - 1)] ?? inf
      let best = diag
      let which = 1
      if (up < best) {
        best = up
        which = 2
      }
      if (stay < best) {
        best = stay
        which = 3
      }
      cost[i * width + j] = local + best
      step[i * width + j] = which
    }
  }
  if ((cost[rows * width + cols] ?? inf) >= inf / 2) return null
  const path: PathPoint[] = []
  let i = rows
  let j = cols
  let guard = rows + cols + 2
  while (i > 0 && j > 0 && guard > 0) {
    path.push({ model: i - 1, user: j - 1 })
    const which = step[i * width + j] ?? 1
    if (which === 2) i -= 1
    else if (which === 3) j -= 1
    else {
      i -= 1
      j -= 1
    }
    guard -= 1
  }
  path.reverse()
  let sum = 0
  let count = 0
  for (const point of path) {
    const left = model[point.model]
    const right = user[point.user]
    if (left == null || right == null) continue
    sum += Math.abs(left - right)
    count += 1
  }
  if (count === 0) return null
  return { path, mean: sum / count }
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

const LOCAL_SCALES = [0.45, 0.6, 0.75, 0.9, 1, 1.15, 1.3, 1.5, 1.75, 2.05]

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
 * The global map already took out a uniform tempo. A small shift and a
 * local scale then catch one word that moved against the rest. The scale
 * is only trusted when it actually lowers the distance: a mirrored
 * syllable stays on scale 1, so the melody stays red.
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
  if (voicedModel < MIN_WORD_VOICED || count < voicedModel * 0.8) return null
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
}): RepeatScore {
  const modelThin = thin(input.model, input.modelHop > 0 ? input.modelHop : 0.01)
  const userThin = thin(input.user, input.userHop > 0 ? input.userHop : 0.01)
  const model = modelThin.contour
  const user = userThin.contour
  const modelHop = modelThin.hop
  const userHop = userThin.hop
  const voiced = voicedValues(user).length
  const tooShort = input.userDuration < SHORT_SECONDS
  const tooLittleVoice = voiced < MIN_VOICED
  const legacyDistance = dtwDistance(voicedValues(model), voicedValues(user))
  const empty: RepeatScore = {
    model,
    user,
    userOnModel: model.map(() => null),
    modelHop,
    userHop,
    path: [],
    meanDistance: null,
    legacyDistance,
    words: null,
    melodyBar: null,
    rhythmBar: null,
    stars: 0,
    unclear: false,
    tooLittleVoice,
    tooShort,
    globalRatio: null,
  }
  if (tooShort || tooLittleVoice) return empty
  const modelSpan = sustained(model)
  const userSpan = sustained(user)
  if (!modelSpan || !userSpan) return { ...empty, tooLittleVoice: true }
  const path = linearPath(modelSpan, userSpan)
  const meanDistance = pathMean(model, user, path)
  if (meanDistance == null) return { ...empty, tooLittleVoice: true }
  const userOnModel = warp(model, user, path)
  const globalRatio = ((userSpan.end - userSpan.start) * userHop) / ((modelSpan.end - modelSpan.start) * modelHop)
  if (meanDistance > UNCLEAR_SEMITONES) {
    return {
      ...empty,
      userOnModel,
      path,
      meanDistance,
      legacyDistance,
      globalRatio,
      unclear: true,
      tooLittleVoice: false,
    }
  }
  if (!input.words || input.words.length === 0) {
    return {
      ...empty,
      userOnModel,
      path,
      meanDistance,
      legacyDistance,
      globalRatio,
      tooLittleVoice: false,
    }
  }
  const words = input.words.map((word) => {
    const frame = Math.max(0, Math.min(model.length - 1, Math.floor(word.start / modelHop)))
    const frameEnd = Math.max(frame + 1, Math.min(model.length, Math.ceil(word.end / modelHop)))
    const matched = word.end > word.start ? matchLocal(model, user, frame, frameEnd, modelSpan, userSpan) : null
    const plainStart = mappedFrame(frame, modelSpan, userSpan)
    const plainEnd = mappedFrame(Math.max(frame, frameEnd - 1), modelSpan, userSpan)
    const userFrame = Math.max(0, Math.round(Math.min(plainStart, plainEnd)))
    const userFrameEnd = Math.min(user.length, Math.max(userFrame + 1, Math.round(Math.max(plainStart, plainEnd)) + 1))
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
    }
    if (!matched || word.end <= word.start) return base
    const melody = melodyBand(matched.mean)
    const rawRatio = (globalRatio * matched.scale * (frameEnd - frame) * modelHop) / (word.end - word.start)
    const relative = matched.scale
    const rhythm = rhythmBand(relative)
    const userShape = describeShape(user.slice(Math.min(userFrame, user.length), Math.min(user.length, userFrameEnd)))
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
  const melodyBar = barFromColours(words.map((word) => word.melody))
  const rhythmWords = barFromColours(words.map((word) => word.rhythm))
  const rhythmBar = rhythmWords ? worseBar(globalBar(globalRatio), rhythmWords) : null
  return {
    model,
    user,
    userOnModel,
    modelHop,
    userHop,
    path,
    meanDistance,
    legacyDistance,
    words,
    melodyBar,
    rhythmBar,
    stars: starsFromBars(melodyBar, rhythmBar),
    unclear: false,
    tooLittleVoice: false,
    tooShort: false,
    globalRatio,
  }
}
