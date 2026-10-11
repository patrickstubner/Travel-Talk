import '../zod-setup'
import { z } from 'zod'
import { PAIRS } from '../domain/pairs'
import { directionLangs, legacyDirection } from '../domain/direction'
import { capDueIso } from '../srs/scheduler'
import { VOICE_ID, cleanVoices, defaultSettings, normalizeSpeed, type ProgressSnapshot, type Settings, type StoredCard } from './types'

export const IMPORT_LIMIT = 2_000_000

/** Current export. Bump this whenever the exported shape changes. */
export const EXPORT_FORMAT = 3

export const IMPORT_NEWER = 'IMPORT_NEWER'

/** The file claims it was written more than a day ahead of this clock. */
export const IMPORT_FUTURE = 'IMPORT_FUTURE'

const DAY_MS = 86_400_000

const pairIds = PAIRS.map((pair) => pair.id) as [string, ...string[]]
const lang = z.enum(['de', 'en', 'pt-BR', 'vi'])
const speedChoice = z.union([z.literal('auto'), z.literal(0.7), z.literal(0.85), z.literal(1)])

const sharedFields = {
  viRegion: z.enum(['south', 'north']),
  addressVi: z.enum(['anh', 'chi', 'em', 'co', 'chu', 'bac', 'ong', 'ba']),
  addressPt: z.enum(['voce', 'senhor', 'senhora']),
  addressDe: z.enum(['sie', 'du']),
  ptSpeaker: z.enum(['obrigado', 'obrigada']),
  viContact: z.enum(['phone', 'zalo']),
  retention: z.number().finite().min(0.8).max(0.97),
  personalNote: z.string().max(500).refine((value) => !/[^\P{C}\n\t]/u.test(value)),
}

const legacyFields = {
  pairId: z.enum(pairIds).nullable(),
  uiLang: z.enum(['de', 'source']),
  ...sharedFields,
}

/** Format 1, unchanged: optional `slow` from 0.1.0, optional `speed`, `pairId` and `uiLang`. */
const settingsSchemaV1 = z.strictObject({
  ...legacyFields,
  slow: z.boolean().optional(),
  speed: speedChoice.optional(),
})

/** Format 2 requires `speed` and forbids `slow`. It still carries `pairId` and `uiLang`. */
const settingsSchemaV2 = z.strictObject({
  ...legacyFields,
  speed: speedChoice,
})

const voicesSchema = z
  .strictObject({
    de: z.string().regex(VOICE_ID).optional(),
    en: z.string().regex(VOICE_ID).optional(),
    'pt-BR': z.string().regex(VOICE_ID).optional(),
    vi: z.string().regex(VOICE_ID).optional(),
  })
  .optional()

/** Format 3 stores the two languages. `pairId` and `uiLang` are not fields. */
const settingsSchemaV3 = z.strictObject({
  appLang: lang,
  targetLang: lang,
  ...sharedFields,
  speed: speedChoice,
  voices: voicesSchema,
})

const stamp = z.iso.datetime().max(40)

export const storedCardSchema = z.strictObject({
  cardId: z.string().max(80).regex(/^[a-z0-9-]+:[a-z0-9.-]+$/),
  due: stamp,
  stability: z.number().finite().min(0).max(100000),
  difficulty: z.number().finite().min(0).max(10),
  elapsed_days: z.number().finite().min(0).max(100000),
  scheduled_days: z.number().finite().min(0).max(100000),
  learning_steps: z.number().int().min(0).max(100),
  reps: z.number().int().min(0).max(100000),
  lapses: z.number().int().min(0).max(100000),
  state: z.number().int().min(0).max(3),
  last_review: stamp.nullable(),
})

const bundleEnvelope = {
  app: z.literal('travel-talk'),
  exportedAt: z.iso.datetime().max(40),
  cards: z.array(storedCardSchema).max(2000),
}

const bundleSchema = z.discriminatedUnion('format', [
  z.strictObject({
    ...bundleEnvelope,
    format: z.literal(1),
    settings: settingsSchemaV1,
  }),
  z.strictObject({
    ...bundleEnvelope,
    format: z.literal(2),
    settings: settingsSchemaV2,
  }),
  z.strictObject({
    ...bundleEnvelope,
    format: z.literal(3),
    settings: settingsSchemaV3,
  }),
])

export type ImportOutcome = {
  snapshot: ProgressSnapshot
  skipped: number
  /** Format 1 or 2 kept the old source language when the interface was German. */
  uiNotRelabeled: boolean
}

export type ImportPreview = {
  cards: number
  earliest: string | null
  latest: string | null
  hasNote: boolean
}

function parseJson(text: string): unknown {
  return JSON.parse(text, (key, value) => {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') return undefined
    return value as unknown
  }) as unknown
}

/**
 * Reads only `app` and `format`, before the strict schema looks at the rest.
 * The update message is only for a safe integer above the current format.
 * 2.5, 1e308, Infinity (JSON `1e400`) and a string such as `"3"` fall through
 * to the generic rejection.
 */
function isNewerExport(raw: unknown): boolean {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return false
  const header = raw as { app?: unknown; format?: unknown }
  const format = header.format
  return header.app === 'travel-talk' && typeof format === 'number' && Number.isSafeInteger(format) && format > EXPORT_FORMAT
}

/** A review a few seconds after the export, or ahead of this clock, stays in the file. */
function capLastReview(value: string | null, exportedAt: number, now: number): string | null {
  if (!value) return null
  const reviewed = Date.parse(value)
  const cap = Math.min(reviewed, exportedAt, now)
  if (cap === reviewed) return value
  return new Date(cap).toISOString()
}

