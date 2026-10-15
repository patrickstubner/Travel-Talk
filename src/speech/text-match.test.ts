import { describe, expect, it } from 'vitest'
import { CONTENT_WER_CORRECT, CONTENT_WER_GIBBERISH, foldSpeech, wordErrorRate } from './text-match'

describe('folded speech', () => {
  it('drops accents and punctuation', () => {
    expect(foldSpeech('Olá, mundo!')).toBe('ola mundo')
    expect(foldSpeech('  Não   sei. ')).toBe('nao sei')
    expect(wordErrorRate('Olá, mundo!', 'ola mundo')).toBe(0)
  })

  it('scores gibberish as a full miss and a matching line as zero', () => {
    const sentence = 'Eu preciso de ajuda.'
    expect(wordErrorRate(sentence, 'bing bang bong bung')).toBeGreaterThanOrEqual(CONTENT_WER_GIBBERISH)
    expect(wordErrorRate(sentence, 'eu preciso de ajuda')).toBeLessThanOrEqual(CONTENT_WER_CORRECT)
    expect(wordErrorRate(sentence, 'eu preciso de agua')).toBeLessThanOrEqual(CONTENT_WER_CORRECT)
    expect(wordErrorRate(sentence, '')).toBe(1)
  })
})
