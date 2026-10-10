import { describe, expect, it } from 'vitest'
import { contourFromSamples, describeShape, dtwDistance, voicedValues } from './contour'

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
})