function knownCard(cardId: string, conceptIds: ReadonlySet<string>): boolean {
  const split = cardId.indexOf(':')
  if (split < 1) return false
  const direction = cardId.slice(0, split)
  const conceptId = cardId.slice(split + 1)
  return directionLangs(direction) != null && conceptIds.has(conceptId)
}

export function parseImport(text: string, conceptIds: ReadonlySet<string>): ImportOutcome {
  if (text.length > IMPORT_LIMIT) throw new Error('IMPORT_REJECTED')
  let raw: unknown
  try {
    raw = parseJson(text)
  } catch {
    throw new Error('IMPORT_REJECTED')
  }
  if (isNewerExport(raw)) throw new Error(IMPORT_NEWER)
  const parsed = bundleSchema.safeParse(raw)
  if (!parsed.success) throw new Error('IMPORT_REJECTED')
  if (parsed.data.format === 3 && parsed.data.settings.appLang === parsed.data.settings.targetLang) throw new Error('IMPORT_REJECTED')
  const exportedAt = Date.parse(parsed.data.exportedAt)
  if (!Number.isFinite(exportedAt)) throw new Error('IMPORT_REJECTED')
  const now = Date.now()
  if (exportedAt > now + DAY_MS) throw new Error(IMPORT_FUTURE)
  const capped = parsed.data.cards.map((card) => {
    const lastReview = capLastReview(card.last_review, exportedAt, now)
    return {
      ...card,
      last_review: lastReview,
      due: capDueIso(card.due, lastReview, now),
    }
  })
  const ids = capped.map((card) => card.cardId)
  if (new Set(ids).size !== ids.length) throw new Error('IMPORT_REJECTED')
  const cards: StoredCard[] = []
  let skipped = 0
  for (const card of capped) {
    if (!knownCard(card.cardId, conceptIds)) {
      skipped += 1
      continue
    }
    cards.push(card)
  }
  const migrated = settingsFromBundle(parsed.data)
  return {
    snapshot: {
      settings: migrated.settings,
      cards,
    },
    skipped,
    uiNotRelabeled: migrated.uiNotRelabeled,
  }
}

function settingsFromBundle(data: z.infer<typeof bundleSchema>): { settings: Settings; uiNotRelabeled: boolean } {
  if (data.format === 3) {
    const voices = cleanVoices(data.settings.voices)
    const { voices: _voices, ...rest } = data.settings
    return { uiNotRelabeled: false, settings: voices ? { ...rest, voices } : rest }
  }
  const legacy = legacyDirection(data.settings.pairId)
  const uiNotRelabeled = data.settings.uiLang === 'de' && legacy != null && legacy.app !== 'de'
  const speed = data.format === 1 ? normalizeSpeed(data.settings.speed, data.settings.slow) : data.settings.speed
  const shared =
    data.format === 1
      ? (({ pairId: _pairId, uiLang: _uiLang, slow: _slow, speed: _speed, ...rest }) => rest)(data.settings)
      : (({ pairId: _pairId, uiLang: _uiLang, speed: _speed, ...rest }) => rest)(data.settings)
  return {
    uiNotRelabeled,
    settings: {
      ...shared,
      appLang: legacy?.app ?? null,
      targetLang: legacy?.target ?? null,
      speed,
    },
  }
}

export function previewImport(snapshot: ProgressSnapshot): ImportPreview {
  const times: number[] = []
  for (const card of snapshot.cards) {
    times.push(Date.parse(card.due))
    if (card.last_review) times.push(Date.parse(card.last_review))
  }
  const finite = times.filter((value) => !Number.isNaN(value)).sort((a, b) => a - b)
  const earliest = finite[0]
  const latest = finite[finite.length - 1]
  return {
    cards: snapshot.cards.length,
    earliest: earliest == null ? null : new Date(earliest).toISOString().slice(0, 10),
    latest: latest == null ? null : new Date(latest).toISOString().slice(0, 10),
    hasNote: snapshot.settings.personalNote.trim().length > 0,
  }
}

export function retainLocalNote(current: string, incoming: string): string {
  return importKeepsLocalNote(incoming) ? current : incoming
}

/** An empty or whitespace note keeps the local note. A missing `personalNote` field never reaches this function: the strict schema rejects the whole file. */
export function importKeepsLocalNote(incoming: string): boolean {
  return incoming.trim().length === 0
}

export function toExport(snapshot: ProgressSnapshot, now: Date, includeNote = false): string {
  const current = includeNote ? snapshot.settings : { ...snapshot.settings, personalNote: '' }
  const voices = cleanVoices(current.voices)
  const settings = {
    appLang: current.appLang,
    targetLang: current.targetLang,
    viRegion: current.viRegion,
    addressVi: current.addressVi,
    addressPt: current.addressPt,
    addressDe: current.addressDe,
    ptSpeaker: current.ptSpeaker,
    viContact: current.viContact,
    retention: current.retention,
    personalNote: current.personalNote,
    speed: current.speed,
    ...(voices ? { voices } : {}),
  }
  return JSON.stringify(
    {
      app: 'travel-talk',
      format: EXPORT_FORMAT,
      exportedAt: now.toISOString(),
      settings,
      cards: snapshot.cards,
    },
    null,
    2,
  )
}

export function emptySnapshot(): ProgressSnapshot {
  return { settings: { ...defaultSettings }, cards: [] }
}
