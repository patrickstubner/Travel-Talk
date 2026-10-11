import { describe, expect, it } from 'vitest'
import { alignmentName, alignmentScale, currentWordIndex, parseAlignment, scaleTimes } from './align'

describe('alignment files', () => {
  it('accepts one span per word and rejects a mismatch', () => {
    const ok = parseAlignment({ words: [{ start: 0.1, end: 0.4 }, { start: 0.45, end: 0.8 }] }, 2)
    expect(ok).toEqual([{ start: 0.1, end: 0.4 }, { start: 0.45, end: 0.8 }])
    expect(parseAlignment({ words: [{ start: 0.1, end: 0.4 }] }, 2)).toBeNull()
    expect(parseAlignment({ words: [{ start: 0.4, end: 0.1 }] }, 1)).toBeNull()
    expect(parseAlignment({ words: [{ start: 0.2, end: 0.4 }], extra: true }, 1)).toBeNull()
    expect(parseAlignment({ words: [{ start: 0.5, end: 0.6 }, { start: 0.1, end: 0.2 }] }, 2)).toBeNull()
  })

  it('scales a slowed file and keeps the base name', () => {
    expect(alignmentName('vi/vivos-22/emergency.help__any__base.r70.m4a')).toBe('vi/vivos-22/emergency.help__any__base.align.json')
    expect(alignmentScale('de/emergency.help__any__base.r85.m4a')).toBeCloseTo(1 / 0.85)
    const scaled = scaleTimes([{ start: 0.2, end: 0.4 }], 1 / 0.7)
    expect(scaled?.[0]?.start).toBeCloseTo(0.286, 2)
    expect(currentWordIndex(scaled, 0.3)).toBe(0)
    expect(currentWordIndex(null, 0.3)).toBeNull()
  })
})
