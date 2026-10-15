import type { Lang } from '../../content/phrase'
import { voiceFile } from '../content/resolve'
import type { Settings } from '../storage/types'

/**
 * A bundled voice, or a later paid voice that is not in the repo yet.
 * `bundled: false` stays out of the picker. Adding Azure is another entry, not a new field.
 * XTTS clips are pre-rendered. The app does not load that model.
 */
export type VoiceProvider = 'piper' | 'xtts' | 'azure'

export type CatalogVoice = {
  id: string
  lang: Lang
  gender: 'male' | 'female'
  provider: VoiceProvider
  bundled: boolean
  /** Files from before 0.4.0, with no voice folder. */
  legacy: boolean
  /** New users start on this voice. */
  defaultNew: boolean
  order: number
}

/**
 * Trial speaker. She stays until Patrick turns this off.
 * To remove her: set this to false, delete public/audio/pt-BR/claribel-dervla,
 * and delete the Claribel lines in src/i18n/dictionary.ts.
 * The generator entry is the last item of SPEAKERS in tools/generate_xtts.py.
 */
export const SHIP_CLARIBEL = true

const CLARIBEL: CatalogVoice = {
  id: 'claribel-dervla',
  lang: 'pt-BR',
  gender: 'female',
  provider: 'xtts',
  bundled: true,
  legacy: false,
  defaultNew: false,
  order: 6,
}

export const VOICES: readonly CatalogVoice[] = [
  { id: 'thorsten-high', lang: 'de', gender: 'male', provider: 'piper', bundled: true, legacy: false, defaultNew: true, order: 1 },
  { id: 'thorsten', lang: 'de', gender: 'male', provider: 'piper', bundled: true, legacy: true, defaultNew: false, order: 2 },
  // MLS speaker 4576, Piper id 153. Optional. CC BY 4.0, trained from scratch. Not the default.
  { id: 'mls-4576', lang: 'de', gender: 'female', provider: 'piper', bundled: true, legacy: false, defaultNew: false, order: 3 },
  { id: 'joe', lang: 'en', gender: 'male', provider: 'piper', bundled: true, legacy: false, defaultNew: true, order: 1 },
  { id: 'ljspeech', lang: 'en', gender: 'female', provider: 'piper', bundled: true, legacy: true, defaultNew: false, order: 2 },
  { id: 'cadu', lang: 'pt-BR', gender: 'male', provider: 'piper', bundled: true, legacy: false, defaultNew: true, order: 1 },
  // The Piper model card does not state a gender. The dataset description calls the speaker male:
  // https://mozilladatacollective.com/datasets/cmiupazq801ftnv079bo1zu4h
  { id: 'faber', lang: 'pt-BR', gender: 'male', provider: 'piper', bundled: true, legacy: true, defaultNew: false, order: 2 },
  { id: 'daisy-studious', lang: 'pt-BR', gender: 'female', provider: 'xtts', bundled: true, legacy: false, defaultNew: false, order: 3 },
  { id: 'gracie-wise', lang: 'pt-BR', gender: 'female', provider: 'xtts', bundled: true, legacy: false, defaultNew: false, order: 4 },
  { id: 'tammie-ema', lang: 'pt-BR', gender: 'female', provider: 'xtts', bundled: true, legacy: false, defaultNew: false, order: 5 },
  ...(SHIP_CLARIBEL ? [CLARIBEL] : []),
  { id: 'vivos-22', lang: 'vi', gender: 'male', provider: 'piper', bundled: true, legacy: false, defaultNew: true, order: 1 },
  { id: 'vivos-32', lang: 'vi', gender: 'male', provider: 'piper', bundled: true, legacy: false, defaultNew: false, order: 2 },
  { id: 'vais1000', lang: 'vi', gender: 'female', provider: 'piper', bundled: true, legacy: true, defaultNew: false, order: 3 },
]

const PREVIEW: Record<Lang, string> = {
  de: 'de/emergency.help__any__base.m4a',
  en: 'en/emergency.help__any__base.m4a',
  'pt-BR': 'pt-BR/emergency.help__any__base.m4a',
  vi: 'vi/emergency.help__any__base.m4a',
}

