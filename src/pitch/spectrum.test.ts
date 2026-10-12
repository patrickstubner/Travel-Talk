import { describe, expect, it } from 'vitest'
import { bandDistance, bandShape } from './spectrum'

function tone(hz: number, seconds = 0.5): Float32Array {
  const rate = 16000
  const length = Math.floor(rate * seconds)
  const samples = new Float32Array(length)
  let phase = 0
  for (let index = 0; index < length; index += 1) {
    phase += (2 * Math.PI * hz) / rate
    samples[index] = Math.sin(phase) * 0.8
  }
  return samples
}

describe('band shape', () => {
  it('matches a recording to itself and not to a sweeping tone', () => {
    const steady = bandShape(tone(180), 16000)
    const length = Math.floor(16000 * 0.5)
    const sweep = new Float32Array(length)
    let phase = 0
    for (let index = 0; index < length; index += 1) {
      const hz = 200 + 1600 * (index / length)
      phase += (2 * Math.PI * hz) / 16000
      sweep[index] = Math.sin(phase) * 0.8
    }
    const moving = bandShape(sweep, 16000)
    expect(bandDistance(steady, steady) ?? 1).toBeLessThan(0.05)
    expect(bandDistance(moving, steady) ?? 0).toBeGreaterThan(1)
  })
})
