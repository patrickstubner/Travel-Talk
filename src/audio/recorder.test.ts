import { describe, expect, it, vi } from 'vitest'
import { releaseCapture } from './recorder'

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
})
