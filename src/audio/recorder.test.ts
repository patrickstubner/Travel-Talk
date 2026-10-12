import { afterEach, describe, expect, it, vi } from 'vitest'
import * as player from './player'
import { releaseCapture, startMicrophone } from './recorder'

class FakeRecorder {
  static last: FakeRecorder | null = null
  state = 'inactive'
  mimeType = 'audio/webm'
  stream = { getTracks: () => [{ stop: vi.fn() }] }
  private listeners = new Map<string, Array<() => void>>()
  constructor() {
    FakeRecorder.last = this
  }
  addEventListener(type: string, listener: () => void): void {
    const list = this.listeners.get(type) ?? []
    list.push(listener)
    this.listeners.set(type, list)
  }
  start(): void {
    this.state = 'recording'
  }
  stop = vi.fn(() => {
    if (this.state === 'inactive') return
    this.state = 'inactive'
    for (const listener of this.listeners.get('stop') ?? []) listener()
  })
}

function installMicrophone(close: ReturnType<typeof vi.fn>): void {
  FakeRecorder.last = null
  vi.stubGlobal('MediaRecorder', FakeRecorder)
  vi.stubGlobal(
    'AudioContext',
    class {
      decodeAudioData = vi.fn(async () => ({
        numberOfChannels: 1,
        length: 16,
        sampleRate: 16000,
        getChannelData: () => new Float32Array(16),
      }))
      close = close
    },
  )
  vi.stubGlobal('navigator', {
    mediaDevices: {
      getUserMedia: vi.fn(async () => ({ getTracks: () => [{ stop: vi.fn() }] })),
    },
  })
  const urlApi = URL as unknown as { createObjectURL?: (blob: Blob) => string; revokeObjectURL?: (value: string) => void }
  urlApi.createObjectURL = () => 'blob:test'
  urlApi.revokeObjectURL = () => undefined
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('releaseCapture', () => {
  it('stops the recorder, stops every track and revokes the blob url', () => {
    const track = { stop: vi.fn() }
    const recorder = {
      state: 'recording',
      stop: vi.fn(),
      stream: { getTracks: () => [track] },
    }
    const revoke = vi.fn()
    releaseCapture(recorder, 'blob:local', revoke)
    expect(recorder.stop).toHaveBeenCalledOnce()
    expect(track.stop).toHaveBeenCalledOnce()
    expect(revoke).toHaveBeenCalledWith('blob:local')
  })

  it('stops leftover tracks when the recorder is already inactive', () => {
    const track = { stop: vi.fn() }
    const recorder = {
      state: 'inactive',
      stop: vi.fn(),
      stream: { getTracks: () => [track] },
    }
    releaseCapture(recorder, null, vi.fn())
    expect(recorder.stop).not.toHaveBeenCalled()
    expect(track.stop).toHaveBeenCalledOnce()
  })

  it('stops the take on its own after about 15 seconds', async () => {
    vi.useFakeTimers()
    const close = vi.fn(async () => undefined)
    installMicrophone(close)
    const session = await startMicrophone(() => undefined)
    expect(session).not.toBeNull()
    await vi.advanceTimersByTimeAsync(14_999)
    expect(FakeRecorder.last?.stop).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(FakeRecorder.last?.stop).toHaveBeenCalledOnce()
  })

  it('stops playback after the stream is open and before the recorder starts', async () => {
    const order: string[] = []
    const stop = vi.spyOn(player, 'stopClip').mockImplementation(() => {
      order.push('stop')
    })
    const start = FakeRecorder.prototype.start
    FakeRecorder.prototype.start = function startRecorder(this: FakeRecorder) {
      order.push('start')
      start.call(this)
    }
    const close = vi.fn(async () => undefined)
    installMicrophone(close)
    try {
      const session = await startMicrophone(() => undefined)
      expect(session).not.toBeNull()
      expect(order).toEqual(['stop', 'start'])
    } finally {
      FakeRecorder.prototype.start = start
      stop.mockRestore()
    }
  })

  it('asks for echo cancellation, and leaves noise suppression and automatic gain off', async () => {
    const close = vi.fn(async () => undefined)
    installMicrophone(close)
    const session = await startMicrophone(() => undefined)
    expect(session).not.toBeNull()
    const getUserMedia = navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>
    expect(getUserMedia).toHaveBeenCalledWith({
      audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false },
    })
  })

  it('closes the audio context after the recording is decoded', async () => {
    const close = vi.fn(async () => undefined)
    installMicrophone(close)
    const session = await startMicrophone(() => undefined)
    expect(session).not.toBeNull()
    session?.recorder.stop()
    await vi.waitFor(() => expect(close).toHaveBeenCalled())
  })
})
