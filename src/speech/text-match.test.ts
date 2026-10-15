import { describe, expect, it } from 'vitest'
import {
  CONTENT_WER_CORRECT,
  CONTENT_WER_GIBBERISH,
  foldSpeech,
  portugueseContentRate,
  portugueseGrammar,
  wordErrorRate,
} from './text-match'

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

  it('treats obrigado and obrigada as the same word, and a short near-miss as the sentence', () => {
    expect(portugueseContentRate('Obrigado.', 'Obrigada.')).toBeLessThanOrEqual(CONTENT_WER_CORRECT)
    expect(portugueseContentRate('Muito obrigado.', 'Muito obrigada.')).toBeLessThanOrEqual(CONTENT_WER_CORRECT)
    expect(portugueseContentRate('Estou bem.', 'Estou ben.')).toBeLessThanOrEqual(CONTENT_WER_CORRECT)
    expect(portugueseContentRate('Estou bem.', 'Estou ben.', 0.2)).toBeGreaterThanOrEqual(CONTENT_WER_GIBBERISH)
    expect(portugueseContentRate('Obrigado.', 'De nada.')).toBeGreaterThanOrEqual(CONTENT_WER_GIBBERISH)
    expect(portugueseContentRate('Bom dia.', 'Boa noite.')).toBeGreaterThanOrEqual(CONTENT_WER_GIBBERISH)
    expect(portugueseContentRate('Sim.', 'Não.')).toBeGreaterThanOrEqual(CONTENT_WER_GIBBERISH)
    const longLine = 'alpha bravo charlie delta echo'
    expect(portugueseContentRate(longLine, 'alphb bravb charlif delta echo')).toBeGreaterThanOrEqual(CONTENT_WER_GIBBERISH)
    expect(wordErrorRate('senhor', 'senhora')).toBe(1)
    expect(portugueseContentRate('Senhor.', 'Senhora.')).toBeGreaterThanOrEqual(CONTENT_WER_GIBBERISH)
    expect(portugueseContentRate('Eu me chamo Anna.', 'me chamo ana')).toBeLessThanOrEqual(CONTENT_WER_CORRECT)
    expect(portugueseContentRate('Eu estou com tontura.', 'estou com tanto é')).toBeGreaterThanOrEqual(CONTENT_WER_GIBBERISH)
    expect(portugueseContentRate('Eu estou com tontura.', 'estou com febre')).toBeGreaterThanOrEqual(CONTENT_WER_GIBBERISH)
    expect(portugueseContentRate('De onde a senhora é?', 'de onde assim')).toBeLessThanOrEqual(CONTENT_WER_CORRECT)
    expect(portugueseContentRate('Eu estou aqui como turista.', 'estou aqui com motorista')).toBeLessThanOrEqual(CONTENT_WER_CORRECT)
    expect(portugueseContentRate('Que comida a senhora gosta?', 'que comida assim agosto')).toBeGreaterThanOrEqual(CONTENT_WER_GIBBERISH)
    expect(portugueseContentRate('Senhor.', 'assim')).toBeGreaterThanOrEqual(CONTENT_WER_GIBBERISH)
    expect(portugueseContentRate('Dói aqui.', 'aqui')).toBeLessThanOrEqual(CONTENT_WER_CORRECT)
    expect(portugueseContentRate('Dois ingressos, por favor.', 'por favor')).toBeLessThanOrEqual(CONTENT_WER_CORRECT)
    expect(portugueseContentRate('Olá, tudo bem?', 'olá tudo bem a senhora')).toBeGreaterThanOrEqual(CONTENT_WER_GIBBERISH)
  })

  it('builds a short grammar with the gender pair and unk, and none for a long line', () => {
    const grammar = portugueseGrammar('Obrigado.')
    expect(grammar).not.toBeNull()
    const phrases = JSON.parse(grammar ?? '[]') as string[]
    expect(phrases).toContain('[unk]')
    expect(phrases).toContain('obrigado')
    expect(phrases).toContain('obrigada')
    expect(portugueseGrammar('Um dois tres quatro cinco.')).toBeNull()
    const address = JSON.parse(portugueseGrammar('Senhor.') ?? '[]') as string[]
    expect(address).toContain('senhor')
    expect(address).not.toContain('senhora')
  })
})
