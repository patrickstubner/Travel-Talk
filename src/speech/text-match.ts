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
  return Math.min(1, levenshtein(left, right, (word, heardWord) => word === heardWord) / left.length)
}

/** A short line. One wrong word in four is already a word error of 0.25. */
export const SHORT_LINE_WORDS = 4

/**
 * Character error at or below this, on a short line, still counts as the
 * sentence. One letter in «estou bem» still counts. senhor and senhora
 * differ by more than this, and they are different lines.
 */
export const SHORT_CER_CORRECT = 0.13

/** Below this mean word confidence a short near-miss stays a miss. */
export const SHORT_CONFIDENCE_MIN = 0.35

/**
 * A grammar pass confirms the sentence only at or above this mean word
 * confidence, including when the free pass heard nothing. Measured on
 * half B after Opus.
 */
export const GRAMMAR_CONFIRM_CONFIDENCE = 0.9

/**
 * Same word for the speaker's gender. senhor and senhora are different
 * lines, so they are not a pair.
 */
const GENDER_VARIANTS: readonly (readonly string[])[] = [['obrigado', 'obrigada']]

function variantFold(text: string): string {
  return foldSpeech(text)
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      const group = GENDER_VARIANTS.find((entry) => entry.includes(word))
      return group?.[0] ?? word
    })
    .join(' ')
}

/**
 * Small words that may be missing without penalty. é folds to e.
 * senhor and senhora stay different words. por, com and que stay,
 * because they carry the short line.
 */
const FUNCTION_WORDS = new Set([
  'eu',
  'a',
  'o',
  'e',
  'de',
  'da',
  'do',
  'em',
  'na',
  'no',
  'um',
  'uma',
  'os',
  'as',
  'se',
  'me',
  'te',
  'ao',
  'nos',
  'nas',
])

/**
 * Portuguese content rate. Gender pairs compare equal. On a line of one
 * to four words, the sentence still counts when the only differences are
 * eu, a, o or e, or one letter inside a word, and the recogniser is sure
 * enough. Up to six words, the same order still counts when one word only
 * grows at the front («turista», «motorista»), or when senhor or senhora
 * is smeared into assim. A line that is only that address does not.
 * An ordered half of the line stays in the middle band. Only the small
 * function words may be missing without that penalty.
 * A different content word stays on the plain word error, so
 * «estou com febre» is not «estou com tontura». Longer lines stay on the
 * word error alone.
 */
/** Middle of the open band between a full sentence and gibberish. */
export const CONTENT_WER_PARTIAL = (CONTENT_WER_CORRECT + CONTENT_WER_GIBBERISH) / 2

/** Heard words the small model uses when it smears «a senhora». */
const ADDRESS_SMEAR = new Set(['assim', 'agosto', 'agora'])

/** Alignment above the four-word character rule, still not a long sentence. */
const ALIGN_LINE_WORDS = 6

export function portugueseContentRate(expected: string, heard: string, confidence?: number | null): number {
  const foldedExpected = variantFold(expected)
  const foldedHeard = variantFold(heard)
  const count = foldedExpected.split(' ').filter(Boolean).length
  const wer = wordErrorRate(foldedExpected, foldedHeard)
  const unsure = confidence != null && confidence < SHORT_CONFIDENCE_MIN
  if (count >= 1 && count <= ALIGN_LINE_WORDS && !unsure && partialCover(foldedExpected, foldedHeard)) {
    return CONTENT_WER_PARTIAL
  }
  if (wer <= CONTENT_WER_CORRECT) return wer
  if (unsure || count < 1 || count > ALIGN_LINE_WORDS) return wer
  if (shortLineAligned(foldedExpected, foldedHeard) || addressAligned(foldedExpected, foldedHeard)) return 0
  if (count > SHORT_LINE_WORDS) return wer
  const cer = charErrorRate(foldedExpected, foldedHeard)
  if (cer <= SHORT_CER_CORRECT) return Math.min(wer, CONTENT_WER_CORRECT)
  return wer
}

export type HeardLine = {
  readonly text: string
  readonly confidence: number | null
}

/**
 * Free pass wins when it already is the sentence, and when it is a clean
 * half: the grammar must not fill the missing content words back in.
 * A grammar result that still contains [unk] is discarded whole.
 * Anything else confirms only when the expected words come back and the
 * mean word confidence is high enough, even if the free pass was empty.
 */
export function confirmedPortuguese(expected: string, free: HeardLine | null, grammar: HeardLine | null): HeardLine | null {
  if (free && portugueseContentRate(expected, free.text, free.confidence) <= CONTENT_WER_CORRECT) return free
  if (free && cleanPartial(expected, free.text)) return free
  if (!grammar || grammar.text.includes('[unk]')) return free
  const confirmed = portugueseContentRate(expected, grammar.text, null) <= CONTENT_WER_CORRECT
  if (!confirmed) return free
  if ((grammar.confidence ?? 0) < GRAMMAR_CONFIRM_CONFIDENCE) return free
  return grammar
}

function cleanPartial(expected: string, heard: string): boolean {
  const foldedExpected = variantFold(expected)
  const count = foldedExpected.split(' ').filter(Boolean).length
  if (count < 1 || count > ALIGN_LINE_WORDS) return false
  return partialCover(foldedExpected, variantFold(heard))
}

