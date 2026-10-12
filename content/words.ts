import type { Lang } from './phrase'

/**
 * Checked words for 0.9.0. A gloss group stays out until it is on this list.
 * The hand list and the visa groups are the first check. A filler is not a card.
 * The id is stable English, `w.water`. One form in two sentences is one card.
 */

export type WordEntry = {
  id: string
  hand: boolean
  citation: Record<Lang, string>
  /** Northern citation when it differs. Southern Vietnamese is `citation.vi`. */
  north?: string
  sentences: readonly string[]
}

/** Dropped from the block. A hand-list word is not in this list. */
export const FILLERS: Record<'de' | 'en' | 'pt' | 'vi', readonly string[]> = {
  de: ['der', 'die', 'das', 'ein', 'und', 'ist', 'zu', 'von', 'mit'],
  en: ['a', 'the', 'of', 'to', 'and', 'is', 'in', 'on'],
  pt: ['o', 'a', 'de', 'que', 'um', 'em', 'por', 'para'],
  vi: ['của', 'và', 'là', 'các', 'được', 'thì', 'mà'],
}

export const WORDS: readonly WordEntry[] = [
  {
    id: 'w.i',
    hand: true,
    citation: { de: 'ich', en: 'I', 'pt-BR': 'eu', vi: 'tôi' },
    sentences: [
      'emergency.doctor',
      'emergency.breathe',
      'emergency.allergic',
      'emergency.peanut',
      'emergency.lost',
      'emergency.passport',
      'emergency.fever',
      'emergency.understand',
      'meet.origin',
      'meet.why',
      'arrival.tourist',
      'food.veg',
      'visa.need',
      'stay.reservation',
      'shop.look',
    ],
  },
  {
    id: 'w.yes',
    hand: true,
    citation: { de: 'ja', en: 'yes', 'pt-BR': 'sim', vi: 'dạ' },
    north: 'vâng',
    sentences: ['meet.yes'],
  },
  {
    id: 'w.please',
    hand: true,
    citation: { de: 'bitte', en: 'please', 'pt-BR': 'por favor', vi: 'làm ơn' },
    sentences: ['emergency.ambulance', 'day.please'],
  },
  {
    id: 'w.thanks',
    hand: true,
    citation: { de: 'danke', en: 'thank you', 'pt-BR': 'obrigado', vi: 'cảm ơn' },
    sentences: ['meet.thanks'],
  },
  {
    id: 'w.not',
    hand: true,
    citation: { de: 'nicht', en: 'not', 'pt-BR': 'não', vi: 'không' },
    sentences: ['emergency.breathe', 'emergency.understand', 'food.spicy', 'stay.wifi'],
  },
  {
    id: 'w.where',
    hand: true,
    citation: { de: 'wo', en: 'where', 'pt-BR': 'onde', vi: 'đâu' },
    sentences: ['emergency.pharmacy', 'emergency.hospital', 'arrival.taxi', 'arrival.exit', 'day.toilet', 'visa.where', 'sight.where'],
  },
  {
    id: 'w.here',
    hand: true,
    citation: { de: 'hier', en: 'here', 'pt-BR': 'aqui', vi: 'đây' },
    sentences: ['emergency.hurt', 'meet.food', 'food.order', 'stay.address'],
  },
  {
    id: 'w.water',
    hand: true,
    citation: { de: 'Wasser', en: 'water', 'pt-BR': 'água', vi: 'nước' },
    sentences: ['emergency.water', 'food.water'],
  },
  {
    id: 'w.help',
    hand: true,
    citation: { de: 'Hilfe!', en: 'help', 'pt-BR': 'socorro', vi: 'cứu với' },
    sentences: ['emergency.help'],
  },
  {
    id: 'w.days',
    hand: false,
    citation: { de: 'Tage', en: 'days', 'pt-BR': 'dias', vi: 'ngày' },
    sentences: ['visa.days'],
  },
  {
    id: 'w.stay',
    hand: false,
    citation: { de: 'bleiben', en: 'stay', 'pt-BR': 'ficar', vi: 'ở' },
    sentences: ['visa.days'],
  },
  {
    id: 'w.documents',
    hand: false,
    citation: { de: 'Dokumente', en: 'documents', 'pt-BR': 'documentos', vi: 'giấy tờ' },
    sentences: ['visa.documents'],
  },
  {
    id: 'w.evisa',
    hand: false,
    citation: { de: 'E-Visum', en: 'e-visa', 'pt-BR': 'visto eletrônico', vi: 'visa điện tử' },
    sentences: ['visa.evisa'],
  },
  {
    id: 'w.visa',
    hand: false,
    citation: { de: 'Visum', en: 'visa', 'pt-BR': 'visto', vi: 'visa' },
    sentences: ['visa.need', 'visa.extend'],
  },
  {
    id: 'w.extend',
    hand: false,
    citation: { de: 'verlängern', en: 'extend', 'pt-BR': 'prorrogar', vi: 'gia hạn' },
    sentences: ['visa.extend'],
  },
  {
    id: 'w.application',
    hand: false,
    citation: { de: 'Gesuch', en: 'application', 'pt-BR': 'pedido', vi: 'hồ sơ' },
    sentences: ['visa.where'],
  },
  {
    id: 'w.current',
    hand: false,
    citation: { de: 'aktuell', en: 'current', 'pt-BR': 'atual', vi: 'hiện hành' },
    sentences: ['visa.rules'],
  },
  {
    id: 'w.rule',
    hand: false,
    citation: { de: 'Regel', en: 'rule', 'pt-BR': 'regra', vi: 'quy định' },
    sentences: ['visa.rules'],
  },
  {
    id: 'w.photo',
    hand: false,
    citation: { de: 'Passfoto', en: 'passport photo', 'pt-BR': 'foto de passaporte', vi: 'ảnh hộ chiếu' },
    sentences: ['visa.photo'],
  },
]

const byId = new Map(WORDS.map((word) => [word.id, word]))

export function wordById(id: string): WordEntry | undefined {
  return byId.get(id)
}

export function wordIds(): string[] {
  return WORDS.map((word) => word.id)
}

export function spokenCitation(word: WordEntry, lang: Lang, viRegion: 'south' | 'north'): string {
  if (lang === 'vi' && viRegion === 'north' && word.north) return word.north
  return word.citation[lang]
}

/** `{lang}/{id}__region__base.m4a`. The voice folder is added by `spokenFile`. */
export function wordAudioFile(word: WordEntry, lang: Lang, viRegion: 'south' | 'north'): string {
  const region = lang === 'vi' && word.north ? viRegion : 'any'
  return `${lang}/${word.id}__${region}__base.m4a`
}

export function keywordsOf(conceptId: string): WordEntry[] {
  return WORDS.filter((word) => word.sentences.includes(conceptId))
}
