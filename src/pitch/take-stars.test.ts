import { describe, expect, it } from 'vitest'
import { takeStars } from './take-stars'

describe('take stars', () => {
  it('gives three when both bars fit, two when neither is off, and one when one is off', () => {
    expect(takeStars('passt', 'passt')).toBe(3)
    expect(takeStars('teilweise', 'passt')).toBe(2)
    expect(takeStars('passt', 'teilweise')).toBe(2)
    expect(takeStars('teilweise', 'teilweise')).toBe(2)
    expect(takeStars('daneben', 'passt')).toBe(1)
    expect(takeStars('passt', 'daneben')).toBe(1)
    expect(takeStars('daneben', 'daneben')).toBe(1)
    expect(takeStars('teilweise', 'daneben')).toBe(1)
  })

  it('gives no stars when a bar is missing', () => {
    expect(takeStars(null, 'passt')).toBeNull()
    expect(takeStars('passt', null)).toBeNull()
    expect(takeStars(null, null)).toBeNull()
  })
})
