import { addressForms, applyAddress, hasAddressToken } from '../../content/address'
import type { Concept, Lang, Realization } from '../../content/phrase'
import type { Catalog } from '../domain/schema'

export type Playback = {
  text: string
  speech: string
  file: string
  variantId: string
}

/** Optional voice folder, then the concept file. The voice id matches `^[a-z0-9_-]{1,40}$`. */
export const AUDIO_FILE = /^(de|en|pt-BR|vi)\/(?:[a-z0-9_-]{1,40}\/)?[a-z0-9.-]+__(south|north|any)__[a-z0-9-]+(\.r70|\.r85)?\.m4a$/

const VOICE_FOLDER = /^[a-z0-9_-]{1,40}$/

/** Legacy files stay at `{lang}/{concept}…`. Another voice inserts its id after the language. */
export function voiceFile(file: string, voiceId: string, legacy: boolean): string {
  if (legacy || !VOICE_FOLDER.test(voiceId)) return file
  const slash = file.indexOf('/')
  if (slash < 1) return file
  const rest = file.slice(slash + 1)
  if (rest.startsWith(`${voiceId}/`)) return file
  return `${file.slice(0, slash)}/${voiceId}/${rest}`
}

export function regionKey(realization: Realization): 'south' | 'north' | 'any' {
  return realization.region ?? 'any'
}

export function pickRealization(
  concept: Concept,
  lang: Lang,
  viRegion: 'south' | 'north',
): Realization | undefined {
  const rows = concept.realizations.filter((row) => row.lang === lang)
  if (rows.length === 0) return undefined
  if (lang !== 'vi') return rows[0]
  return rows.find((row) => row.region === viRegion) ?? rows.find((row) => row.region == null) ?? rows[0]
}

function stem(lang: Lang, conceptId: string, region: string, variant: string): string {
  return `${lang}/${conceptId}__${region}__${variant}`
}

export function resolvePlayback(
  concept: Concept,
  lang: Lang,
  viRegion: 'south' | 'north',
  prefs: string[],
): Playback | undefined {
  const realization = pickRealization(concept, lang, viRegion)
  if (!realization) return undefined
  const templateText = realization.text
  const templateSpeech = realization.speech ?? realization.text
  const region = regionKey(realization)
  if (hasAddressToken(templateText) || hasAddressToken(templateSpeech)) {
    const forms = addressForms(lang)
    const chosen = forms.find((form) => prefs.includes(form.id)) ?? forms[0]
    if (!chosen) return undefined
    const fileStem = stem(lang, concept.id, region, chosen.id)
    return {
      text: applyAddress(templateText, chosen.insert),
      speech: applyAddress(templateSpeech, chosen.insert),
      file: `${fileStem}.m4a`,
      variantId: chosen.id,
    }
  }
  const chosen = realization.variants?.find((variant) => prefs.includes(variant.id))
  const text = chosen?.text ?? templateText
  const speech = chosen?.speech ?? chosen?.text ?? templateSpeech
  const variantId = chosen && speech !== templateSpeech ? chosen.id : 'base'
  const fileStem = stem(lang, concept.id, region, variantId)
  return {
    text,
    speech,
    file: `${fileStem}.m4a`,
    variantId,
  }
}

export type SpeechLine = { file: string; lang: Lang; text: string }

export function allSpeechLines(concepts: Concept[]): SpeechLine[] {
  const lines: SpeechLine[] = []
  for (const concept of concepts) {
    for (const realization of concept.realizations) {
      const region = regionKey(realization)
      const templateSpeech = realization.speech ?? realization.text
      if (hasAddressToken(realization.text) || hasAddressToken(templateSpeech)) {
        for (const form of addressForms(realization.lang)) {
          lines.push({
            file: `${stem(realization.lang, concept.id, region, form.id)}.m4a`,
            lang: realization.lang,
            text: applyAddress(templateSpeech, form.insert),
          })
        }
        continue
      }
      lines.push({
        file: `${stem(realization.lang, concept.id, region, 'base')}.m4a`,
        lang: realization.lang,
        text: templateSpeech,
      })
      for (const variant of realization.variants ?? []) {
        const speech = variant.speech ?? variant.text
        if (speech === templateSpeech) continue
        lines.push({
          file: `${stem(realization.lang, concept.id, region, variant.id)}.m4a`,
          lang: realization.lang,
          text: speech,
        })
      }
    }
  }
  return lines
}

export function conceptsForSituation(catalog: Catalog, situationId: string): Concept[] {
  return catalog.concepts
    .filter((concept) => concept.situationIds.includes(situationId))
    .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id))
}

export function isStale(checkedAt: string, now: Date): boolean {
  const then = Date.parse(`${checkedAt}T00:00:00Z`)
  if (Number.isNaN(then)) return true
  return now.getTime() - then > 183 * 24 * 60 * 60 * 1000
}
