import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { analyzeModelCached, analyzeUserOnce, featuresFromWorker, installPitchWorker } from './analyze-client'
import { handleAnalysis, type AnalysisRequest, type AnalysisResponse } from './analyze.worker'

function tone(hz: number): Float32Array {
  const rate = 16000
  const samples = new Float32Array(rate)
  let phase = 0
  for (let index = 0; index < samples.length; index += 1) {
    phase += (2 * Math.PI * hz) / rate
    samples[index] = Math.sin(phase) * 0.8
  }
  return samples
}

describe('pitch analysis', () => {
  afterEach(() => {
    installPitchWorker(null)
  })

  it('reuses the model features and leaves the microphone buffer on the caller', async () => {
    const samples = tone(180)
    const first = analyzeModelCached(samples, 16000)
    const second = analyzeModelCached(samples, 16000)
    expect(second).toBe(first)
    const features = await first
    expect(features.contour.length).toBeGreaterThan(8)
    expect(features.bands.find((frame) => frame.length > 0)?.length).toBe(12)
    expect(analyzeModelCached(tone(180), 16000)).not.toBe(first)
  })

  it('returns pitch, loudness and bands for one request and keeps no samples', () => {
    const samples = tone(110)
    const result = handleAnalysis({ id: 4, kind: 'model', samples, rate: 16000, modelBands: null })
    expect(result.id).toBe(4)
    expect(result.bands.length).toBeGreaterThan(8)
    expect(result.speechBands.length).toBeGreaterThan(8)
    expect(result.energy.length).toBe(result.contour.length)
  })

  it('passes the median pitch through the worker reply', () => {
    const model = handleAnalysis({ id: 3, kind: 'model', samples: tone(120), rate: 16000, modelBands: null })
    const kept = featuresFromWorker(model)
    expect(kept.medianHz).toBeCloseTo(120, 0)
    expect(kept.medianHz).toBe(model.medianHz)
    const reply = featuresFromWorker({
      id: 9,
      contour: [0],
      energy: [0.1],
      bands: [[1]],
      plainBands: [[1]],
      speechBands: [[1]],
      medianHz: 280,
    })
    expect(reply.medianHz).toBe(280)
    expect(reply.contour).toEqual([0])
  })

  it('keeps the median when a fake worker replies', async () => {
    const fake = {
      onmessage: null as ((event: MessageEvent<AnalysisResponse>) => void) | null,
      onerror: null as (() => void) | null,
      postMessage(data: AnalysisRequest) {
        const response = handleAnalysis(data)
        this.onmessage?.({ data: response } as MessageEvent<AnalysisResponse>)
      },
    }
    installPitchWorker(fake as unknown as Worker)
    const model = await analyzeModelCached(tone(110), 16000)
    const take = await analyzeUserOnce(tone(280), 16000, model.bands)
    expect(model.medianHz).toBeCloseTo(110, 0)
    expect(take.medianHz).toBeCloseTo(280, 0)
  })

  it('does not store or send the samples from the worker', () => {
    const source = readFileSync(fileURLToPath(new URL('./analyze.worker.ts', import.meta.url)), 'utf8')
    expect(source).not.toMatch(/indexedDB|localStorage|fetch\(|caches|XMLHttpRequest/)
  })
})
