import type { Lang } from '../../content/phrase'
import type { SpeedChoice } from '../audio/speed'
import { isBundledVoiceId } from '../audio/voices'
import { isLang, legacyDirection } from '../domain/direction'

export type VoiceMap = Partial<Record<Lang, string>>

export type Settings = {
  appLang: Lang | null
  targetLang: Lang | null
  viRegion: 'south' | 'north'
  /**
   * Optional voice id per language.
   * Missing means the voice shipped before 0.4.0.
   * A new user stores the male id. A later paid voice is just another id.
   */
  voices?: VoiceMap
  /** Local only. Not exported, so format 3 stays strict. */
  voiceHintSeen?: boolean
  addressVi: string
  addressPt: string
  addressDe: string
  ptSpeaker: 'obrigado' | 'obrigada'
  viContact: 'phone' | 'zalo'
  retention: number
  personalNote: string
  /** `auto` follows the card on the phrase page. A number is kept until automatic is chosen again. */
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
  /** Cards replaced while reading IndexedDB. Not stored and not exported. */
  repaired?: number
}

export const defaultSettings: Settings = {
  appLang: null,
  targetLang: null,
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

const ADDRESS_VI = new Set(['anh', 'chi', 'em', 'co', 'chu', 'bac', 'ong', 'ba'])
const ADDRESS_PT = new Set(['voce', 'senhor', 'senhora'])
const ADDRESS_DE = new Set(['sie', 'du'])

/**
 * A stored `speed` is a deliberate choice and wins.
 * Version 0.1.0 had only `slow`. `true` becomes fixed 85 %.
 * `false` or a missing flag is the old default and becomes automatic.
 */
export function normalizeSpeed(speed: unknown, slow: unknown): SpeedChoice {
  if (speed === 'auto' || speed === 0.7 || speed === 0.85 || speed === 1) return speed
  if (slow === true) return 0.85
  return 'auto'
}

/** A voice id is a short token. Spaces and other characters never name a bundled voice. */
export const VOICE_ID = /^[a-z0-9_-]{1,40}$/

export function cleanVoices(value: unknown): VoiceMap | undefined {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return undefined
  const voices: VoiceMap = {}
  for (const [key, entry] of Object.entries(value)) {
    if (!isLang(key) || typeof entry !== 'string' || !VOICE_ID.test(entry) || !isBundledVoiceId(key, entry)) continue
    voices[key] = entry
  }
  return Object.keys(voices).length > 0 ? voices : undefined
}

/** Same bound as the import: 500 characters, and no control characters except newline and tab. */
export function cleanPersonalNote(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.replace(/[^\P{C}\n\t]/gu, '').slice(0, 500)
}

/**
 * Reads a stored settings row.
 * Before 0.3.0 the row had `pairId` and `uiLang`. The app language becomes the
 * old source language, not a German interface laid over another source.
 */
export function coerceSettings(raw: Partial<Settings> & { slow?: boolean; pairId?: string | null; uiLang?: string }): Settings {
  const legacy = legacyDirection(raw.pairId)
  const appLang = isLang(raw.appLang) ? raw.appLang : (legacy?.app ?? null)
  let targetLang = isLang(raw.targetLang) ? raw.targetLang : (legacy?.target ?? null)
  if (targetLang === appLang) targetLang = null
  return {
    appLang,
    targetLang,
    viRegion: raw.viRegion === 'north' ? 'north' : 'south',
    ...(cleanVoices(raw.voices) ? { voices: cleanVoices(raw.voices) } : {}),
    ...(raw.voiceHintSeen === true ? { voiceHintSeen: true } : {}),
    addressVi: typeof raw.addressVi === 'string' && ADDRESS_VI.has(raw.addressVi) ? raw.addressVi : defaultSettings.addressVi,
    addressPt: typeof raw.addressPt === 'string' && ADDRESS_PT.has(raw.addressPt) ? raw.addressPt : defaultSettings.addressPt,
    addressDe: typeof raw.addressDe === 'string' && ADDRESS_DE.has(raw.addressDe) ? raw.addressDe : defaultSettings.addressDe,
    ptSpeaker: raw.ptSpeaker === 'obrigada' ? 'obrigada' : 'obrigado',
    viContact: raw.viContact === 'zalo' ? 'zalo' : 'phone',
    retention: typeof raw.retention === 'number' && raw.retention >= 0.8 && raw.retention <= 0.97 ? raw.retention : defaultSettings.retention,
    personalNote: cleanPersonalNote(raw.personalNote),
    speed: normalizeSpeed(raw.speed, raw.slow),
  }
}

export function usesLang(settings: Settings, lang: Lang): boolean {
  return settings.appLang === lang || settings.targetLang === lang
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
