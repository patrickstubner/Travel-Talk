import type { Lang } from '../../content/phrase'
import { pairById } from '../domain/pairs'
import type { Settings } from '../storage/types'

export const LANG_LABEL: Record<Lang, Record<Lang, string>> = {
  de: {
    de: 'Deutsch',
    en: 'German',
    'pt-BR': 'alemão',
    vi: 'tiếng Đức',
  },
  en: {
    de: 'Englisch',
    en: 'English',
    'pt-BR': 'inglês',
    vi: 'tiếng Anh',
  },
  'pt-BR': {
    de: 'Portugiesisch (Brasilien)',
    en: 'Portuguese (Brazil)',
    'pt-BR': 'português (Brasil)',
    vi: 'tiếng Bồ Đào Nha (Brasil)',
  },
  vi: {
    de: 'Vietnamesisch',
    en: 'Vietnamese',
    'pt-BR': 'vietnamita',
    vi: 'tiếng Việt',
  },
}

export function interfaceLang(settings: Settings): Lang {
  if (settings.uiLang === 'source' && settings.pairId) {
    return pairById(settings.pairId)?.source ?? 'de'
  }
  return 'de'
}

export function htmlLang(lang: Lang): string {
  if (lang === 'de') return 'de-CH'
  return lang
}
