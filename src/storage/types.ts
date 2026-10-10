import type { SpeedChoice } from '../audio/speed'
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
  /** `auto` follows the card. A number is the one tempo for every clip in the session. */
  speed: SpeedChoice
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
  speed: 'auto',
}

export function normalizeSpeed(speed: unknown, slow: unknown): SpeedChoice {
  if (speed === 'auto' || speed === 0.7 || speed === 0.85 || speed === 1) return speed
  if (slow === true) return 0.85
  if (slow === false) return 1
  return 'auto'
}

/** Reads a stored settings row. Version 0.1.0 had `slow` and no `speed`. */
export function coerceSettings(raw: Partial<Settings> & { slow?: boolean }): Settings {
  const { slow, speed, ...rest } = raw
  return {
    ...defaultSettings,
    ...rest,
    speed: normalizeSpeed(speed, slow),
  }
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
