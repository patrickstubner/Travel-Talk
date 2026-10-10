import type { PairId } from '../domain/pairs'

export type Settings = {
  pairId: PairId | null
  uiLang: 'de' | 'source'
  viRegion: 'south' | 'north'
  addressVi: string
  addressPt: string
  addressDe: string
  ptSpeaker: 'obrigado' | 'obrigada'
  viContact: 'phone' | 'zalo'
  retention: number
  personalNote: string
  slow: boolean
}

export type StoredCard = {
  cardId: string
  due: string
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  learning_steps: number
  reps: number
  lapses: number
  state: number
  last_review: string | null
}

export type ProgressSnapshot = {
  settings: Settings
  cards: StoredCard[]
}

export const defaultSettings: Settings = {
  pairId: null,
  uiLang: 'de',
  viRegion: 'south',
  addressVi: 'anh',
  addressPt: 'voce',
  addressDe: 'sie',
  ptSpeaker: 'obrigado',
  viContact: 'phone',
  retention: 0.9,
  personalNote: '',
  slow: false,
}

export interface ProgressRepository {
  load(): Promise<ProgressSnapshot>
  saveSettings(settings: Settings): Promise<void>
  saveCard(card: StoredCard): Promise<void>
  replaceAll(snapshot: ProgressSnapshot): Promise<void>
}

export function prefsFromSettings(lang: string, settings: Settings): string[] {
  if (lang === 'vi') return [settings.addressVi, settings.viContact]
  if (lang === 'pt-BR') return [settings.addressPt, settings.ptSpeaker]
  if (lang === 'de') return [settings.addressDe]
  return []
}
