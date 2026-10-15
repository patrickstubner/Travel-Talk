import type { Lang } from '../../content/phrase'
import { centerSlackFrames, describeShape, voicedValues, type Contour, type ShapeName } from './contour'
import { bandDistance } from './spectrum'

/**
 * Bands for the first version. They are a starting point set by the author,
 * not a learner study. The fixtures in feedback.test.ts are what they have
 * to survive. A mean path distance above UNCLEAR_SEMITONES stays on the
 * curve as a colour. It no longer drops the words. That cutoff is a choice.
 *
 * Rhythm colour of a word is how long that word lasts in the recording,
 * read from the DTW path of the band shape, divided by the same span in
 * the file and by the tempo of the whole take. A take that is only slower
 * still has the file's proportions, so the words stay green. The loud span
 * inside a linearly mapped window is only the fallback when the band shape
 * is missing: inside continuous speech that window is full, so the ratio
 * would stay near 1. The local scale (about 0.75–1.33) is the fallback
 * when loudness is missing too. The rhythm bar is the worse of that word
 * bar and the band of the whole-span ratio, so a uniform 0.7 take is not a
 * perfect bar. Comparison is against the file that was heard.
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
 * app does not import. The stars on the page are starsFromVerdict in this
 * file, and that count is not stored. Bars stay when at least one word has a colour.
 * Under COLOURED_SHARE the words still show, the bars cover the coloured
 * part, and the page says so. The timed span ends on the last run of at
 * least three frames that rises above the loudness floor. A near-silent
 * tail, or one or two leftover frames, would stretch the map and drop
 * later words into the gaps. A word whose model moves by MOVING_RANGE
 * needs that movement in the same direction, otherwise it stays at most
 * yellow. Local stretch stays inside about 0.75–1.33 and is only kept
 * when it lands inside that language's green band. When the local
 * window misses every word but the model word has enough voice, the
 * whole-path distance still colours those words. A second voice often
 * sits outside the four-frame window.
 *
 * Melody bands live in MELODY_LIMITS. pt-BR is wider: at 1.5/3 a correct
 * second voice was red on about two words in five. vi stays tight because
 * a tone is a small movement. de and en stay on the first-version band.
 */
export type MelodyLimits = { readonly green: number; readonly yellow: number }

export const MELODY_LIMITS: Record<Lang, MelodyLimits> = {
  de: { green: 1.5, yellow: 3 },
  en: { green: 1.5, yellow: 3 },
  'pt-BR': { green: 2.5, yellow: 5 },
  vi: { green: 1.5, yellow: 3 },
}

/** First-version band. de, en and vi still use it. pt-BR does not. */
export const MELODY_GREEN = MELODY_LIMITS.de.green
export const MELODY_YELLOW = MELODY_LIMITS.de.yellow
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
/**
 * Below this, a word runs the other way for the whole-take check.
 * It does not by itself paint the word red.
 */
export const DIRECTION_OPPOSED = -0.15
/**
 * Clear counter-movement, measured on the DTW path of the band shape.
 *
 * Pearson r of −0.4 sits between a moderate association (|r| ≈ 0.3) and a
 * large one (|r| ≈ 0.5). The old cutoff of −0.15 used a linear map. A pause
 * in a different place shifted the two curves and the word went red even
 * when the tune was the same: on correct second pt-BR voices, 210 red
 * melody words had a distance of at most 3. The DTW path has already lined
 * the frames up, so a correlation that is still under −0.4 is the tune
 * going the other way, not a lag. Anything milder stays at most yellow.
 */
export const DIRECTION_CLEAR = -0.4
/**
 * Semitones the file's word must cover before that negative correlation can
 * paint it red. Two semitones is a rise or fall a listener hears as another
 * tune, and it is twice MOVING_RANGE. Under that, a sign flip on a nearly
 * level word is noise and stays at most yellow.
 */
export const DIRECTION_RANGE = 2
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
  /** Sentence check. Null when the take was not scored. Stars stay off the score. */
  sentenceCheck: SentenceCheck | null
  verdict: BarState | null
  /**
   * pt-BR only. True when the word tunes match the file or another male
   * voice, before the sentence bar is tightened. Null for other languages
   * and when the take was not scored. Stars read this. It is not stored.
   */
  melodyFit: boolean | null
}