/**
 * Hörprobe for a Piper voice: one greeting and a short introduction, at the
 * normal rate. Not a lesson clip, so there is no slow copy.
 * XTTS stays on the lesson clip. That model is CPML, non-commercial only,
 * so this version does not add a new sample for those speakers.
 */
export const VOICE_SAMPLE = 'voice.sample__any__base.m4a'

export function voicesFor(lang: Lang): CatalogVoice[] {
  return VOICES.filter((voice) => voice.lang === lang && voice.bundled).sort((a, b) => a.order - b.order)
}

/**
 * Male Piper voices used only to judge a pt-BR melody. The selected voice
 * is left out because the page already compares against it, and it is
 * still the one that plays. XTTS stays out: those clips are not male
 * references. No other language has this set.
 */
export function melodyReferenceVoices(lang: Lang, selectedId: string): CatalogVoice[] {
  if (lang !== 'pt-BR') return []
  return voicesFor(lang).filter((voice) => voice.provider === 'piper' && voice.gender === 'male' && voice.id !== selectedId)
}

/** A stored id is kept only when this build ships that voice. */
export function isBundledVoiceId(lang: Lang, id: string): boolean {
  return VOICES.some((voice) => voice.bundled && voice.lang === lang && voice.id === id)
}

export function legacyVoice(lang: Lang): CatalogVoice {
  const voice = voicesFor(lang).find((item) => item.legacy)
  if (!voice) throw new Error('VOICE_LEGACY')
  return voice
}

export function defaultVoice(lang: Lang): CatalogVoice {
  const voice = voicesFor(lang).find((item) => item.defaultNew)
  if (!voice) throw new Error('VOICE_DEFAULT')
  return voice
}

/** Voice ids other people still learn with. The active person's own choice is not included. */
export function voicesKeptByOthers(people: readonly { id: string; settings: Settings }[], activeId: string | undefined, lang: Lang): string[] {
  const ids = new Set<string>()
  for (const person of people) {
    if (person.id === activeId) continue
    if (person.settings.appLang !== lang && person.settings.targetLang !== lang && !(person.settings.moreTargets ?? []).includes(lang)) continue
    ids.add(selectedVoice(person.settings, lang).id)
  }
  return [...ids]
}

/** A stored id wins when this build can play it. Otherwise the pre-0.4.0 voice stays. */
export function selectedVoice(settings: Settings, lang: Lang): CatalogVoice {
  const id = settings.voices?.[lang]
  return voicesFor(lang).find((voice) => voice.id === id) ?? legacyVoice(lang)
}

export function spokenFile(settings: Settings, lang: Lang, file: string): string {
  const voice = selectedVoice(settings, lang)
  return voiceFile(file, voice.id, voice.legacy)
}

/**
 * Word clips ship with the default voice of each language, and with vivos-32.
 * thorsten, ljspeech, faber and vais1000 have the sentences only, so a word uses the default voice.
 */
export function spokenWordFile(settings: Settings, lang: Lang, file: string): string {
  const selected = selectedVoice(settings, lang)
  const voice = selected.legacy ? defaultVoice(lang) : selected
  return voiceFile(file, voice.id, false)
}

export function previewFile(lang: Lang, voice: CatalogVoice): string {
  if (voice.provider === 'xtts') return voiceFile(PREVIEW[lang], voice.id, voice.legacy)
  return voiceFile(`${lang}/${VOICE_SAMPLE}`, voice.id, voice.legacy)
}

/** Onboarding writes the male voice. An explicit choice is kept. Existing rows never come through here. */
export function withDefaultVoices(settings: Settings): Settings {
  const voices = { ...settings.voices }
  for (const lang of [settings.appLang, settings.targetLang]) {
    if (!lang) continue
    if (voices[lang] && voicesFor(lang).some((voice) => voice.id === voices[lang])) continue
    voices[lang] = defaultVoice(lang).id
  }
  return { ...settings, voices, voiceHintSeen: true }
}

export function filesForVoice(listed: Iterable<string>, lang: Lang, voice: CatalogVoice): string[] {
  const prefix = voice.legacy ? `${lang}/` : `${lang}/${voice.id}/`
  const files: string[] = []
  for (const file of listed) {
    if (!file.startsWith(prefix)) continue
    if (file.slice(prefix.length).includes('/')) continue
    files.push(file)
  }
  return files
}
