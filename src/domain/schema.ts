import { z } from 'zod'

const lang = z.enum(['de', 'en', 'pt-BR', 'vi'])

const text4 = z.strictObject({
  de: z.string().min(1).max(5000),
  en: z.string().min(1).max(5000),
  'pt-BR': z.string().min(1).max(5000),
  vi: z.string().min(1).max(5000),
})

const source = z.strictObject({
  title: z.string().min(1).max(240),
  url: z.string().regex(/^https:\/\/\S+$/),
  accessed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

const variant = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().min(1).max(40),
  text: z.string().min(1).max(400),
  speech: z.string().min(1).max(400).optional(),
  note: z.string().max(400).optional(),
})

const realization = z.strictObject({
  lang,
  region: z.enum(['south', 'north']).optional(),
  text: z.string().min(1).max(400),
  speech: z.string().min(1).max(400).optional(),
  geprueft: z.boolean(),
  variants: z.array(variant).min(1).optional(),
})

export const conceptSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9.-]+$/),
  situationIds: z.array(z.string().regex(/^[a-z0-9-]+$/)).min(1),
  priority: z.number().int().min(1).max(5),
  register: z.enum(['formal', 'neutral', 'informal']),
  tags: z.array(z.string().regex(/^[a-z0-9-]+$/)),
  context: text4,
  realizations: z.array(realization).min(4),
})

export const situationSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+$/),
  order: z.number().int(),
  depth: z.enum(['core', 'sample', 'starter']),
  title: text4,
  summary: text4,
})

export const cultureSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+$/),
  situationIds: z.array(z.string()).min(1),
  regions: z.array(z.enum(['VN', 'BR', 'DE-CH', 'EN'])).min(1),
  title: text4,
  body: text4,
  sources: z.array(source).min(1),
  geprueft: z.boolean(),
})

export const infoSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+$/),
  situationId: z.string(),
  country: z.enum(['VN', 'BR', 'DE-CH', 'EN']),
  checkedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: text4,
  body: text4,
  sources: z.array(source).min(1),
  geprueft: z.boolean(),
})

export const pairNoteSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+$/),
  sourceLang: lang,
  targetLang: lang,
  conceptId: z.string().optional(),
  text: text4,
})

export const catalogSchema = z.strictObject({
  situations: z.array(situationSchema).min(1),
  concepts: z.array(conceptSchema).min(1),
  cultureNotes: z.array(cultureSchema),
  infoCards: z.array(infoSchema),
  pairNotes: z.array(pairNoteSchema),
})

export type Catalog = z.infer<typeof catalogSchema>