export function melodyBand(distance: number, lang: Lang = 'de'): Band {
  const limits = MELODY_LIMITS[lang]
  if (distance < limits.green) return 'green'
  if (distance <= limits.yellow) return 'yellow'
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
 * First run of three voiced frames, and the last voiced frame. A run
 * under eleven frames is stepped over when a run of at least twelve
 * frames follows and is clearly louder. Eleven keeps a short first
 * syllable that the microphone shortens by a frame or two; ten still
 * drops the quiet blip a lead-in stretches in front of the sentence.
 * Only that one run: the onset just after a soft splinter stays. The
 * analysis window leans into a microphone lead-in and opens a brief
 * pitch there. A real onset is about as loud as what follows, so it
 * stays. The quiet splinter would otherwise stretch the whole-take tempo.
 * When loudness is known, the end is the last run of at least three
 * frames that rises above the floor. A near-silent continuation, or one
 * or two leftover frames, does not stretch the map. Later words would
 * otherwise land in the gaps.
 */
function sustained(contour: Contour, energy?: readonly number[] | null): { start: number; end: number } | null {
  const levels = loudLevels(energy, contour.length)
  const runs: Array<{ start: number; end: number; peak: number }> = []
  let cursor = 0
  while (cursor < contour.length) {
    if (contour[cursor] == null) {
      cursor += 1
      continue
    }
    const runStart = cursor
    let peak = 0
    while (cursor < contour.length && contour[cursor] != null) {
      const level = levels?.[cursor] ?? 0
      if (level > peak) peak = level
      cursor += 1
    }
    runs.push({ start: runStart, end: cursor, peak })
  }
  const body = runs.filter((run) => run.end - run.start >= 3)
  let chosen = body[0]
  if (!chosen) return null
  while (chosen.end - chosen.start < 11 && chosen.peak > 0) {
    const louderLater = body.some((run) => run.start >= chosen.end && run.end - run.start >= 12 && run.peak > chosen.peak + 0.12)
    if (!louderLater) break
    const next = body.find((run) => run.start >= chosen.end)
    if (!next) break
    chosen = next
  }
  const start = chosen.start
  let end = start + 1
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

/** Where `time` lands once the two spans have been lined up. */
function mapSpanTime(
  time: number,
  modelSpan: { start: number; end: number },
  userSpan: { start: number; end: number },
  modelHop: number,
  userHop: number,
): number {
  const modelStart = modelSpan.start * modelHop
  const modelLength = Math.max(modelHop, (modelSpan.end - modelSpan.start) * modelHop)
  const rel = (time - modelStart) / modelLength
  return userSpan.start * userHop + rel * (userSpan.end - userSpan.start) * userHop
}

/**
 * Seconds from the first loud frame of a word to the last. The floor is
 * the same share of the peak that limits the timed span. Fewer than two
 * loud frames is not a duration.
 */
function loudSpanSeconds(energy: readonly number[] | null, timeStart: number, timeEnd: number, hop: number): number | null {
  if (!energy || !(hop > 0) || !(timeEnd > timeStart)) return null
  let peak = 0
  for (const value of energy) if (value > peak) peak = value
  if (!(peak > 0)) return null
  const floor = peak * LOUD_FRACTION
  const from = Math.max(0, Math.floor(timeStart / hop))
  const to = Math.min(energy.length, Math.ceil(timeEnd / hop))
  let first = -1
  let last = -1
  for (let index = from; index < to; index += 1) {
    if ((energy[index] ?? 0) >= floor) {
      if (first < 0) first = index
      last = index
    }
  }
  if (first < 0 || last <= first) return null
  return (last - first + 1) * hop
}

/**
 * The word's own duration in the recording, divided by the same span in
 * the file and by the tempo of the whole take. The local scale is only
 * the fallback when loudness is missing, as in the synthetic fixtures.
 * Multiplying a measured duration by that scale would paint every word
 * green: every scale sits inside the green band.
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
  modelEnergy: readonly number[] | null,
  userEnergy: readonly number[] | null,
): number {
  if (!(scale > 0)) return scale
  const modelSeconds = loudSpanSeconds(modelEnergy, start, end, modelHop)
  const userFrom = mapSpanTime(start, modelSpan, userSpan, modelHop, userHop)
  const userTo = mapSpanTime(end, modelSpan, userSpan, modelHop, userHop)
  const userSeconds = loudSpanSeconds(userEnergy, Math.min(userFrom, userTo), Math.max(userFrom, userTo), userHop)
  if (modelSeconds == null || userSeconds == null || !(globalRatio > 0)) return scale
  const ratio = userSeconds / modelSeconds / globalRatio
  return Number.isFinite(ratio) && ratio > 0 ? ratio : scale
}

type FrameSpan = { start: number; end: number }

function vectorDistance(left: readonly number[], right: readonly number[]): number {
  const count = Math.min(left.length, right.length)
  if (count === 0) return 0
  let sum = 0
  for (let index = 0; index < count; index += 1) {
    const delta = (left[index] ?? 0) - (right[index] ?? 0)
    sum += delta * delta
  }
  return Math.sqrt(sum / count)
}

/**
 * Band frames on the contour grid, with the span mean taken out.
 * A thinned contour is no longer on that grid, so the path is refused
 * and the loud-span fallback stays.
 */
function centredBands(
  bands: readonly (readonly number[])[] | null | undefined,
  contourLength: number,
  span: FrameSpan,
): number[][] | null {
  if (!bands || bands.length < 8 || contourLength < 8) return null
  if (Math.abs(bands.length - contourLength) > 24) return null
  const width = bands.find((frame) => frame.length > 0)?.length ?? 0
  if (width < 2) return null
  const mean = new Array<number>(width).fill(0)
  let count = 0
  const from = Math.max(0, span.start)
  const to = Math.min(bands.length, span.end, contourLength)
  for (let index = from; index < to; index += 1) {
    const frame = bands[index]
    if (!frame || frame.length === 0) continue
    count += 1
    for (let band = 0; band < width; band += 1) mean[band] = (mean[band] ?? 0) + (frame[band] ?? 0)
  }
  if (count < 8) return null
  for (let band = 0; band < width; band += 1) mean[band] = (mean[band] ?? 0) / count
  return Array.from({ length: contourLength }, (_, index) => {
    const frame = bands[index]
    if (!frame || frame.length === 0) return []
    return frame.map((value, band) => value - (mean[band] ?? 0))
  })
}

function bandDeltas(frames: readonly (readonly number[])[]): number[][] {
  return frames.map((frame, index) => {
    const previous = frames[index - 1]
    if (frame.length === 0 || !previous || previous.length === 0) return []
    return frame.map((value, band) => value - (previous[band] ?? 0))
  })
}

/** Sakoe-Chiba DTW. Steps off the diagonal pay a small slope cost, so a path can still follow one stretched word. */
function dtwPath(costAt: (modelIndex: number, userIndex: number) => number, modelSpan: FrameSpan, userSpan: FrameSpan): PathPoint[] | null {
  const rows = modelSpan.end - modelSpan.start
  const cols = userSpan.end - userSpan.start
  if (rows < 4 || cols < 4) return null
  const window = Math.max(8, Math.ceil(Math.max(rows, cols) * 0.28))
  const slope = 0.04
  const inf = 1e12
  let previous = new Float64Array(cols).fill(inf)
  let current = new Float64Array(cols).fill(inf)
  const fromRow = new Int16Array(rows * cols).fill(-1)
  const fromCol = new Int16Array(rows * cols).fill(-1)
  const slotAt = (row: number, col: number) => row * cols + col
  for (let row = 0; row < rows; row += 1) {
    current.fill(inf)
    const center = Math.round((row * (cols - 1)) / Math.max(1, rows - 1))
    const from = Math.max(0, center - window)
    const to = Math.min(cols - 1, center + window)
    for (let col = from; col <= to; col += 1) {
      const cost = costAt(modelSpan.start + row, userSpan.start + col)
      if (row === 0 && col === 0) {
        current[0] = cost
        continue
      }
      let best = inf
      let backRow = -1
      let backCol = -1
      if (row > 0 && col > 0) {
        const diagonal = previous[col - 1] ?? inf
        if (diagonal < best) {
          best = diagonal
          backRow = row - 1
          backCol = col - 1
        }
      }
      if (row > 0) {
        const up = (previous[col] ?? inf) + slope
        if (up < best) {
          best = up
          backRow = row - 1
          backCol = col
        }
      }
      if (col > 0) {
        const left = (current[col - 1] ?? inf) + slope
        if (left < best) {
          best = left
          backRow = row
          backCol = col - 1
        }
      }
      if (best >= inf / 2) continue
      current[col] = cost + best
      const slot = slotAt(row, col)
      fromRow[slot] = backRow
      fromCol[slot] = backCol
    }
    const swap = previous
    previous = current
    current = swap
  }
  if ((previous[cols - 1] ?? inf) >= inf / 2) return null
  const path: PathPoint[] = []
  let row = rows - 1
  let col = cols - 1
  for (let guard = 0; guard < rows + cols + 2; guard += 1) {
    path.push({ model: modelSpan.start + row, user: userSpan.start + col })
    if (row === 0 && col === 0) break
    const slot = slotAt(row, col)
    const nextRow = fromRow[slot] ?? -1
    const nextCol = fromCol[slot] ?? -1
    if (nextRow < 0 || (nextRow === row && nextCol === col)) return null
    row = nextRow
    col = nextCol
  }
  path.reverse()
  const first = path[0]
  const last = path[path.length - 1]
  if (!first || !last || first.model !== modelSpan.start || first.user !== userSpan.start) return null
  if (last.model !== modelSpan.end - 1 || last.user !== userSpan.end - 1) return null
  return path
}

/**
 * Where each file frame lands in the recording. The cost is the band
 * shape, so a word that is actually longer pulls more recording frames
 * even when the speech never goes quiet. Without bands the linear
 * fallback in `wordRhythmRatio` remains.
 */
function rhythmPath(
  modelBands: readonly (readonly number[])[] | null | undefined,
  userBands: readonly (readonly number[])[] | null | undefined,
  modelLength: number,
  userLength: number,
  modelSpan: FrameSpan,
  userSpan: FrameSpan,
): PathPoint[] | null {
  const modelRaw = centredBands(modelBands, modelLength, modelSpan)
  const userRaw = centredBands(userBands, userLength, userSpan)
  if (!modelRaw || !userRaw) return null
  const modelDelta = bandDeltas(modelRaw)
  const userDelta = bandDeltas(userRaw)
  return dtwPath((modelIndex, userIndex) => {
    const left = modelRaw[modelIndex] ?? []
    const right = userRaw[userIndex] ?? []
    if (left.length === 0 && right.length === 0) return 0.2
    if (left.length === 0 || right.length === 0) return 1.1
    const raw = vectorDistance(left, right)
    const leftDelta = modelDelta[modelIndex] ?? []
    const rightDelta = userDelta[userIndex] ?? []
    const delta = leftDelta.length > 0 && rightDelta.length > 0 ? vectorDistance(leftDelta, rightDelta) : raw
    return 0.45 * raw + 0.55 * delta
  }, modelSpan, userSpan)
}

type WordRange = { modelStart: number; modelEnd: number; userStart: number; userEnd: number }

function rangeOnPath(path: readonly PathPoint[] | null, frame: number, frameEnd: number): WordRange | null {
  if (!path) return null
  const usersByModel = new Map<number, number[]>()
  for (const point of path) {
    if (point.model < frame || point.model >= frameEnd) continue
    const bucket = usersByModel.get(point.model)
    if (bucket) bucket.push(point.user)
    else usersByModel.set(point.model, [point.user])
  }
  if (usersByModel.size < 2) return null
  let modelStart = Number.POSITIVE_INFINITY
  let modelEnd = -1
  for (const modelIndex of usersByModel.keys()) {
    if (modelIndex < modelStart) modelStart = modelIndex
    if (modelIndex > modelEnd) modelEnd = modelIndex
  }
  const median = (values: readonly number[]) => {
    const sorted = [...values].sort((left, right) => left - right)
    return sorted[Math.floor(sorted.length / 2)] ?? 0
  }
  // One file frame can sit on several recording frames where the window
  // smears an onset. The middle of that step is the frame that belongs
  // to the word; the outer ones would paint a short word yellow.
  const first = usersByModel.get(modelStart)
  const last = usersByModel.get(modelEnd)
  if (!first || !last) return null
  const userStart = median(first)
  const userEnd = median(last)
  if (!Number.isFinite(modelStart) || modelEnd <= modelStart || userEnd <= userStart) return null
  return { modelStart, modelEnd: modelEnd + 1, userStart, userEnd: userEnd + 1 }
}

/** Recording frames on the path, divided by the file frames and by the tempo of the whole take. */
function ratioFromRange(range: WordRange, globalRatio: number, modelHop: number, userHop: number): number | null {
  const modelFrames = range.modelEnd - range.modelStart
  const userFrames = range.userEnd - range.userStart
  if (modelFrames < 2 || userFrames < 2 || !(globalRatio > 0) || !(modelHop > 0)) return null
  const ratio = (userFrames * userHop) / (modelFrames * modelHop) / globalRatio
  if (!Number.isFinite(ratio) || !(ratio > 0)) return null
  return ratio
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
  green: number,
): { mean: number; scale: number; shift: number; count: number } | null {
  let atOne: { mean: number; scale: number; shift: number; count: number } | null = null
  for (let shift = -4; shift <= 4; shift += 2) {
    const found = distanceAt(model, user, frame, frameEnd, modelSpan, userSpan, 1, shift)
    if (found && (!atOne || found.mean < atOne.mean)) atOne = { ...found, scale: 1, shift }
  }
  if (!atOne) return null
  if (atOne.mean < green) return atOne
  let best = atOne
  for (const scale of LOCAL_SCALES) {
    if (scale === 1) continue
    for (let shift = -4; shift <= 4; shift += 2) {
      const found = distanceAt(model, user, frame, frameEnd, modelSpan, userSpan, scale, shift)
      if (!found || found.mean >= green) continue
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
  // The sentence distance wants eight frames. A reversed one-syllable file
  // can fall short on both sides, and then six frames still see the flip.
  // A longer template against a short take stays at eight, so a correct
  // «Dạ.» is not locked just because one side is thin.
  const bothShort = bandDistance(modelBands, modelBands) == null && bandDistance(userBands, userBands) == null
  const minFrames = bothShort ? 6 : 8
  const forward = bandDistance(modelBands, userBands, 160, minFrames)
  const backward = bandDistance([...modelBands].reverse(), userBands, 160, minFrames)
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

/**
 * Above this, the sounds are not the file. A take of the same file sits at
 * 0 before a codec. On half B (odd SHA-1 byte of the line file, measured
 * once) the closest other pt-BR sentence is cadu «senhor» against «senhora»
 * on the hobby question, plain distance 0.303. 0.26 stays under that.
 */
export const SENTENCE_SAME = 0.26

/**
 * Same-speaker other sentences start just above SENTENCE_SAME. Against cadu
 * on half B, another voice of the right sentence stays above this: the
 * lowest is tammie «Olá, tudo bem?», plain distance 0.388, and the sentence
 * distance used by the bar is 0.380. Two other voices against each other
 * can sit lower (tammie against gracie on the job question, 0.290). In
 * between, the file's own voice is saying something else, and the bar is
 * «daneben». The numbers are the half-B measurement. The thresholds stay.
 */
export const SENTENCE_IMPOSTOR = 0.37

/**
 * Proposed sentence thresholds. The final numbers are set after the held-out
 * half of the clips is reviewed. Half A is the even SHA-1 byte of the line
 * file, half B the odd byte.
 */
export const VERDICT_PASST_CORR = 0.2
/**
 * A pitch correlation below this is already «daneben».
 * German, Portuguese and Vietnamese use 0. English uses −0.4: a mild
 * negative contour there is still the sentence, and 0 was marking correct
 * other voices «daneben» too often.
 */
export const VERDICT_DANEBEN_CORR = 0
export const VERDICT_DANEBEN_CORR_EN = -0.4
/** Vietnamese is «daneben» when the pitch correlation is below 0.2. */
export const VERDICT_DANEBEN_CORR_VI = 0.2

export function danebenCorrelation(lang: Lang): number {
  if (lang === 'en') return VERDICT_DANEBEN_CORR_EN
  if (lang === 'vi') return VERDICT_DANEBEN_CORR_VI
  return VERDICT_DANEBEN_CORR
}
/** joe «wifi» against itself marks half its words opposed. Proposed. */
export const VERDICT_OPPOSED_PASST = 0.5
export const VERDICT_OPPOSED_DANEBEN = 0.67
export const VERDICT_ORDER_DANEBEN = 0.5
/**
 * «passt» only while the band sequence is still this file.
 * Silence at both ends is cut first. The sentence then keeps the lower
 * of that cut and the uncut take, so a codec pass that moves the cut
 * does not raise the distance. On half A a padded copy of the same file
 * sits at 0, and an opus pass stays under about 0.17. The nearest wrong
 * line that would otherwise pass is a vais1000 address variant at about
 * 0.224. Proposed.
 */
export const VERDICT_BAND_PASST = 0.2

export type SentenceCheck = {
  /** Pearson of the pitch contour on the DTW path. Null when the tune is level. */
  correlation: number | null
  /** Share of judged words whose tune runs the other way. */
  opposedShare: number
  /**
   * Share of successive words whose DTW user-span still moves forward.
   * Null when fewer than two words can be placed.
   */
  order: number | null
  /** DTW cost of the band sequence. Null when the take has no bands. */
  bands: number | null
  backwards: boolean
}

/**
 * Whether the spoken line is the file.
 *
 * «passt» needs the pitch contour to agree and the band sequence to still be
 * the file. A contour below the language cutoff, a run of opposed words, a
 * word order that folds back, or a reversed take is «daneben». Vietnamese
 * uses 0.2. German and Portuguese use 0. English uses −0.4. Everything else
 * is «teilweise».
 */
export function sentenceVerdict(check: SentenceCheck, lang: Lang = 'de'): BarState {
  if (check.backwards) return 'daneben'
  if (check.order != null && check.order < VERDICT_ORDER_DANEBEN) return 'daneben'
  if (check.correlation != null && check.correlation < danebenCorrelation(lang)) return 'daneben'
  if (check.opposedShare >= VERDICT_OPPOSED_DANEBEN) return 'daneben'
  const orderOk = check.order == null || check.order >= VERDICT_ORDER_DANEBEN
  const soundOk = check.bands == null || check.bands <= VERDICT_BAND_PASST
  const directionOk = check.correlation == null || check.correlation >= VERDICT_PASST_CORR
  if (orderOk && soundOk && directionOk && check.opposedShare <= VERDICT_OPPOSED_PASST) return 'passt'
  return 'teilweise'
}

export type SpeakerGender = 'male' | 'female'

/**
 * German S3 also runs when the take and the file sit inside this many
 * semitones of median pitch. The page does not store a gender, so this
 * gap is what turns S3 on for a learner.
 */
export const S3_PITCH_SEMITONES = 4

/** Absolute gap of two median pitches, in semitones. Missing or silent is null. */
export function medianGapSemitones(modelHz?: number | null, userHz?: number | null): number | null {
  if (modelHz == null || userHz == null || !(modelHz > 0) || !(userHz > 0)) return null
  return Math.abs(12 * Math.log2(userHz / modelHz))
}

/**
 * Semitones of slack around the min/max of the reference voices.
 * A point inside that band still counts as their range.
 */
export const REFERENCE_ENVELOPE_SLACK = 1

function voicedSeries(contour: Contour): number[] {
  const values: number[] = []
  for (const value of contour) if (value != null) values.push(value)
  return values
}

/** Linear resample. The result has `length` points. Too short a series is null. */
function resampleSeries(series: readonly number[], length: number): number[] | null {
  if (series.length < 2 || length < 2) return null
  const out: number[] = []
  for (let index = 0; index < length; index += 1) {
    const at = (index / (length - 1)) * (series.length - 1)
    const left = Math.floor(at)
    const right = Math.min(series.length - 1, left + 1)
    const frac = at - left
    out.push((series[left] ?? 0) * (1 - frac) + (series[right] ?? 0) * frac)
  }
  return out
}

/** Another voice of the same sentence, already in semitones around its own median. */
export type MelodyReference = {
  contour: Contour
  hop: number
  words?: ReadonlyArray<{ start: number; end: number }> | null
}

/** The same fraction of a full-sentence contour. Both ends are inside the contour. */
export function sliceFraction(contour: Contour, startFrac: number, endFrac: number): Contour {
  if (contour.length === 0) return []
  const start = Math.max(0, Math.min(contour.length - 1, Math.floor(startFrac * contour.length)))
  const end = Math.max(start + 1, Math.min(contour.length, Math.ceil(Math.max(startFrac, endFrac) * contour.length)))
  return contour.slice(start, end)
}

function sliceTimes(contour: Contour, hop: number, start: number, end: number): Contour {
  if (!(hop > 0) || contour.length === 0 || !(end > start)) return []
  const frame = Math.max(0, Math.min(contour.length - 1, Math.floor(start / hop)))
  const frameEnd = Math.max(frame + 1, Math.min(contour.length, Math.ceil(end / hop)))
  return contour.slice(frame, frameEnd)
}

/**
 * The user's word against other voices of the same sentence.
 * Every contour is already semitones relative to that speaker's median.
 * A mean distance under `green` to any `others` entry counts.
 * With two or more curves in `envelope`, a point inside their min/max
 * plus REFERENCE_ENVELOPE_SLACK counts as well. One curve has no range.
 */
export function wordMatchesReferences(
  user: Contour,
  others: readonly Contour[],
  green: number,
  envelope: readonly Contour[] = others,
): boolean {
  const voiced = voicedSeries(user)
  if (voiced.length < MIN_WORD_VOICED) return false
  const otherSeries = others
    .map((contour) => resampleSeries(voicedSeries(contour), voiced.length))
    .filter((slice): slice is number[] => slice != null)
  for (const slice of otherSeries) {
    let sum = 0
    for (let index = 0; index < voiced.length; index += 1) sum += Math.abs((voiced[index] ?? 0) - (slice[index] ?? 0))
    if (sum / voiced.length < green) return true
  }
  const bounds = envelope
    .map((contour) => resampleSeries(voicedSeries(contour), voiced.length))
    .filter((slice): slice is number[] => slice != null)
  if (bounds.length < 2) return false
  for (let index = 0; index < voiced.length; index += 1) {
    let low = Infinity
    let high = -Infinity
    for (const slice of bounds) {
      const value = slice[index] ?? 0
      if (value < low) low = value
      if (value > high) high = value
    }
    const point = voiced[index] ?? 0
    if (point < low - REFERENCE_ENVELOPE_SLACK || point > high + REFERENCE_ENVELOPE_SLACK) return false
  }
  return true
}

/**
 * Star count for the repeat screen. Not stored on the score.
 *
 * 3 only when the sentence is «passt» and both bars are «passt».
 * On «passt» and «teilweise», German rule S3 gives 2 when a bar is
 * «passt» and 1 otherwise. S3 runs when the template voice and the
 * speaker are the same known gender, or when the median pitches are
 * within S3_PITCH_SEMITONES. A different gender with a far or missing
 * pitch, and a missing gender with a far or missing pitch, stay on V2:
 * two stars. English and Vietnamese stay at 2. On «daneben», 2 only
 * when a bar is «passt», 1 when the better bar is yellow, otherwise 0.
 * A reversed take is 0.
 *
 * Portuguese reads `content` when it is passed. A spectrum past
 * SPECTRAL_DISTANCE_MAX is at most 1, unless `prosody` is true: the
 * word tunes matched the file or another male voice. A matched tune
 * is at least 2. The same-file band distance does not separate a
 * correct second voice from babble, so the tune match is what keeps a
 * short correct take. Missing bands and a missing `prosody` keep the
 * old count when the spectrum is absent. German, English and
 * Vietnamese ignore the field.
 */
export function starsFromVerdict(
  verdict: BarState,
  melody: BarState | null,
  rhythm: BarState | null,
  backwards = false,
  lang: Lang = 'de',
  genders?: { readonly template?: SpeakerGender | null; readonly user?: SpeakerGender | null } | null,
  pitch?: { readonly modelHz?: number | null; readonly userHz?: number | null } | null,
  content?: { readonly bands?: number | null; readonly prosody?: boolean | null } | null,
): 0 | 1 | 2 | 3 {
  if (backwards) return 0
  const green = [melody, rhythm].filter((bar) => bar === 'passt').length
  const yellow = [melody, rhythm].filter((bar) => bar === 'teilweise').length
  let raw: 0 | 1 | 2 | 3
  if (verdict === 'passt' && green === 2) raw = 3
  else if (verdict === 'daneben') {
    if (green >= 1) raw = 2
    else if (yellow >= 1) raw = 1
    else raw = 0
  } else {
    const template = genders?.template
    const user = genders?.user
    const sameGender = Boolean(template && user && template === user)
    const gap = medianGapSemitones(pitch?.modelHz, pitch?.userHz)
    // log2 of an exact power of two can sit a few ulps over the cut.
    const closePitch = gap != null && gap <= S3_PITCH_SEMITONES + 1e-9
    raw = lang === 'de' && (sameGender || closePitch) ? (green >= 1 ? 2 : 1) : 2
  }
  if (lang !== 'pt-BR') return raw
  const bands = content?.bands
  const hasBands = typeof bands === 'number' && Number.isFinite(bands)
  const offScript = hasBands && bands > SPECTRAL_DISTANCE_MAX['pt-BR']
  const prosody = content?.prosody
  if (prosody === true && raw < 2) return 2
  if (prosody === false && offScript) return raw > 1 ? 1 : raw
  if (prosody == null && offScript) return raw > 1 ? 1 : raw
  if (prosody == null && hasBands && !offScript && (green >= 1 || yellow >= 1) && raw < 2) return 2
  return raw
}

/** Share of successive placed words whose recording span still moves forward. */
export function wordOrderScore(words: ReadonlyArray<{ userStart: number; userEnd: number }> | null): number | null {
  const placed = (words ?? []).filter((word) => word.userEnd > word.userStart)
  if (placed.length < 2) return null
  let forward = 0
  for (let index = 1; index < placed.length; index += 1) {
    if ((placed[index]?.userStart ?? 0) + 0.03 >= (placed[index - 1]?.userStart ?? 0)) forward += 1
  }
  return forward / (placed.length - 1)
}

/**
 * pt-BR word colours use the wide band. The bar is stricter. It does not
 * say «passt» unless the band shape is still the file. A same-speaker
 * impostor is «daneben». On the file itself, a whole-take contour under
 * the old opposed cutoff is «daneben», and one under DIRECTION_MIN is not
 * «passt». de, en and vi keep the bar taken from the word colours.
 */
export function sentenceMelodyBar(
  bar: BarState | null,
  lang: Lang,
  takeCorr: number | null,
  bands: number | null,
): BarState | null {
  if (bar == null || lang !== 'pt-BR') return bar
  if (bands != null && bands > SENTENCE_SAME && bands <= SENTENCE_IMPOSTOR) return 'daneben'
  const onFile = bands == null || bands <= SENTENCE_SAME
  let next = bar
  if (onFile && takeCorr != null && takeCorr < DIRECTION_OPPOSED) next = 'daneben'
  else if (onFile && takeCorr != null && takeCorr < DIRECTION_MIN && next === 'passt') next = 'teilweise'
  if (bands != null && bands > SENTENCE_SAME && next === 'passt') next = 'teilweise'
  return next
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
  /**
   * Bands after leading and trailing silence is cut. The sentence distance
   * uses these when both sides have them. Absent on the synthetic fixtures.
   */
  modelSpeechBands?: readonly (readonly number[])[] | null
  userSpeechBands?: readonly (readonly number[])[] | null
  /**
   * Other voices of the same sentence. Each contour is already semitones
   * relative to that speaker's median. pt-BR only. The selected voice
   * stays `model` and is what the page plays. A word it did not paint
   * green becomes green when it matches one of these, or sits in the
   * range they span together with `model`. Word times, when present,
   * slice that voice. Otherwise the same fraction of the contour is used.
   * A band distance over the language limit does not get that upgrade.
   */
  references?: readonly MelodyReference[] | null
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
    sentenceCheck: null,
    verdict: null,
    melodyFit: null,
    reason: tooShort ? 'short' : fileThin ? 'file' : tooLittleVoice ? 'quiet' : null,
  }
  const lockBands = input.userPlainBands && input.userPlainBands.length > 0 ? input.userPlainBands : input.userBands
  const lockKnown = Boolean(input.modelBands && lockBands && input.modelBands.length > 0 && lockBands.length > 0)
  // Plain bands and the silence-trimmed bands. Opus padding can move one
  // of the two; either one fitting backwards is the file played backwards.
  const bandReversed =
    reversedRecording(input.modelBands, lockBands) ||
    reversedRecording(input.modelSpeechBands, input.userSpeechBands)
  if (tooShort) return empty
  if (fileThin) return { ...empty, tooLittleVoice: false, reason: 'file' }
  // A reversed file can lose its tracked pitch. That is still «unklar», not a quiet take.
  if (bandReversed) {
    return {
      ...empty,
      tooLittleVoice: false,
      unclear: true,
      reason: 'unclear',
      verdict: 'daneben',
      sentenceCheck: { correlation: null, opposedShare: 1, order: null, bands: null, backwards: true },
    }
  }
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
      verdict: reversed ? 'daneben' : null,
      sentenceCheck: reversed
        ? { correlation: forward, opposedShare: 1, order: null, bands: null, backwards: true }
        : null,
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
  const rhythmAlign = rhythmPath(input.modelBands, input.userBands, model.length, heard.length, modelSpan, userSpan)
  const fullBands =
    input.modelBands && lockBands && input.modelBands.length > 0 && lockBands.length > 0
      ? bandDistance(input.modelBands, lockBands)
      : null
  const spokenBands =
    input.modelSpeechBands &&
    input.userSpeechBands &&
    input.modelSpeechBands.length > 0 &&
    input.userSpeechBands.length > 0
      ? bandDistance(input.modelSpeechBands, input.userSpeechBands)
      : null
  // Silence at the ends moves the window, so the trimmed distance is the one
  // that still matches the file. A codec pass can move the energy cut, and
  // then the untrimmed distance is the lower one. The sentence uses the lower.
  const takeBands = fullBands == null ? spokenBands : spokenBands == null ? fullBands : Math.min(fullBands, spokenBands)
  const wrongWords = takeBands != null && takeBands > SPECTRAL_DISTANCE_MAX[input.lang]
  const referenceContours = input.lang === 'pt-BR' && !wrongWords ? (input.references ?? []).filter((item) => item.contour.length > 0) : []
  const acceptsReference = (userSlice: Contour, frame: number, frameEnd: number, wordIndex: number): boolean => {
    if (referenceContours.length === 0 || model.length === 0) return false
    const modelSlice = model.slice(frame, frameEnd)
    const others = referenceContours.map((reference) => {
      const timed = reference.words?.[wordIndex]
      if (timed && timed.end > timed.start) return sliceTimes(reference.contour, reference.hop, timed.start, timed.end)
      return sliceFraction(reference.contour, frame / model.length, frameEnd / model.length)
    })
    return wordMatchesReferences(userSlice, others, MELODY_LIMITS['pt-BR'].green, [modelSlice, ...others])
  }
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
    const aligned = rangeOnPath(rhythmAlign, frame, frameEnd)
    const green = MELODY_LIMITS[input.lang].green
    const matched = scorable && word.end > word.start ? matchLocal(model, heard, frame, frameEnd, modelSpan, userSpan, green) : null
    const plainStart = mappedFrame(frame, modelSpan, userSpan)
    const plainEnd = mappedFrame(Math.max(frame, frameEnd - 1), modelSpan, userSpan)
    const userFrame = aligned ? aligned.userStart : Math.max(0, Math.round(Math.min(plainStart, plainEnd)))
    const userFrameEnd = aligned
      ? Math.min(heard.length, Math.max(userFrame + 1, aligned.userEnd))
      : Math.min(heard.length, Math.max(userFrame + 1, Math.round(Math.max(plainStart, plainEnd)) + 1))
    const fromPath = aligned ? ratioFromRange(aligned, globalRatio, modelHop, userHop) : null
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
      // The pitch window missed, but the path still times the word. A short
      // vowel that the local search stepped over keeps a rhythm colour.
      // A stretch of the take with no voice stays grey: the path still
      // walks through a gap, and that gap is not a spoken word.
      let userVoiced = 0
      for (let index = userFrame; index < userFrameEnd; index += 1) if (heard[index] != null) userVoiced += 1
      // A rhythm colour with no melody is only kept when the path agrees
      // with the file. A warped path and a missed pitch window used to
      // paint the word yellow; that word stays grey.
      const reliable = fromPath != null && fromPath >= RHYTHM_GREEN_MIN && fromPath <= RHYTHM_GREEN_MAX
      const missedSlice = heard.slice(Math.min(userFrame, heard.length), Math.min(heard.length, userFrameEnd))
      if (scorable && word.end > word.start && acceptsReference(missedSlice, frame, frameEnd, wordIndex)) {
        const rhythm = reliable && userVoiced >= MIN_WORD_VOICED && fromPath != null ? rhythmBand(fromPath) : null
        const melody: Band = 'green'
        return {
          ...base,
          color: rhythm == null ? melody : worseBand(melody, rhythm),
          melody,
          rhythm,
          rawRatio: fromPath,
          userShape: describeShape(missedSlice),
        }
      }
      if (!scorable || !reliable || userVoiced < MIN_WORD_VOICED) return base
      const rhythm = rhythmBand(fromPath)
      return { ...base, color: rhythm, rhythm, rawRatio: fromPath }
    }
    // pt-BR reads direction on the DTW path, so a pause in a different place
    // does not flip the sign. de, en and vi keep the linear path and the
    // first-version cutoff: a mild opposite contour is already red there.
    const pitchPath = input.lang === 'pt-BR' ? (rhythmAlign ?? path) : path
    const pitchCorr = wordCorrelation(model, heard, pitchPath, frame, frameEnd)
    const modelShape = describeShape(model.slice(frame, frameEnd))
    const userSlice = heard.slice(Math.min(userFrame, heard.length), Math.min(heard.length, userFrameEnd))
    const userShape = describeShape(userSlice)
    const direction = wordDirection(pitchCorr, modelShape, userShape)
    directions.push(direction)
    const modelRange = voicedRange(model.slice(frame, frameEnd)) ?? 0
    const userRange = voicedRange(userSlice) ?? 0
    // A null correlation is too little movement to judge.
    const follows = pitchCorr != null && pitchCorr >= DIRECTION_MIN && userRange >= MOVING_RANGE
    let melody = melodyBand(matched.mean, input.lang)
    if (input.lang === 'pt-BR') {
      // Wide word colours. Red from direction only for a clear turn.
      const clearTurn = pitchCorr != null && pitchCorr < DIRECTION_CLEAR && modelRange >= DIRECTION_RANGE
      if (clearTurn) melody = 'red'
      else if (pitchCorr != null && pitchCorr < DIRECTION_MIN && melody === 'green') melody = 'yellow'
    } else if (pitchCorr != null && pitchCorr < DIRECTION_OPPOSED) {
      melody = 'red'
    } else if (pitchCorr != null && pitchCorr < DIRECTION_MIN && melody === 'green') {
      melody = 'yellow'
    }
    if (scorable && modelRange >= MOVING_RANGE && pitchCorr != null && !follows && melody === 'green') {
      melody = 'yellow'
    }
    if (melody !== 'green' && acceptsReference(userSlice, frame, frameEnd, wordIndex)) melody = 'green'
    // The path says how many recording frames this word took. The loud span
    // of a linearly mapped window is only the fallback, and the scale is
    // only the fallback after that: the scale never leaves the green band.
    const rawRatio =
      fromPath ??
      wordRhythmRatio(
        word.start,
        word.end,
        matched.scale,
        globalRatio,
        modelSpan,
        userSpan,
        modelHop,
        userHop,
        modelEnergy,
        userEnergy,
      )
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
  // A rhythm colour from the path is not a melody. When every local
  // window missed, the whole-path distance still colours the melody.
  const anyMelody = words.some((word) => word.melody != null)
  const scoredWords =
    anyMelody || meanDistance == null
      ? words
      : words.map((word) => {
          if (!word.scorable) return word
          const melody = melodyBand(meanDistance, input.lang)
          const aligned = rangeOnPath(rhythmAlign, word.modelFrame, word.modelFrameEnd)
          const fromPath = aligned ? ratioFromRange(aligned, globalRatio, modelHop, userHop) : null
          const rawRatio =
            fromPath ?? wordRhythmRatio(word.start, word.end, 1, globalRatio, modelSpan, userSpan, modelHop, userHop, modelEnergy, userEnergy)
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
    const known = directions.filter((direction) => direction !== 'unknown')
    const opposedShare = known.length === 0 ? 1 : known.filter((direction) => direction === 'opposed').length / known.length
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
      sentenceCheck: {
        correlation: forward,
        opposedShare,
        order: wordOrderScore(scoredWords),
        bands: null,
        backwards: true,
      },
      verdict: 'daneben',
      melodyFit: null,
      reason: 'unclear',
    }
  }
  const alignedCorr = contourCorrelation(model, heard, rhythmAlign ?? path)
  const knownDirections = directions.filter((direction) => direction !== 'unknown')
  const opposedShare =
    knownDirections.length === 0 ? 0 : knownDirections.filter((direction) => direction === 'opposed').length / knownDirections.length
  const sentenceCheck: SentenceCheck = {
    correlation: alignedCorr,
    opposedShare,
    order: wordOrderScore(scoredWords),
    bands: takeBands,
    backwards: false,
  }
  const verdict = sentenceVerdict(sentenceCheck, input.lang)
  const melodyBar = sentenceMelodyBar(melodyColours, input.lang, forward, takeBands)
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
    sentenceCheck,
    verdict: hasColour ? verdict : null,
    melodyFit: input.lang === 'pt-BR' && hasColour ? melodyColours === 'passt' : null,
    reason: hasColour && !fewWords ? null : 'few',
  }
}
