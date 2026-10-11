import { PitchDetector } from 'pitchy'

export type Contour = Array<number | null>

const FRAME = 2048
export const ANALYSIS_RATE = 16000

export function hopSeconds(sampleRate: number): number {
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) return 0.01
  return Math.max(1, Math.round(sampleRate * 0.01)) / sampleRate
}

/** Average bins down to 16 kHz. A rate already at or under that stays as it is. */
export function samplesForAnalysis(samples: Float32Array, sampleRate: number): { samples: Float32Array; sampleRate: number } {
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) return { samples, sampleRate: ANALYSIS_RATE }
  if (sampleRate <= ANALYSIS_RATE * 1.01) return { samples, sampleRate }
  const ratio = sampleRate / ANALYSIS_RATE
  const length = Math.max(0, Math.floor(samples.length / ratio))
  const out = new Float32Array(length)
  for (let index = 0; index < length; index += 1) {
    const start = Math.floor(index * ratio)
    const end = Math.min(samples.length, Math.max(start + 1, Math.floor((index + 1) * ratio)))
    let sum = 0
    let count = 0
    for (let cursor = start; cursor < end; cursor += 1) {
      sum += samples[cursor] ?? 0
      count += 1
    }
    out[index] = count > 0 ? sum / count : 0
  }
  return { samples: out, sampleRate: ANALYSIS_RATE }
}

/** Hop of the contour `contourFromSamples` actually writes. */
export function analysisHop(sampleRate: number): number {
  return hopSeconds(samplesForAnalysis(new Float32Array(0), sampleRate).sampleRate)
}

export function contourFromSamples(input: Float32Array, rate: number): Contour {
  const prepared = samplesForAnalysis(input, rate)
  const samples = prepared.samples
  const sampleRate = prepared.sampleRate
  if (samples.length < FRAME) return []
  const detector = PitchDetector.forFloat32Array(FRAME)
  detector.clarityThreshold = 0.8
  detector.minVolumeDecibels = -45
  const hop = Math.max(1, Math.round(sampleRate * 0.01))
  const frame = new Float32Array(FRAME)
  const pitches: Contour = []
  for (let index = 0; index + FRAME < samples.length; index += hop) {
    frame.set(samples.subarray(index, index + FRAME))
    const [hz, clarity] = detector.findPitch(frame, sampleRate)
    if (clarity >= 0.8 && hz >= 70 && hz <= 450) pitches.push(hz)
    else pitches.push(null)
  }
  const voiced = pitches.filter((value): value is number => value != null).sort((a, b) => a - b)
  if (voiced.length < 5) return pitches.map(() => null)
  const median = voiced[Math.floor(voiced.length / 2)] ?? 1
  const semis = pitches.map((value) => (value == null ? null : 12 * Math.log2(value / median)))
  return medianFilter(semis, 5)
}

function medianFilter(values: Contour, width: number): Contour {
  const half = Math.floor(width / 2)
  return values.map((value, index) => {
    if (value == null) return null
    const window: number[] = []
    for (let cursor = index - half; cursor <= index + half; cursor += 1) {
      const sample = values[cursor]
      if (sample != null) window.push(sample)
    }
    if (window.length === 0) return null
    window.sort((a, b) => a - b)
    return window[Math.floor(window.length / 2)] ?? null
  })
}

export function voicedValues(contour: Contour): number[] {
  return contour.filter((value): value is number => value != null)
}

export type ShapeName = 'level' | 'rising' | 'falling' | 'dipping' | 'unknown'

export function describeShape(contour: Contour): ShapeName {
  const values = voicedValues(contour)
  if (values.length < 5) return 'unknown'
  const start = average(values.slice(0, 3))
  const end = average(values.slice(-3))
  let min = values[0] ?? 0
  for (const value of values) if (value < min) min = value
  const drops = start - min > 1.2
  const risesAgain = end - min > 1.2 && end < start + 0.8
  if (drops && risesAgain) return 'dipping'
  if (end - start > 1.4) return 'rising'
  if (start - end > 1.4) return 'falling'
  return 'level'
}

function average(values: number[]): number {
  const total = values.reduce((sum, value) => sum + value, 0)
  return total / values.length
}

export function dtwDistance(left: number[], right: number[]): number | null {
  if (left.length < 2 || right.length < 2) return null
  const rows = left.length
  const cols = right.length
  const inf = 1e12
  const grid: number[][] = Array.from({ length: rows + 1 }, () => new Array<number>(cols + 1).fill(inf))
  const origin = grid[0]
  if (origin) origin[0] = 0
  for (let i = 1; i <= rows; i += 1) {
    for (let j = 1; j <= cols; j += 1) {
      const cost = Math.abs((left[i - 1] ?? 0) - (right[j - 1] ?? 0))
      const stay = grid[i - 1]?.[j] ?? inf
      const skip = grid[i]?.[j - 1] ?? inf
      const diag = grid[i - 1]?.[j - 1] ?? inf
      const row = grid[i]
      if (row) row[j] = cost + Math.min(stay, skip, diag)
    }
  }
  const total = grid[rows]?.[cols]
  if (total == null || total >= inf) return null
  return total / (rows + cols)
}

export function mixToMono(buffer: AudioBuffer): Float32Array {
  const length = buffer.length
  const mixed = new Float32Array(length)
  const channels = buffer.numberOfChannels
  for (let channel = 0; channel < channels; channel += 1) {
    const data = buffer.getChannelData(channel)
    for (let index = 0; index < length; index += 1) mixed[index] = (mixed[index] ?? 0) + (data[index] ?? 0) / channels
  }
  return mixed
}
