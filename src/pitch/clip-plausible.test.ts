import { describe, expect, it } from 'vitest'
import { clipProblem } from './clip-plausible'

describe('clip plausibility', () => {
  it('rejects a short clip and a short burst of noise', () => {
    const silence = new Float32Array(Math.floor(16000 * 0.2))
    expect(clipProblem('pt-BR/daisy-studious/day.today__any__base.m4a', silence)).toMatch(/duration/)
    const noise = new Float32Array(Math.floor(16000 * 0.4))
    let seed = 1
    for (let index = 0; index < noise.length; index += 1) {
      seed = (seed * 1103515245 + 12345) % 2147483648
      noise[index] = (seed / 2147483648 - 0.5) * 0.2
    }
    expect(clipProblem('pt-BR/daisy-studious/day.today__any__base.m4a', noise)).toMatch(/voicing/)
  })

  it('keeps a one-second tone and the two short Vietnamese syllables', () => {
    const tone = new Float32Array(16000)
    for (let index = 0; index < tone.length; index += 1) {
      tone[index] = Math.sin((2 * Math.PI * 200 * index) / 16000) * 0.4
    }
    expect(clipProblem('pt-BR/gracie-wise/day.today__any__base.m4a', tone)).toBeNull()
    const syllable = new Float32Array(Math.floor(16000 * 0.25))
    for (let index = 0; index < syllable.length; index += 1) {
      syllable[index] = Math.sin((2 * Math.PI * 220 * index) / 16000) * 0.4
    }
    expect(clipProblem('vi/meet.yes__south__base.m4a', syllable)).toBeNull()
    expect(clipProblem('vi/meet.yes__north__base.r70.m4a', syllable)).toBeNull()
  })
})