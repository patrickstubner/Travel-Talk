import '../zod-setup'
import { z } from 'zod'
import { PAIRS } from '../domain/pairs'
import { defaultSettings, type ProgressSnapshot, type Settings, type StoredCard } from './types'

export const IMPORT_LIMIT = 2_000_000

const pairIds = PAIRS.map((pair) => pair.id) as [string, ...string[]]
const knownPairs = new Set<string>(pairIds)

const settingsSchema = z.strictObject({
  pairId: z.enum(pairIds).nullable(),
  uiLang: z.enum(['de', 'source']),
  viRegion: z.enum(['south', 'north']),
  addressVi: z.enum(['anh', 'chi', 'em', 'co', 'chu', 'bac', 'ong', 'ba']),
  addressPt: z.enum(['voce', 'senhor', 'senhora']),
  addressDe: z.enum(['sie', 'du']),
  ptSpeaker: z.enum(['obrigado', 'obrigada']),
  viContact: z.enum(['phone', 'zalo']),
  retention: z.number().finite().min(0.8).max(0.97),
  personalNote: z.string().max(500).refine((value) => !/[^\P{C}\n\t]/u.test(value)),
  slow: z.boolean(),
})

const stamp = z.iso.datetime().max(40)

const cardSchema = z.strictObject({
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

const bundleSchema = z.strictObject({
  app: z.literal('travel-talk'),
  format: z.literal(1),
  exportedAt: z.string().max(40),
  settings: settingsSchema,
  cards: z.array(cardSchema).max(2000),
})

export type ImportOutcome = {
  snapshot: ProgressSnapshot
  skipped: number
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

function knownCard(cardId: string, conceptIds: ReadonlySet<string>): boolean {
  const split = cardId.indexOf(':')
  if (split < 1) return false
  const pairId = cardId.slice(0, split)
  const conceptId = cardId.slice(split + 1)
  return knownPairs.has(pairId) && conceptIds.has(conceptId)
}

export function parseImport(text: string, conceptIds: ReadonlySet<string>): ImportOutcome {
  if (text.length > IMPORT_LIMIT) throw new Error('IMPORT_REJECTED')
  let raw: unknown
  try {
    raw = parseJson(text)
  } catch {
    throw new Error('IMPORT_REJECTED')
  }
  const parsed = bundleSchema.safeParse(raw)
  if (!parsed.success) throw new Error('IMPORT_REJECTED')
  const ids = parsed.data.cards.map((card) => card.cardId)
  if (new Set(ids).size !== ids.length) throw new Error('IMPORT_REJECTED')
  const cards: StoredCard[] = []
  let skipped = 0
  for (const card of parsed.data.cards) {
    if (!knownCard(card.cardId, conceptIds)) {
      skipped += 1
      continue
    }
    cards.push(card)
  }
  return {
    snapshot: {
      settings: parsed.data.settings as Settings,
      cards,
    },
    skipped,
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
  return incoming.trim().length > 0 ? incoming : current
}

export function toExport(snapshot: ProgressSnapshot, now: Date, includeNote = false): string {
  const settings = includeNote ? snapshot.settings : { ...snapshot.settings, personalNote: '' }
  return JSON.stringify(
    {
      app: 'travel-talk',
      format: 1,
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
