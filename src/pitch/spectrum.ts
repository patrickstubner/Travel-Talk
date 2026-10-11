import { samplesForAnalysis } from './contour'

const FRAME = 2048
const MEL_BANDS = 26
const MFCC_COUNT = 12

const hann = new Float32Array(FRAME)
for (let index = 0; index < FRAME; index += 1) hann[index] = 0.5 - 0.5 * Math.cos((2 * Math.PI * index) / (FRAME - 1))

/** A shifted imitation is compared again at ±3 semitones. The closer fit wins. */
const WARPS = [-3, 3]
/** Below this, the unshifted shape already matches. The other slides are skipped. */
const CLOSE_ENOUGH = 1.15

/**
 * Twelve MFCCs per analysis frame, without the loudness coefficient.
 * The grid matches `contourFromSamples`. Silence is an empty vector.
 * `warpSemitones` slides the mel filters, so a take a few semitones off
 * can still show the same consonants.
 */
export function bandShape(input: Float32Array, rate: number, warpSemitones = 0): number[][] {
  const prepared = framePowers(input, rate)
  if (!prepared) return []
  return shapeFromPowers(prepared.powers, prepared.sampleRate, warpSemitones)
}

/**
 * The user bands, slid by a few semitones, that sit closest to the model.
 * One spectrum is shared. Missing model bands stay at the unshifted shape.
 */
export function closestBands(
  modelBands: readonly (readonly number[])[] | null | undefined,
  input: Float32Array,
  rate: number,
): number[][] {
  const prepared = framePowers(input, rate)
  if (!prepared) return []
  if (!modelBands || modelBands.length === 0) return shapeFromPowers(prepared.powers, prepared.sampleRate, 0)
  let best = shapeFromPowers(prepared.powers, prepared.sampleRate, 0)
  let bestDistance = bandDistance(modelBands, best) ?? Number.POSITIVE_INFINITY
  if (bestDistance <= CLOSE_ENOUGH) return best
  for (const warp of WARPS) {
    const bands = shapeFromPowers(prepared.powers, prepared.sampleRate, warp)
    const distance = bandDistance(modelBands, bands)
    if (distance != null && distance < bestDistance) {
      best = bands
      bestDistance = distance
    }
  }
  return best
}

function framePowers(input: Float32Array, rate: number): { powers: Array<Float32Array | null>; sampleRate: number } | null {
  const prepared = samplesForAnalysis(input, rate)
  const samples = prepared.samples
  const sampleRate = prepared.sampleRate
  if (samples.length < FRAME) return null
  const hop = Math.max(1, Math.round(sampleRate * 0.01))
  const real = new Float32Array(FRAME)
  const imag = new Float32Array(FRAME)
  const powers: Array<Float32Array | null> = []
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

function shapeFromPowers(powers: readonly (Float32Array | null)[], sampleRate: number, warpSemitones: number): number[][] {
  const filters = melFilters(sampleRate, warpSemitones)
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

function melFilters(sampleRate: number, warpSemitones = 0): MelBin[][] {
  const key = sampleRate + warpSemitones / 100
  const cached = filterCache.get(key)
  if (cached) return cached
  const scale = 2 ** (warpSemitones / 12)
  const low = hzToMel(80)
  const high = hzToMel(Math.min(6500, sampleRate / 2 - 100))
  const points = Array.from({ length: MEL_BANDS + 2 }, (_, index) => low + ((high - low) * index) / (MEL_BANDS + 1))
  const bins = points.map((mel) => Math.floor(((FRAME / 2) * melToHz(mel) * scale) / (sampleRate / 2)))
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
export function bandDistance(modelBands: readonly (readonly number[])[], userBands: readonly (readonly number[])[]): number | null {
  const model = subsample(deltas(center(modelBands.filter((frame) => frame.length > 0))), 160)
  const user = subsample(deltas(center(userBands.filter((frame) => frame.length > 0))), 160)
  if (model.length < 8 || user.length < 8) return null
  const rows = model.length
  const cols = user.length
  const inf = 1e9
  let previous = new Float64Array(cols + 1).fill(inf)
  let current = new Float64Array(cols + 1).fill(inf)
  previous[0] = 0
  for (let i = 1; i <= rows; i += 1) {
    current[0] = inf
    const left = model[i - 1] ?? []
    for (let j = 1; j <= cols; j += 1) {
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

/** Subtract the utterance mean so a small formant shift does not look like new words. */
function center(frames: readonly (readonly number[])[]): (readonly number[])[] {
  if (frames.length === 0) return []
  const width = frames[0]?.length ?? 0
  const mean = new Array<number>(width).fill(0)
  for (const frame of frames) {
    for (let index = 0; index < width; index += 1) mean[index] = (mean[index] ?? 0) + (frame[index] ?? 0)
  }
  for (let index = 0; index < width; index += 1) mean[index] = (mean[index] ?? 0) / frames.length
  return frames.map((frame) => frame.map((value, index) => value - (mean[index] ?? 0)))
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
