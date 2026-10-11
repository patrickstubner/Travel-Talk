import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearManifestCache, playClip, stopClip } from './player'

class FakeAudio {
  playbackRate = 1
  constructor(public src: string) {}
  pause(): void {}
  play(): Promise<void> {
    return Promise.resolve()
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('playClip', () => {
  it('keeps playbackRate at 1 when the file is already slowed', async () => {
    const created: FakeAudio[] = []
    vi.stubGlobal(
      'Audio',
      class extends FakeAudio {
        constructor(src: string) {
          super(src)
          created.push(this)
        }
      },
    )
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ['vi/emergency.help__any__base.r70.m4a'],
      })),
    )
    const result = await playClip('vi/emergency.help__any__base.r70.m4a', 'Giúp tôi với', 'vi', 0.7)
    expect(result).toBe('file')
    expect(created[0]?.src).toContain('emergency.help__any__base.r70.m4a')
    expect(created[0]?.playbackRate).toBe(1)
  })

  it('stays quiet offline when the file is not cached and does not use a browser voice', async () => {
    const created: FakeAudio[] = []
    const speak = vi.fn()
    vi.stubGlobal(
      'Audio',
      class extends FakeAudio {
        constructor(src: string) {
          super(src)
          created.push(this)
        }
      },
    )
    vi.stubGlobal('speechSynthesis', { speak, cancel: vi.fn() })
    vi.stubGlobal('navigator', { onLine: false })
    vi.stubGlobal('caches', {
      keys: async () => [],
      open: async () => ({ match: async () => undefined }),
    })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ['vi/emergency.help__any__base.r70.m4a'],
      })),
    )
    const result = await playClip('vi/emergency.help__any__base.r70.m4a', 'Giúp tôi với', 'vi', 0.7)
    expect(result).toBe('offline')
    expect(created).toHaveLength(0)
    expect(speak).not.toHaveBeenCalled()
  })

  it('moves the highlight from requestAnimationFrame', async () => {
    clearManifestCache()
    let tick: FrameRequestCallback | undefined
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      tick = callback
      return 7
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.stubGlobal(
      'Audio',
      class extends FakeAudio {
        currentTime = 0.4
        paused = false
        ended = false
      },
    )
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ['vi/emergency.help__any__base.m4a'],
      })),
    )
    const onTime = vi.fn()
    const result = await playClip('vi/emergency.help__any__base.m4a', 'Hilfe', 'vi', 1, undefined, onTime)
    expect(result).toBe('file')
    tick?.(0)
    expect(onTime).toHaveBeenCalledWith(0.4)
  })

  it('does not start audio after stopClip', async () => {
    clearManifestCache()
    const created: FakeAudio[] = []
    let release: (value: { ok: boolean; json: () => Promise<string[]> }) => void = () => undefined
    vi.stubGlobal(
      'Audio',
      class extends FakeAudio {
        constructor(src: string) {
          super(src)
          created.push(this)
        }
      },
    )
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            release = resolve
          }),
      ),
    )
    const pending = playClip('vi/emergency.help__any__base.r70.m4a', 'Hilfe', 'vi', 0.7)
    stopClip()
    release({ ok: true, json: async () => ['vi/emergency.help__any__base.r70.m4a'] })
    await expect(pending).resolves.toBe('file')
    expect(created).toHaveLength(0)
  })

  it('pauses again when stopClip wins while play() is still starting', async () => {
    clearManifestCache()
    const created: Array<FakeAudio & { pauses: number; paused: boolean }> = []
    let releasePlay: () => void = () => undefined
    const frame = vi.fn()
    vi.stubGlobal('requestAnimationFrame', frame)
    vi.stubGlobal(
      'Audio',
      class extends FakeAudio {
        pauses = 0
        paused = true
        constructor(src: string) {
          super(src)
          created.push(this)
        }
        override pause(): void {
          this.paused = true
          this.pauses += 1
        }
        override play(): Promise<void> {
          return new Promise((resolve) => {
            releasePlay = () => {
              this.paused = false
              resolve()
            }
          })
        }
      },
    )
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ['vi/emergency.help__any__base.m4a'],
      })),
    )
    const onEnd = vi.fn()
    const onTime = vi.fn()
    const pending = playClip('vi/emergency.help__any__base.m4a', 'Hilfe', 'vi', 1, onEnd, onTime)
    for (let step = 0; step < 12 && created.length === 0; step += 1) await Promise.resolve()
    expect(created).toHaveLength(1)
    stopClip()
    releasePlay()
    await expect(pending).resolves.toBe('file')
    expect(created[0]?.pauses).toBe(2)
    expect(created[0]?.paused).toBe(true)
    expect(onEnd).not.toHaveBeenCalled()
    expect(onTime).not.toHaveBeenCalled()
    expect(frame).not.toHaveBeenCalled()
  })
})
