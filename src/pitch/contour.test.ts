import { describe, expect, it } from 'vitest'
import { ANALYSIS_RATE, contourFromSamples, describeShape, dtwDistance, samplesForAnalysis, voicedValues } from './contour'

function tone(startHz: number, endHz: number, seconds = 1.6): Float32Array {
  const sampleRate = 16000
  const length = Math.floor(sampleRate * seconds)
  const samples = new Float32Array(length)
  let phase = 0
  for (let index = 0; index < length; index += 1) {
    const hz = startHz + (endHz - startHz) * (index / length)
    phase += (2 * Math.PI * hz) / sampleRate
    samples[index] = Math.sin(phase)
  }
  return samples
}

describe('pitch contour', () => {
  it('reads a steady sine near its own median', () => {
    const contour = contourFromSamples(tone(220, 220), 16000)
    const voiced = voicedValues(contour)
    expect(voiced.length).toBeGreaterThan(20)
    const mean = voiced.reduce((sum, value) => sum + value, 0) / voiced.length
    expect(Math.abs(mean)).toBeLessThan(0.6)
    expect(describeShape(contour)).toBe('level')
  })

  it('marks a rising chirp and a zero distance for the same curve', () => {
    const rising = contourFromSamples(tone(110, 280), 16000)
    expect(describeShape(rising)).toBe('rising')
    const values = voicedValues(rising)
    const distance = dtwDistance(values, values)
    expect(distance).not.toBeNull()
    expect(distance ?? 1).toBeLessThan(0.05)
  })

  it('downsamples to 16 kHz before a short 48 kHz buffer can grow a frame', () => {
    const samples = new Float32Array(4000)
    for (let index = 0; index < samples.length; index += 1) samples[index] = Math.sin((2 * Math.PI * 220 * index) / 48000)
    const prepared = samplesForAnalysis(samples, 48000)
    expect(prepared.sampleRate).toBe(ANALYSIS_RATE)
    expect(prepared.samples.length).toBeLessThan(2048)
    expect(contourFromSamples(samples, 48000)).toEqual([])
    const second = new Float32Array(48000)
    for (let index = 0; index < second.length; index += 1) {
      const hz = 140 + (160 * index) / second.length
      second[index] = Math.sin((2 * Math.PI * hz * index) / 48000)
    }
    expect(voicedValues(contourFromSamples(second, 48000)).length).toBeGreaterThan(20)
  })
})
