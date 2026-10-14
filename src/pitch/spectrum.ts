import { centerDelayFrames, samplesForAnalysis } from './contour'

const FRAME = 2048
const MEL_BANDS = 26
const MFCC_COUNT = 12

const hann = new Float32Array(FRAME)
for (let index = 0; index < FRAME; index += 1) hann[index] = 0.5 - 0.5 * Math.cos((2 * Math.PI * index) / (FRAME - 1))

/**
 * Vocal-tract length, about ±20 % around the file. Steps of 4 % so a
 * different speaker is not stuck on the ±3-semitone grid of a pitch shift.
 */
const WARP_SCALES = [0.8, 0.84, 0.88, 0.92, 0.96, 1.04, 1.08, 1.12, 1.16, 1.2]
/**
 * An unshifted distance below this is already the same shape. The other
 * scales are skipped. The value is on the variance-normalised scale.
 */
const CLOSE_ENOUGH = 0.35
/**
 * Skip the frequency warp when the unshifted shape already fits the file
 * better backwards by this much. Same gap as `REVERSE_BAND_GAP` in
 * feedback.ts. feedback imports this module, so the number lives here too.
 * feedback.test.ts checks the two stay equal.
 */
export const WARP_REVERSE_GAP = 0.12
/**
 * A sample quieter than this share of the peak is silence. 0.08, the
 * fraction that moves a timed span, cuts a quiet word such as «Help!»
 * down to a couple of frames, and the pause then has nothing left to
 * compare. 0.02 still drops digital silence and keeps that word.
 */
const SILENCE_FRACTION = 0.02

/**
 * Drop leading and trailing silence. A 10 ms hop finds the loud region,
 * then the cut moves to the first and last sample that still reach
 * `SILENCE_FRACTION` of the peak. Cutting at the hop would leave a
 * fraction of a window of silence and shift every band frame.
 */
export function trimSilence(input: Float32Array, rate: number): Float32Array {
  if (input.length === 0 || !Number.isFinite(rate) || rate <= 0) return input
  const hop = Math.max(1, Math.round(rate * 0.01))
  if (input.length < hop) return input
  let peak = 0
  for (let index = 0; index < input.length; index += 1) {
    const value = Math.abs(input[index] ?? 0)
    if (value > peak) peak = value
  }
  if (!(peak > 1e-8)) return input
  const gate = peak * SILENCE_FRACTION
  const hold = hop
  const loud = (from: number): boolean => {
    if (from < 0 || from + hold > input.length) return false
    let sum = 0
    const end = from + hold
    for (let cursor = from; cursor < end; cursor += 1) {
      const sample = input[cursor] ?? 0
      sum += sample * sample
    }
    return Math.sqrt(sum / hold) >= gate
  }
  let start = 0
  while (start + hold <= input.length && !loud(start)) start += hold
  if (start + hold > input.length) return input
  const startLimit = Math.min(input.length, start + hold)
  while (start < startLimit && Math.abs(input[start] ?? 0) < gate) start += 1
  let end = input.length
  while (end - hold >= start && !loud(end - hold)) end -= hold
  const endLimit = Math.max(start, end - hold)
  while (end > endLimit && Math.abs(input[end - 1] ?? 0) < gate) end -= 1
  if (end - start < hold) return input
  if (start === 0 && end === input.length) return input
  const trimmed = new Float32Array(end - start)
  trimmed.set(input.subarray(start, end))
  return trimmed
}

/**
 * Twelve MFCCs per analysis frame, without the loudness coefficient.
 * The grid matches `contourFromSamples`. Silence is an empty vector.
 * `warpScale` stretches the mel filters. 1 leaves them on the file's frequencies.
 */
export function bandShape(input: Float32Array, rate: number, warpScale = 1): number[][] {
  const prepared = framePowers(input, rate)
  if (!prepared) return []
  return shapeFromPowers(prepared.powers, prepared.sampleRate, warpScale)
}

/**
 * The user bands, slid by a few semitones, that sit closest to the model.
 * One spectrum is shared. Missing model bands stay at the unshifted shape.
 */
export function closestBands(
  modelBands: readonly (readonly number[])[] | null | undefined,
  input: Float32Array,
  rate: number,
): { closest: number[][]; plain: number[][] } {
  const prepared = framePowers(input, rate)
  if (!prepared) return { closest: [], plain: [] }
  const plain = shapeFromPowers(prepared.powers, prepared.sampleRate, 1)
  if (!modelBands || modelBands.length === 0) return { closest: shapeFromPowers(prepared.powers, prepared.sampleRate, 0), plain }
  let best = plain
  let bestDistance = bandDistance(modelBands, best, 48) ?? Number.POSITIVE_INFINITY
  // A reversed take is closer to the file flipped in time. Warping it
  // toward the forward file shrinks that gap, and the reverse lock then
  // misses it after Opus. The comparison uses the same DTW limit as
  // `reversedRecording` (the default, not the 48-frame warp search).
  const forwardFull = bandDistance(modelBands, plain)
  const backwardFull = bandDistance([...modelBands].reverse(), plain)
  if (forwardFull != null && backwardFull != null && backwardFull + WARP_REVERSE_GAP < forwardFull) return { closest: plain, plain }
  if (bestDistance <= CLOSE_ENOUGH) return { closest: best, plain }
  for (const scale of WARP_SCALES) {
    const bands = shapeFromPowers(prepared.powers, prepared.sampleRate, scale)
    const distance = bandDistance(modelBands, bands, 48)
    if (distance != null && distance < bestDistance) {
      best = bands
      bestDistance = distance
    }
  }
  return { closest: best, plain }
}

