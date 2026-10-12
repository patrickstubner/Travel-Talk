import type { Lang } from '../../content/phrase'
import { isSpeedStep, type SpeedChoice, type SpeedStep } from '../audio/speed'
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
  /** Local only. Missing means the word mark is on. `false` turns it off. */
  highlightWords?: boolean
  addressVi: string
  addressPt: string
  addressDe: string
  ptSpeaker: 'obrigado' | 'obrigada'
  viContact: 'phone' | 'zalo'
  retention: number
  personalNote: string
  /** `auto` follows the card on the phrase page. A number is kept until automatic is chosen again. */
  speed: SpeedChoice
  /**
   * Tempo of single words for this person. Missing means 100 %.
   * Sentences keep `speed`. There is no automatic step for words.
   */
  wordSpeed?: SpeedStep
  /**
   * Other learning languages besides `targetLang`.
   * Today still practises one. The daily cap counts every direction of this person.
   */
  moreTargets?: Lang[]
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

/** At most ten people on one device. */
export const PERSON_LIMIT = 10

/** A display name is 1 to 40 characters. Control characters are refused. */
export const NAME_LIMIT = 40

/** Placeholder until the stage test exists. Every learning language starts here. */
export const LEVEL_PLACEHOLDER = 0 as const

export type PersonRecord = {
  id: string
  name: string
  level: typeof LEVEL_PLACEHOLDER
  settings: Settings
}

export type ProgressSnapshot = {
  settings: Settings
  cards: StoredCard[]
  /** Cards replaced while reading IndexedDB. Not stored and not exported. */
  repaired?: number
  /** Every person on the device. The active one's settings are also `settings`. */
  people?: PersonRecord[]
  activePersonId?: string
}

export type ImportedPerson = {
  name: string
  settings: Settings
  cards: StoredCard[]
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

/** Hangul fillers and the blank braille cell look empty but are not whitespace. */
const INVISIBLE_NAME = /[\p{Z}\p{Mn}\p{Me}\u115F\u1160\u3164\uFFA0\u2800]/gu

const ZWJ = '\u200D'

function isPictograph(char: string): boolean {
  return /\p{Extended_Pictographic}/u.test(char)
}

/** A variation selector or skin tone may sit between the pictograph and the joiner. */
function isEmojiGap(char: string): boolean {
  return char === '\uFE0F' || /\p{Emoji_Modifier}/u.test(char)
}

function emojiBeside(chars: readonly string[], index: number, step: number): boolean {
  let cursor = index + step
  while (cursor >= 0 && cursor < chars.length && isEmojiGap(chars[cursor] ?? '')) cursor += step
  return cursor >= 0 && cursor < chars.length && isPictograph(chars[cursor] ?? '')
}

/**
 * NFC, then no control characters, except a ZWJ that joins two emoji.
 * A name needs 1 to 40 characters and at least one that is actually visible.
 */
export function cleanPersonName(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const chars = [...value.normalize('NFC').replace(/[^\P{C}\u200D]/gu, '')]
  const kept: string[] = []
  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index] ?? ''
    if (char === ZWJ && !(emojiBeside(chars, index, -1) && emojiBeside(chars, index, 1))) continue
    kept.push(char)
  }
  const stripped = kept.join('').trim()
  if (stripped.length < 1 || stripped.length > NAME_LIMIT) return null
  if (stripped.replace(INVISIBLE_NAME, '').length < 1) return null
  return stripped
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
    ...(raw.highlightWords === false ? { highlightWords: false } : {}),
    addressVi: typeof raw.addressVi === 'string' && ADDRESS_VI.has(raw.addressVi) ? raw.addressVi : defaultSettings.addressVi,
    addressPt: typeof raw.addressPt === 'string' && ADDRESS_PT.has(raw.addressPt) ? raw.addressPt : defaultSettings.addressPt,
    addressDe: typeof raw.addressDe === 'string' && ADDRESS_DE.has(raw.addressDe) ? raw.addressDe : defaultSettings.addressDe,
    ptSpeaker: raw.ptSpeaker === 'obrigada' ? 'obrigada' : 'obrigado',
    viContact: raw.viContact === 'zalo' ? 'zalo' : 'phone',
    retention: typeof raw.retention === 'number' && raw.retention >= 0.8 && raw.retention <= 0.97 ? raw.retention : defaultSettings.retention,
    personalNote: cleanPersonalNote(raw.personalNote),
    speed: normalizeSpeed(raw.speed, raw.slow),
    ...(isSpeedStep(raw.wordSpeed) ? { wordSpeed: raw.wordSpeed } : {}),
    ...(cleanMoreTargets(raw.moreTargets, appLang, targetLang).length > 0
      ? { moreTargets: cleanMoreTargets(raw.moreTargets, appLang, targetLang) }
      : {}),
  }
}

function cleanMoreTargets(value: unknown, appLang: Lang | null, targetLang: Lang | null): Lang[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<Lang>()
  for (const entry of value) {
    if (!isLang(entry) || entry === appLang || entry === targetLang || seen.has(entry)) continue
    seen.add(entry)
  }
  return [...seen]
}

export function usesLang(settings: Settings, lang: Lang): boolean {
  return settings.appLang === lang || settings.targetLang === lang || (settings.moreTargets ?? []).includes(lang)
}

export interface ProgressRepository {
  load(): Promise<ProgressSnapshot>
  /** Writes this person, even if another person is active by the time the write runs. */
  saveSettings(personId: string, settings: Settings): Promise<void>
  saveCard(personId: string, card: StoredCard): Promise<void>
  /** Replaces this person's settings and cards. Other people stay. */
  replaceAll(personId: string, snapshot: ProgressSnapshot): Promise<void>
  addPerson(name: string): Promise<boolean>
  renamePerson(id: string, name: string): Promise<boolean>
  deletePerson(id: string): Promise<void>
  switchPerson(id: string): Promise<void>
  /** `personId` is the person a replace writes. Add ignores it and creates a new row. */
  importPerson(mode: 'replace' | 'add', person: ImportedPerson, keepLocal?: Settings, personId?: string): Promise<'ok' | 'full'>
  importAll(people: readonly ImportedPerson[]): Promise<void>
  everyone(): Promise<ImportedPerson[]>
}

export function prefsFromSettings(lang: string, settings: Settings): string[] {
  if (lang === 'vi') return [settings.addressVi, settings.viContact]
  if (lang === 'pt-BR') return [settings.addressPt, settings.ptSpeaker]
  if (lang === 'de') return [settings.addressDe]
  return []
}
