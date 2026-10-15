/**
 * A recognised take counts as the expected words at or below this word
 * error rate. One slip in a three-word line is 0.33, so it still counts.
 */
export const CONTENT_WER_CORRECT = 0.34

/**
 * At or above this word error rate the take is not the sentence.
 * «bing bang bong bung» lands here.
 */
export const CONTENT_WER_GIBBERISH = 0.5

/** Lower case, accents folded, punctuation turned into spaces. */
export function foldSpeech(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Word error rate after folding. 0 is the same words. The result is at most 1. */
export function wordErrorRate(expected: string, heard: string): number {
  const left = foldSpeech(expected).split(' ').filter(Boolean)
  const right = foldSpeech(heard).split(' ').filter(Boolean)
  if (left.length === 0) return right.length === 0 ? 0 : 1
  return Math.min(1, levenshtein(left, right) / left.length)
}

function levenshtein(left: readonly string[], right: readonly string[]): number {
  const cols = right.length + 1
  const prev = new Array<number>(cols)
  const next = new Array<number>(cols)
  for (let col = 0; col < cols; col += 1) prev[col] = col
  for (let row = 1; row <= left.length; row += 1) {
    next[0] = row
    const word = left[row - 1]
    for (let col = 1; col < cols; col += 1) {
      const cost = word === right[col - 1] ? 0 : 1
      const insert = (next[col - 1] ?? 0) + 1
      const remove = (prev[col] ?? 0) + 1
      const replace = (prev[col - 1] ?? 0) + cost
      next[col] = Math.min(insert, remove, replace)
    }
    for (let col = 0; col < cols; col += 1) prev[col] = next[col] ?? 0
  }
  return prev[cols - 1] ?? 0
}
