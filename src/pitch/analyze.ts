import { contourFromSamples, frameEnergy, type Contour } from './contour'
import { bandShape, closestBands } from './spectrum'

/** Pitch, loudness and band shape for one clip. The samples themselves are not kept. */
export type ClipFeatures = {
  contour: Contour
  energy: number[]
  bands: number[][]
  /** Unshifted band shape. The reverse lock uses this, not a frequency warp. */
  plainBands: number[][]
}

/** Features of the file the learner just heard. */
export function analyzeModel(samples: Float32Array, rate: number): ClipFeatures {
  const bands = bandShape(samples, rate)
  return {
    contour: contourFromSamples(samples, rate),
    energy: frameEnergy(samples, rate),
    bands,
    plainBands: bands,
  }
}

/**
 * Features of a take. The frequency warp runs only inside `closestBands`,
 * and only when the unshifted shape is not already close.
 */
export function analyzeUser(
  samples: Float32Array,
  rate: number,
  modelBands: readonly (readonly number[])[] | null,
): ClipFeatures {
  const shaped = modelBands && modelBands.length > 0 ? closestBands(modelBands, samples, rate) : null
  const plain = shaped?.plain ?? bandShape(samples, rate)
  return {
    contour: contourFromSamples(samples, rate),
    energy: frameEnergy(samples, rate),
    bands: shaped?.closest ?? plain,
    plainBands: plain,
  }
}