function framePowers(input: Float32Array, rate: number): { powers: Array<Float32Array | null>; sampleRate: number } | null {
  const prepared = samplesForAnalysis(input, rate)
  const samples = prepared.samples
  const sampleRate = prepared.sampleRate
  if (samples.length < FRAME) return null
  const hop = Math.max(1, Math.round(sampleRate * 0.01))
  const real = new Float32Array(FRAME)
  const imag = new Float32Array(FRAME)
  const powers: Array<Float32Array | null> = Array.from({ length: centerDelayFrames(hop) }, () => null)
  for (let index = 0; index + FRAME < samples.length; index += hop) {
    for (let cursor = 0; cursor < FRAME; cursor += 1) {
      real[cursor] = (samples[index + cursor] ?? 0) * (hann[cursor] ?? 0)
      imag[cursor] = 0
    }
    transform(real, imag)
    const power = new Float32Array(FRAME / 2)
    let total = 0
    for (let bin = 0; bin < power.length; bin += 1) {
      const re = real[bin] ?? 0
      const im = imag[bin] ?? 0
      const value = re * re + im * im
      power[bin] = value
      total += value
    }
    powers.push(total > 1e-6 ? power : null)
  }
  return { powers, sampleRate }
}

function shapeFromPowers(powers: readonly (Float32Array | null)[], sampleRate: number, warpScale: number): number[][] {
  const filters = melFilters(sampleRate, warpScale)
  return powers.map((power) => {
    if (!power) return []
    const mel = filters.map((filter) => {
      let sum = 0
      for (const { bin, weight } of filter) sum += weight * (power[bin] ?? 0)
      return Math.log(sum + 1e-10)
    })
    return mfcc(mel)
  })
}

type MelBin = { bin: number; weight: number }

function melFilters(sampleRate: number, warpScale = 1): MelBin[][] {
  const key = sampleRate * 1000 + Math.round(warpScale * 1000)
  const cached = filterCache.get(key)
  if (cached) return cached
  const low = hzToMel(80)
  const high = hzToMel(Math.min(6500, sampleRate / 2 - 100))
  const points = Array.from({ length: MEL_BANDS + 2 }, (_, index) => low + ((high - low) * index) / (MEL_BANDS + 1))
  const bins = points.map((mel) => Math.floor(((FRAME / 2) * melToHz(mel) * warpScale) / (sampleRate / 2)))
  const filters = Array.from({ length: MEL_BANDS }, (_, mel) => {
    const weights: MelBin[] = []
    const left = bins[mel] ?? 0
    const mid = bins[mel + 1] ?? 0
    const right = bins[mel + 2] ?? 0
    for (let bin = left; bin < mid; bin += 1) {
      const weight = mid === left ? 0 : (bin - left) / (mid - left)
      if (weight > 0) weights.push({ bin, weight })
    }
    for (let bin = mid; bin < right; bin += 1) {
      const weight = right === mid ? 0 : (right - bin) / (right - mid)
      if (weight > 0) weights.push({ bin, weight })
    }
    return weights
  })
  filterCache.set(key, filters)
  return filters
}

const filterCache = new Map<number, MelBin[][]>()

function hzToMel(hz: number): number {
  return 2595 * Math.log10(1 + hz / 700)
}

function melToHz(mel: number): number {
  return 700 * (10 ** (mel / 2595) - 1)
}

function mfcc(mel: readonly number[]): number[] {
  const count = mel.length
  const coeffs: number[] = []
  for (let k = 1; k <= MFCC_COUNT; k += 1) {
    let sum = 0
    for (let n = 0; n < count; n += 1) sum += (mel[n] ?? 0) * Math.cos((Math.PI * k * (n + 0.5)) / count)
    coeffs.push(sum)
  }
  return coeffs
}

/**
 * Average DTW cost of the band shape, 0 for the same recording and higher
 * when the sequence of sounds does not match. Independent of the pitch path.
 */
