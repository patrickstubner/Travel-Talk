import { afterEach, describe, expect, it, vi } from 'vitest'
import { playClip } from './player'

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
})
