import type { Lang } from '../../content/phrase'

export const APP_LANGS = ['de', 'en', 'pt-BR', 'vi'] as const

const LONG: Record<string, Lang> = {
  de: 'de',
  en: 'en',
  pt: 'pt-BR',
  vi: 'vi',
}

export function shortLang(lang: Lang): string {
  return lang === 'pt-BR' ? 'pt' : lang
}

export function isLang(value: unknown): value is Lang {
  return value === 'de' || value === 'en' || value === 'pt-BR' || value === 'vi'
}

/** Twelve directions. The same language twice is not a direction. */
export function directionId(app: Lang, target: Lang): string | null {
  if (app === target) return null
  return `${shortLang(app)}-${shortLang(target)}`
}

export function directionLangs(id: string): { app: Lang; target: Lang } | null {
  const parts = id.split('-')
  if (parts.length !== 2) return null
  const app = LONG[parts[0] ?? '']
  const target = LONG[parts[1] ?? '']
  if (!app || !target || app === target) return null
  return { app, target }
}

export function allDirectionIds(): string[] {
  const ids: string[] = []
  for (const app of APP_LANGS) {
    for (const target of APP_LANGS) {
      const id = directionId(app, target)
      if (id) ids.push(id)
    }
  }
  return ids
}

/** Pairs shipped before 0.3.0. Used only to read old settings and old files. */
const LEGACY: Record<string, { app: Lang; target: Lang }> = {
  'de-vi': { app: 'de', target: 'vi' },
  'de-pt': { app: 'de', target: 'pt-BR' },
  'pt-de': { app: 'pt-BR', target: 'de' },
  'en-pt': { app: 'en', target: 'pt-BR' },
  'pt-en': { app: 'pt-BR', target: 'en' },
  'pt-vi': { app: 'pt-BR', target: 'vi' },
  'vi-pt': { app: 'vi', target: 'pt-BR' },
}

export function legacyDirection(pairId: string | null | undefined): { app: Lang; target: Lang } | null {
  if (!pairId) return null
  return LEGACY[pairId] ?? null
}
