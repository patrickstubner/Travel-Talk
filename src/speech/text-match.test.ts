import { describe, expect, it } from 'vitest'
import {
  CONTENT_WER_CORRECT,
  CONTENT_WER_GIBBERISH,
  CONTENT_WER_PARTIAL,
  GRAMMAR_CONFIRM_CONFIDENCE,
  confirmedPortuguese,
  foldSpeech,
  portugueseContentRate,
  portugueseGrammar,
  wordErrorRate,
} from './text-match'
import { starsFromVerdict } from '../pitch/feedback'

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
    expect(portugueseContentRate('Dói aqui.', 'aqui')).toBe(CONTENT_WER_PARTIAL)
    expect(portugueseContentRate('Dois ingressos, por favor.', 'por favor')).toBe(CONTENT_WER_PARTIAL)
    expect(portugueseContentRate('Olá, tudo bem?', 'olá tudo bem a senhora')).toBeGreaterThanOrEqual(CONTENT_WER_GIBBERISH)
    expect(portugueseContentRate('Eu preciso de ajuda.', 'preciso de ajuda')).toBeLessThanOrEqual(CONTENT_WER_CORRECT)
  })

  it('half sentence said', () => {
    const expected = 'Olá, tudo bem, a senhora?'
    const rate = portugueseContentRate(expected, 'olá tudo bem')
    expect(rate).toBe(CONTENT_WER_PARTIAL)
    expect(rate).toBeGreaterThan(CONTENT_WER_CORRECT)
    expect(rate).toBeLessThan(CONTENT_WER_GIBBERISH)
    expect(starsFromVerdict('passt', 'passt', 'passt', false, 'pt-BR', null, null, { wer: rate, prosody: true })).toBeLessThanOrEqual(3)
  })

  it('builds a grammar with the gender pair and unk', () => {
    const grammar = portugueseGrammar('Obrigado.')
    expect(grammar).not.toBeNull()
    const phrases = JSON.parse(grammar ?? '[]') as string[]
    expect(phrases).toContain('[unk]')
    expect(phrases).toContain('obrigado')
    expect(phrases).toContain('obrigada')
    const longer = JSON.parse(portugueseGrammar('Um dois tres quatro cinco.') ?? '[]') as string[]
    expect(longer).toContain('[unk]')
    expect(longer).toContain('um dois tres quatro cinco')
    const accented = JSON.parse(portugueseGrammar('Pode chamar uma ambulância.') ?? '[]') as string[]
    expect(accented).toContain('pode chamar uma ambulância')
    const address = JSON.parse(portugueseGrammar('Senhor.') ?? '[]') as string[]
    expect(address).toContain('senhor')
    expect(address).not.toContain('senhora')
  })

  it('confirms a grammar pass only when the free pass missed without a different word', () => {
    const expected = 'Eu preciso de ajuda.'
    const freeHit = { text: 'eu preciso de ajuda', confidence: 0.9 }
    const grammarOther = { text: 'outra coisa', confidence: 1 }
    expect(confirmedPortuguese(expected, freeHit, grammarOther)).toBe(freeHit)
    const half = { text: 'olá tudo bem', confidence: 0.9 }
    const filled = { text: 'olá tudo bem a senhora', confidence: 1 }
    expect(confirmedPortuguese('Olá, tudo bem, a senhora?', half, filled)?.text).toBe('olá tudo bem')
    const missed = { text: '', confidence: null }
    const quiet = { text: 'eu preciso de ajuda', confidence: GRAMMAR_CONFIRM_CONFIDENCE - 0.1 }
    expect(confirmedPortuguese(expected, missed, quiet)).toBe(missed)
    expect(confirmedPortuguese(expected, null, quiet)).toBeNull()
    const confirmed = { text: 'eu preciso de ajuda', confidence: GRAMMAR_CONFIRM_CONFIDENCE }
    expect(confirmedPortuguese(expected, missed, confirmed)).toEqual(confirmed)
    expect(confirmedPortuguese(expected, null, confirmed)).toEqual(confirmed)
    const other = { text: 'estou com febre', confidence: 0.95 }
    expect(confirmedPortuguese('Eu estou com tontura.', other, { text: 'eu estou com tontura', confidence: 1 })?.text).toBe('eu estou com tontura')
    expect(confirmedPortuguese('Eu estou com tontura.', other, { text: 'eu estou com tontura', confidence: GRAMMAR_CONFIRM_CONFIDENCE - 0.1 })?.text).toBe(
      'estou com febre',
    )
    expect(confirmedPortuguese(expected, missed, { text: '[unk] eu preciso de ajuda', confidence: 0.95 })).toBe(missed)
    expect(confirmedPortuguese(expected, missed, { text: '[unk]', confidence: 1 })).toBe(missed)
  })
})
