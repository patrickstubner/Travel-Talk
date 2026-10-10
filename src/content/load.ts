import { rawCatalog } from '../../content/index'
import { catalogSchema, type Catalog } from '../domain/schema'

export type LoadResult = { ok: true; catalog: Catalog } | { ok: false }

export function tryLoadCatalog(): LoadResult {
  const parsed = catalogSchema.safeParse(rawCatalog)
  if (!parsed.success) return { ok: false }
  const ids = parsed.data.concepts.map((concept) => concept.id)
  if (new Set(ids).size !== ids.length) return { ok: false }
  const situationIds = new Set(parsed.data.situations.map((situation) => situation.id))
  for (const concept of parsed.data.concepts) {
    if (concept.situationIds.some((id) => !situationIds.has(id))) return { ok: false }
    const langs = new Set(concept.realizations.map((row) => row.lang))
    if (langs.size < 4) return { ok: false }
  }
  return { ok: true, catalog: parsed.data }
}

export function requireCatalog(): Catalog {
  const loaded = tryLoadCatalog()
  if (!loaded.ok) {
    throw new Error('CATALOG_INVALID')
  }
  return loaded.catalog
}
