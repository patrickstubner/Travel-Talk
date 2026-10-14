import { describe, expect, it } from 'vitest'
import { wordTempo } from './word-tempo'

describe('word tempo', () => {
  it('plays a word at 100 % until this person stores another step', () => {
    expect(wordTempo({})).toBe(1)
    expect(wordTempo({ wordSpeed: null })).toBe(1)
    expect(wordTempo({ wordSpeed: 1 })).toBe(1)
    expect(wordTempo({ wordSpeed: 0.85 })).toBe(0.85)
    expect(wordTempo({ wordSpeed: 0.7 })).toBe(0.7)
    expect(wordTempo({ wordSpeed: 0.5 as never })).toBe(1)
  })
})
