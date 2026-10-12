import { contourFromSamples, frameEnergy, type Contour } from './contour'
import { bandShape, closestBands } from './spectrum'

/** Pitch, loudness and band shape for one clip. The samples themselves are not kept. */
export type ClipFeatures = {
  contour: Contour
  energy: number[]
  bands: number[][]
}

/** Features of the file the learner just heard. */
export function analyzeModel(samples: Float32Array, rate: number): ClipFeatures {
  return {
    contour: contourFromSamples(samples, rate),
    energy: frameEnergy(samples, rate),
    bands: bandShape(samples, rate),
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
  return {
    contour: contourFromSamples(samples, rate),
    energy: frameEnergy(samples, rate),
    bands: modelBands && modelBands.length > 0 ? closestBands(modelBands, samples, rate) : bandShape(samples, rate),
  }
}
