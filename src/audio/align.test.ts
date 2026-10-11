import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearManifestCache } from './player'
import {
  ALIGN_MAX_BYTES,
  alignmentFitsDuration,
  alignmentName,
  alignmentScale,
  clearAlignmentCache,
  currentWordIndex,
  loadAlignment,
  parseAlignment,
  scaleTimes,
} from './align'

afterEach(() => {
  vi.unstubAllGlobals()
  clearManifestCache()
  clearAlignmentCache()
})

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

  it('uses a cached timing file when the network is down', async () => {
    const body = JSON.stringify({ words: [{ start: 0.1, end: 0.5 }] })
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (String(url).includes('manifest.json')) {
          return {
            ok: true,
            json: async () => [
              'vi/vivos-22/emergency.help__any__base.align.json',
              'vi/vivos-22/emergency.look__any__base.align.json',
            ],
          }
        }
        throw new TypeError('offline')
      }),
    )
    vi.stubGlobal('caches', {
      async keys() {
        return ['travel-talk-audio']
      },
      async open() {
        return {
          async match(url: string) {
            if (String(url).includes('emergency.help__any__base.align.json')) return new Response(body)
            if (String(url).includes('emergency.look__any__base.align.json')) return new Response('{"extra":true}')
            return undefined
          },
        }
      },
    })
    await expect(loadAlignment('vi/vivos-22/emergency.help__any__base.m4a', 'Giúp')).resolves.toEqual([{ start: 0.1, end: 0.5 }])
    await expect(loadAlignment('vi/vivos-22/emergency.look__any__base.m4a', 'Nhìn')).resolves.toBeNull()
    expect(vi.mocked(fetch).mock.calls.every(([url]) => String(url).includes('manifest.json'))).toBe(true)
  })

  it('refuses a timing file that is not listed, too large, or longer than the clip', async () => {
    const ok = JSON.stringify({ words: [{ start: 0.1, end: 0.4 }] })
    const bulky = `${ok.slice(0, -1)}${' '.repeat(ALIGN_MAX_BYTES)}}`
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const name = String(url)
        if (name.includes('manifest.json')) {
          return {
            ok: true,
            json: async () => [
              'vi/vivos-22/emergency.water__any__base.align.json',
              'vi/vivos-22/emergency.fever__any__base.align.json',
            ],
          }
        }
        if (name.includes('emergency.fever')) return new Response(bulky)
        return new Response(ok)
      }),
    )
    vi.stubGlobal('caches', {
      async keys() {
        return []
      },
      async open() {
        return { async match() { return undefined } }
      },
    })
    await expect(loadAlignment('vi/vivos-22/emergency.dizzy__any__base.m4a', 'Schwindel.')).resolves.toBeNull()
    await expect(loadAlignment('vi/vivos-22/emergency.water__any__base.m4a', 'Wasser.')).resolves.toEqual([{ start: 0.1, end: 0.4 }])
    await expect(loadAlignment('vi/vivos-22/emergency.fever__any__base.m4a', 'Fieber.')).resolves.toBeNull()
    expect(alignmentFitsDuration([{ start: 0.1, end: 1.2 }], 1.1)).toBe(true)
    expect(alignmentFitsDuration([{ start: 0.1, end: 1.2 }], 1.05)).toBe(false)
    expect(alignmentFitsDuration([{ start: 0.1, end: 1.2 }], 1.09, 1 / 0.7)).toBe(true)
  })

  it('fetches again after a timing file was missing', async () => {
    let status = 404
    let body = 'missing'
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (String(url).includes('manifest.json')) {
          return { ok: true, json: async () => ['vi/vivos-22/emergency.help__any__base.align.json'] }
        }
        return new Response(body, { status })
      }),
    )
    vi.stubGlobal('caches', {
      async keys() {
        return []
      },
      async open() {
        return { async match() { return undefined } }
      },
    })
    await expect(loadAlignment('vi/vivos-22/emergency.help__any__base.m4a', 'Giúp')).resolves.toBeNull()
    status = 200
    body = JSON.stringify({ words: [{ start: 0.1, end: 0.4 }] })
    await expect(loadAlignment('vi/vivos-22/emergency.help__any__base.m4a', 'Giúp')).resolves.toEqual([{ start: 0.1, end: 0.4 }])
  })
})
