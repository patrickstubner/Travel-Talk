import { analyzeModel, analyzeUser, type ClipFeatures } from './analyze'

export type AnalysisRequest = {
  id: number
  kind: 'model' | 'user'
  samples: Float32Array
  rate: number
  modelBands: number[][] | null
}

export type AnalysisResponse = ClipFeatures & { id: number }

/**
 * One analysis, then the samples are dropped with the message.
 * Nothing is written to storage and nothing is sent off the device.
 */
export function handleAnalysis(request: AnalysisRequest): AnalysisResponse {
  const features =
    request.kind === 'model'
      ? analyzeModel(request.samples, request.rate)
      : analyzeUser(request.samples, request.rate, request.modelBands)
  return { id: request.id, ...features }
}

if (typeof self !== 'undefined' && typeof window === 'undefined') {
  self.onmessage = (event: MessageEvent<AnalysisRequest>) => {
    self.postMessage(handleAnalysis(event.data))
  }
}