function contentTokens(text: string): string[] {
  return text.split(' ').filter((word) => word.length > 0 && !FUNCTION_WORDS.has(word))
}

/**
 * Same content words, in order. One word may differ by one letter.
 * A longer shared ending, as in turista and motorista, does not use
 * that one slip. senhor and senhora do not match.
 */
function shortLineAligned(expected: string, heard: string): boolean {
  const left = contentTokens(expected)
  const right = contentTokens(heard)
  if (left.length === 0 || left.length !== right.length) return false
  let slips = 0
  for (let index = 0; index < left.length; index += 1) {
    const word = left[index] ?? ''
    const heardWord = right[index] ?? ''
    if (word === heardWord || sameEnding(word, heardWord)) continue
    if (!oneLetter(word, heardWord) || slips === 1) return false
    slips += 1
  }
  return true
}

function tinyWord(left: string, right: string): boolean {
  if (left === right || sameEnding(left, right)) return true
  return oneLetter(left, right)
}

function oneLetter(left: string, right: string): boolean {
  if (left.startsWith('senhor') || right.startsWith('senhor')) return false
  return charErrorRate(left, right) <= 0.34 && levenshtein([...left], [...right], (a, b) => a === b) <= 1
}

/** «turista» and «motorista» share a long ending. «senhor» and «senhora» do not. */
function sameEnding(left: string, right: string): boolean {
  if (left.length < 6 || right.length < 6) return false
  if (Math.abs(left.length - right.length) > 3) return false
  return left.slice(-5) === right.slice(-5)
}

/**
 * The heard content words are an ordered part of the line, and at least
 * half of it. A different word does not fit, and extra words do not either.
 * «por favor» can be the whole of «dois ingressos, por favor».
 * «estou com febre» is not «estou com tontura».
 */
function partialCover(expected: string, heard: string): boolean {
  const left = contentTokens(expected)
  const right = contentTokens(heard)
  if (left.length < 2 || right.length < 1 || right.length >= left.length) return false
  let index = 0
  for (const word of right) {
    while (index < left.length && !tinyWord(left[index] ?? '', word)) index += 1
    if (index >= left.length) return false
    index += 1
  }
  return right.length / left.length >= 0.5
}

/**
 * The rest of a short line still lines up after «senhor» or «senhora»,
 * and after a smear such as «assim». A line that is only the address
 * does not: senhor and senhora stay different.
 */
function addressAligned(expected: string, heard: string): boolean {
  const left = contentTokens(expected)
  const right = contentTokens(heard)
  if (!left.some((word) => word.startsWith('senhor'))) return false
  const coreLeft = left.filter((word) => !word.startsWith('senhor'))
  if (coreLeft.length === 0) return false
  const coreRight = right.filter((word) => {
    if (word.startsWith('senhor')) return false
    if (!ADDRESS_SMEAR.has(word)) return true
    return coreLeft.some((item) => tinyWord(item, word))
  })
  if (coreLeft.length !== coreRight.length) return false
  return coreLeft.every((word, index) => tinyWord(word, coreRight[index] ?? ''))
}

/**
 * Grammar for a second pass: the expected words, obrigado or obrigada
 * when that is the pair, and [unk]. The page uses it only to confirm a
 * free pass that missed the sentence.
 */
function grammarWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
}

export function portugueseGrammar(speech: string): string | null {
  const words = grammarWords(speech)
  if (words.length < 1) return null
  const phrases = new Set<string>(['[unk]', words.join(' ')])
  for (let index = 0; index < words.length; index += 1) {
    const group = GENDER_VARIANTS.find((entry) => entry.includes(words[index] ?? ''))
    if (!group) continue
    for (const alt of group) {
      const copy = words.slice()
      copy[index] = alt
      phrases.add(copy.join(' '))
    }
  }
  return JSON.stringify([...phrases])
}

function charErrorRate(expected: string, heard: string): number {
  const left = [...expected]
  const right = [...heard]
  const scale = Math.max(left.length, right.length, 1)
  return levenshtein(left, right, (char, heardChar) => char === heardChar) / scale
}

function levenshtein(
  left: readonly string[],
  right: readonly string[],
  same: (left: string, right: string) => boolean,
  free: (word: string) => boolean = () => false,
): number {
  const cols = right.length + 1
  const prev = new Array<number>(cols)
  const next = new Array<number>(cols)
  prev[0] = 0
  for (let col = 1; col < cols; col += 1) prev[col] = (prev[col - 1] ?? 0) + (free(right[col - 1] ?? '') ? 0 : 1)
  for (let row = 1; row <= left.length; row += 1) {
    const word = left[row - 1] ?? ''
    next[0] = (prev[0] ?? 0) + (free(word) ? 0 : 1)
    for (let col = 1; col < cols; col += 1) {
      const heardWord = right[col - 1] ?? ''
      const cost = same(word, heardWord) ? 0 : 1
      const insert = (next[col - 1] ?? 0) + (free(heardWord) ? 0 : 1)
      const remove = (prev[col] ?? 0) + (free(word) ? 0 : 1)
      const replace = (prev[col - 1] ?? 0) + cost
      next[col] = Math.min(insert, remove, replace)
    }
    for (let col = 0; col < cols; col += 1) prev[col] = next[col] ?? 0
  }
  return prev[cols - 1] ?? 0
}
