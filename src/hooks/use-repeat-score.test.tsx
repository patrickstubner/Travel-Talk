// @vitest-environment happy-dom
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { analyzeModel, analyzeUser } from '../pitch/analyze'
import { useRepeatScore, type PitchAnalyzer } from './use-repeat-score'

function tone(startHz: number, endHz: number, seconds: number): Float32Array {
  const sampleRate = 16000
  const samples = new Float32Array(Math.floor(sampleRate * seconds))
  let phase = 0
  for (let index = 0; index < samples.length; index += 1) {
    const hz = startHz + (endHz - startHz) * (index / samples.length)
    phase += (2 * Math.PI * hz) / sampleRate
    samples[index] = Math.sin(phase) * 0.8
  }
  return samples
}

const words = [
  { start: 0.15, end: 0.45 },
  { start: 0.5, end: 0.8 },
  { start: 0.85, end: 1.15 },
]

/** Synchronous analyzer, as the plan asks: no worker, no timers. */
const syncAnalyzer: PitchAnalyzer = {
  model: vi.fn(analyzeModel),
  user: vi.fn(analyzeUser),
}

describe('useRepeatScore', () => {
  const samples = tone(140, 280, 1.2)
  const base = {
    lang: 'en' as const,
    region: 'south' as const,
    speech: 'qua xin nha',
    words,
    modelSamples: samples,
    modelRate: 16000,
    userSamples: samples,
    userRate: 16000,
    analyzer: syncAnalyzer,
  }

  it('scores with the injected analyzer and caps at four without a recogniser', async () => {
    const { result } = renderHook(() => useRepeatScore({ ...base, recognizer: null }))
    await waitFor(() => expect(result.current.score).not.toBeNull())
    expect(syncAnalyzer.model).toHaveBeenCalled()
    expect(syncAnalyzer.user).toHaveBeenCalled()
    expect(result.current.speech).toBe('off')
    expect(result.current.bars.melody).toBe('passt')
    expect(result.current.bars.words).toBeNull()
    expect(result.current.stars).toBe(4)
  })

  it('adds the words bar from the injected recogniser', async () => {
    const recognizer = vi.fn(async () => ({ text: 'Qua xin nha!', confidence: 0.9 }))
    const { result } = renderHook(() => useRepeatScore({ ...base, recognizer }))
    await waitFor(() => expect(result.current.speech).toBe('ready'))
    await waitFor(() => expect(result.current.score).not.toBeNull())
    expect(recognizer).toHaveBeenCalledWith('en', samples, 16000, 'qua xin nha')
    expect(result.current.heardText).toBe('Qua xin nha!')
    expect(result.current.wer).toBe(0)
    expect(result.current.bars.words).toBe('passt')
    expect(result.current.stars).toBe(5)
  })

  it('treats a throwing recogniser as failed', async () => {
    const recognizer = vi.fn(async () => {
      throw new Error('boom')
    })
    const { result } = renderHook(() => useRepeatScore({ ...base, recognizer }))
    await waitFor(() => expect(result.current.speech).toBe('failed'))
    expect(result.current.speechFailed).toBe(true)
    expect(result.current.bars.words).toBeNull()
  })
})