export function bandDistance(
  modelBands: readonly (readonly number[])[],
  userBands: readonly (readonly number[])[],
  limit = 160,
  minFrames = 8,
): number | null {
  const model = subsample(deltas(speakerNorm(modelBands.filter((frame) => frame.length > 0))), limit)
  const user = subsample(deltas(speakerNorm(userBands.filter((frame) => frame.length > 0))), limit)
  if (model.length < minFrames || user.length < minFrames) return null
  const rows = model.length
  const cols = user.length
  const band = Math.max(8, Math.ceil(Math.max(rows, cols) * 0.45))
  const inf = 1e9
  let previous = new Float64Array(cols + 1).fill(inf)
  let current = new Float64Array(cols + 1).fill(inf)
  previous[0] = 0
  for (let i = 1; i <= rows; i += 1) {
    current.fill(inf)
    const left = model[i - 1] ?? []
    const center = Math.round((i * cols) / rows)
    const from = Math.max(1, center - band)
    const to = Math.min(cols, center + band)
    for (let j = from; j <= to; j += 1) {
      const cost = euclid(left, user[j - 1] ?? [])
      const diag = previous[j - 1] ?? inf
      const up = previous[j] ?? inf
      const stay = current[j - 1] ?? inf
      current[j] = cost + Math.min(diag, up, stay)
    }
    const swap = previous
    previous = current
    current = swap
  }
  const total = previous[cols] ?? inf
  if (total >= inf / 2) return null
  return total / (rows + cols)
}

function deltas(frames: readonly (readonly number[])[]): (readonly number[])[] {
  const out: number[][] = []
  for (let index = 1; index < frames.length; index += 1) {
    const previous = frames[index - 1] ?? []
    const current = frames[index] ?? []
    if (previous.length === 0 || current.length === 0) continue
    out.push(current.map((value, band) => value - (previous[band] ?? 0)))
  }
  return out
}

/**
 * Per-coefficient mean and variance. A different mouth and microphone
 * change the level of each coefficient; the sequence of sounds should not.
 */
function speakerNorm(frames: readonly (readonly number[])[]): (readonly number[])[] {
  if (frames.length === 0) return []
  const width = frames[0]?.length ?? 0
  const mean = new Array<number>(width).fill(0)
  for (const frame of frames) {
    for (let index = 0; index < width; index += 1) mean[index] = (mean[index] ?? 0) + (frame[index] ?? 0)
  }
  for (let index = 0; index < width; index += 1) mean[index] = (mean[index] ?? 0) / frames.length
  const variance = new Array<number>(width).fill(0)
  for (const frame of frames) {
    for (let index = 0; index < width; index += 1) {
      const delta = (frame[index] ?? 0) - (mean[index] ?? 0)
      variance[index] = (variance[index] ?? 0) + delta * delta
    }
  }
  const scale = variance.map((value) => {
    const deviation = Math.sqrt(value / frames.length)
    return deviation < 1e-3 ? 0 : 1 / deviation
  })
  return frames.map((frame) => frame.map((value, index) => ((value ?? 0) - (mean[index] ?? 0)) * (scale[index] ?? 0)))
}

function subsample(frames: readonly (readonly number[])[], limit: number): (readonly number[])[] {
  if (frames.length <= limit) return [...frames]
  const step = frames.length / limit
  const out: (readonly number[])[] = []
  for (let index = 0; index < limit; index += 1) out.push(frames[Math.min(frames.length - 1, Math.floor(index * step))] ?? [])
  return out
}

function euclid(left: readonly number[], right: readonly number[]): number {
  let sum = 0
  const count = Math.max(left.length, right.length)
  for (let index = 0; index < count; index += 1) {
    const delta = (left[index] ?? 0) - (right[index] ?? 0)
    sum += delta * delta
  }
  return Math.sqrt(sum)
}

/** In-place radix-2 FFT. `real` and `imag` have the same power-of-two length. */
function transform(real: Float32Array, imag: Float32Array): void {
  const n = real.length
  for (let i = 1, j = 0; i < n; i += 1) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      const swapReal = real[i] ?? 0
      real[i] = real[j] ?? 0
      real[j] = swapReal
      const swapImag = imag[i] ?? 0
      imag[i] = imag[j] ?? 0
      imag[j] = swapImag
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const angle = (-2 * Math.PI) / len
    const stepReal = Math.cos(angle)
    const stepImag = Math.sin(angle)
    for (let i = 0; i < n; i += len) {
      let turnReal = 1
      let turnImag = 0
      const half = len >> 1
      for (let k = 0; k < half; k += 1) {
        const even = i + k
        const odd = even + half
        const oddReal = real[odd] ?? 0
        const oddImag = imag[odd] ?? 0
        const productReal = turnReal * oddReal - turnImag * oddImag
        const productImag = turnReal * oddImag + turnImag * oddReal
        const evenReal = real[even] ?? 0
        const evenImag = imag[even] ?? 0
        real[odd] = evenReal - productReal
        imag[odd] = evenImag - productImag
        real[even] = evenReal + productReal
        imag[even] = evenImag + productImag
        const nextReal = turnReal * stepReal - turnImag * stepImag
        turnImag = turnReal * stepImag + turnImag * stepReal
        turnReal = nextReal
      }
    }
  }
}
