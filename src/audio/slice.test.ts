import { afterEach, describe, expect, it, vi } from 'vitest'
import { playSequence, stopSlices } from './slice'

class FakeContext {
  static contexts: FakeContext[] = []
  static sources: Array<{ onended: (() => void) | null }> = []
  destination = {}
  close = vi.fn(async () => undefined)
  constructor() {
    FakeContext.contexts.push(this)
  }
  createBuffer(): { copyToChannel: () => void } {
    return { copyToChannel() {} }
  }
  createBufferSource(): {
    buffer: unknown
    onended: (() => void) | null
    connect: () => void
    start: () => void
    stop: () => void
  } {
    const source = {
      buffer: null as unknown,
      onended: null as (() => void) | null,
      connect() {},
      start() {},
      stop() {},
    }
    FakeContext.sources.push(source)
    return source
  }
}

const part = { samples: new Float32Array(16000), sampleRate: 16000, start: 0, end: 0.5 }

afterEach(() => {
  stopSlices()
  FakeContext.contexts = []
  FakeContext.sources = []
  vi.unstubAllGlobals()
})

describe('slice playback', () => {
  it('closes the audio context when playback stops', async () => {
    vi.stubGlobal('AudioContext', FakeContext)
    const pending = playSequence([part])
    await vi.waitFor(() => expect(FakeContext.contexts).toHaveLength(1))
    const context = FakeContext.contexts[0]
    stopSlices()
    expect(context?.close).toHaveBeenCalled()
    FakeContext.sources[0]?.onended?.()
    await pending
  })

  it('closes the audio context when the slice ends', async () => {
    vi.stubGlobal('AudioContext', FakeContext)
    const pending = playSequence([part])
    await vi.waitFor(() => expect(FakeContext.sources).toHaveLength(1))
    const context = FakeContext.contexts[0]
    FakeContext.sources[0]?.onended?.()
    await pending
    expect(context?.close).toHaveBeenCalled()
  })
})
