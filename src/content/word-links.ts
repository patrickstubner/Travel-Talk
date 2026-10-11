import { DE_ADDRESS, PT_ADDRESS, VI_ADDRESS } from '../../content/address'
import { linkWords, type WordLink } from '../../content/gloss'
import type { Lang } from '../../content/phrase'
import type { Settings } from '../storage/types'

export function addressInsert(lang: Lang, settings: Settings): string {
  if (lang === 'vi') return VI_ADDRESS.find((form) => form.id === settings.addressVi)?.insert ?? 'anh'
  if (lang === 'pt-BR') return PT_ADDRESS.find((form) => form.id === settings.addressPt)?.insert ?? 'você'
  if (lang === 'de') return DE_ADDRESS.find((form) => form.id === settings.addressDe)?.insert ?? 'Sie'
  return ''
}

export function linksFor(
  conceptId: string,
  targetLang: Lang,
  sourceLang: Lang,
  targetSpeech: string,
  sourceSpeech: string,
  settings: Settings,
): WordLink[] {
  return linkWords(
    conceptId,
    targetLang,
    settings.viRegion,
    targetSpeech,
    addressInsert(targetLang, settings),
    sourceLang,
    settings.viRegion,
    sourceSpeech,
    addressInsert(sourceLang, settings),
  )
}
