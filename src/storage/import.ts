import { z } from 'zod'
import { PAIRS } from '../domain/pairs'
import { defaultSettings, type ProgressSnapshot, type Settings } from './types'

export const IMPORT_LIMIT = 2_000_000

const pairIds = PAIRS.map((pair) => pair.id) as [string, ...string[]]

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

const cardSchema = z.strictObject({
  cardId: z.string().regex(/^[a-z0-9-]+:[a-z0-9.-]+$/),
  due: z.string().refine((value) => !Number.isNaN(Date.parse(value))),
  stability: z.number().finite().min(0).max(100000),
  difficulty: z.number().finite().min(0).max(10),
  elapsed_days: z.number().finite().min(0).max(100000),
  scheduled_days: z.number().finite().min(0).max(100000),
  learning_steps: z.number().int().min(0).max(100),
  reps: z.number().int().min(0).max(100000),
  lapses: z.number().int().min(0).max(100000),
  state: z.number().int().min(0).max(3),
  last_review: z.string().nullable().refine((value) => value == null || !Number.isNaN(Date.parse(value))),
})

const bundleSchema = z.strictObject({
  app: z.literal('travel-talk'),
  format: z.literal(1),
  exportedAt: z.string().max(40),
  settings: settingsSchema,
  cards: z.array(cardSchema).max(2000),
})

function parseJson(text: string): unknown {
  return JSON.parse(text, (key, value) => {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') return undefined
    return value as unknown
  }) as unknown
}

export function parseImport(text: string): ProgressSnapshot {
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
  return {
    settings: parsed.data.settings as Settings,
    cards: parsed.data.cards,
  }
}

export function toExport(snapshot: ProgressSnapshot, now: Date): string {
  return JSON.stringify(
    {
      app: 'travel-talk',
      format: 1,
      exportedAt: now.toISOString(),
      settings: snapshot.settings,
      cards: snapshot.cards,
    },
    null,
    2,
  )
}

export function emptySnapshot(): ProgressSnapshot {
  return { settings: { ...defaultSettings }, cards: [] }
}
