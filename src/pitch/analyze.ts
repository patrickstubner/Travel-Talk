import { contourFromSamples, frameEnergy, type Contour } from './contour'
import { bandShape, closestBands, trimSilence } from './spectrum'

/** Pitch, loudness and band shape for one clip. The samples themselves are not kept. */
export type ClipFeatures = {
  contour: Contour
  energy: number[]
  bands: number[][]
  /** Unshifted band shape. The reverse lock uses this, not a frequency warp. */
  plainBands: number[][]
  /**
   * Unshifted bands after leading and trailing silence is cut.
   * The sentence distance uses these, so a pause around the take does not
   * move the window off the file. Rhythm and the reverse lock keep `bands`.
   */
  speechBands: number[][]
}

function spokenBands(samples: Float32Array, rate: number, bands: number[][]): number[][] {
  const spoken = trimSilence(samples, rate)
  return spoken === samples ? bands : bandShape(spoken, rate)
}

/** Features of the file the learner just heard. */
export function analyzeModel(samples: Float32Array, rate: number): ClipFeatures {
  const bands = bandShape(samples, rate)
  return {
    contour: contourFromSamples(samples, rate),
    energy: frameEnergy(samples, rate),
    bands,
    plainBands: bands,
    speechBands: spokenBands(samples, rate, bands),
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
    speechBands: spokenBands(samples, rate, plain),
  }
}
