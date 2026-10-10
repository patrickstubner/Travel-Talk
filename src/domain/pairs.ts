import type { Lang } from '../../content/phrase'

export const PAIRS = [
  { id: 'de-vi', source: 'de', target: 'vi' },
  { id: 'de-pt', source: 'de', target: 'pt-BR' },
  { id: 'pt-de', source: 'pt-BR', target: 'de' },
  { id: 'en-pt', source: 'en', target: 'pt-BR' },
  { id: 'pt-en', source: 'pt-BR', target: 'en' },
  { id: 'pt-vi', source: 'pt-BR', target: 'vi' },
  { id: 'vi-pt', source: 'vi', target: 'pt-BR' },
] as const

export type PairId = (typeof PAIRS)[number]['id']

export function pairById(id: string | null): (typeof PAIRS)[number] | undefined {
  return PAIRS.find((pair) => pair.id === id)
}

export function pairUses(pairId: string | null, lang: Lang): boolean {
  const pair = pairById(pairId)
  if (!pair) return false
  return pair.source === lang || pair.target === lang
}
