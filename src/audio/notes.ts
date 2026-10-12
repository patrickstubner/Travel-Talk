import { rawCatalog } from '../../content/index'
import type { Lang } from '../../content/phrase'
import type { Dictionary } from '../i18n/dictionary'
import { dictionaries } from '../i18n/dictionary'
import type { Settings } from '../storage/types'
import { selectedVoice } from './voices'
import type { SpeedChoice } from './speed'
import { helpFile, type ExplainPart } from './explain'

const LANGS = ['de', 'en', 'pt-BR', 'vi'] as const satisfies readonly Lang[]

export function fixedPart(lang: Lang, id: string, text: string): ExplainPart {
  return { text, clip: helpFile(lang, id) }
}

export function lineContext(copy: Dictionary, lang: Lang, conceptId: string, context: string): ExplainPart {
  return { text: `${copy.context}: ${context}`, clip: helpFile(lang, `ctx.${conceptId}`) }
}

export function pairPart(copy: Dictionary, lang: Lang, noteId: string, text: string): ExplainPart {
  return { text: `${copy.pairNote}: ${text}`, clip: helpFile(lang, `pair.${noteId}`) }
}

export function infoCardParts(
  copy: Dictionary,
  lang: Lang,
  card: { id: string; body: Record<Lang, string>; sources: { title: string }[] },
): ExplainPart[] {
  return [
    fixedPart(lang, `info.${card.id}`, card.body[lang]),
    fixedPart(lang, `info.${card.id}.sources`, `${copy.sources}: ${card.sources.map((source) => source.title).join(', ')}`),
  ]
}

export function speedPart(copy: Dictionary, lang: Lang, choice: SpeedChoice, percent: number): ExplainPart {
  const auto = choice === 'auto'
  return {
    text: auto ? copy.speedAutoHint(percent) : copy.speedFixedHint(percent),
    clip: helpFile(lang, auto ? `ui.speed-auto-${percent}` : `ui.speed-fixed-${percent}`),
  }
}

export function voiceCaption(copy: Dictionary, app: Lang, target: Lang, settings: Settings): ExplainPart {
  const id = selectedVoice(settings, target).id
  if (target === 'vi') {
    return id === 'vais1000' ? fixedPart(app, 'ui.voice-vi', copy.audioVi) : fixedPart(app, 'ui.voice-vi-male', copy.audioViMale)
  }
  if (target === 'de') {
    return id === 'thorsten-high' ? fixedPart(app, 'ui.voice-de-high', copy.audioDeHigh) : fixedPart(app, 'ui.voice-de', copy.audioDe)
  }
  if (target === 'en') {
    return id === 'joe' ? fixedPart(app, 'ui.voice-en-male', copy.audioEnMale) : fixedPart(app, 'ui.voice-en', copy.audioEn)
  }
  return id === 'cadu' ? fixedPart(app, 'ui.voice-pt-male', copy.audioPtMale) : fixedPart(app, 'ui.voice-pt', copy.audioPt)
}

function add(rows: Map<string, string>, part: ExplainPart): void {
  if (!part.clip) return
  const previous = rows.get(part.clip)
  if (previous != null && previous !== part.text) throw new Error(`HELP_DRIFT ${part.clip}`)
  rows.set(part.clip, part.text)
}

/** Every pre-rendered explanation, one clip per app language. Info-card essays are not in this list. */
export function collectHelpLines(): { file: string; text: string }[] {
  const rows = new Map<string, string>()
  for (const lang of LANGS) {
    const copy = dictionaries[lang]
    add(rows, fixedPart(lang, 'ui.example', copy.exampleAudio))
    add(rows, fixedPart(lang, 'ui.mic', copy.micHint))
    add(rows, fixedPart(lang, 'ui.unchecked', copy.uncheckedCalm))
    add(rows, fixedPart(lang, 'ui.gloss', copy.glossUnchecked))
    add(rows, fixedPart(lang, 'ui.new', copy.newStays))
    add(rows, fixedPart(lang, 'ui.rate', copy.rateHint))
    add(rows, fixedPart(lang, 'ui.show', copy.showPurpose))
    for (const percent of [70, 85, 100]) {
      add(rows, speedPart(copy, lang, 'auto', percent))
      add(rows, speedPart(copy, lang, 1, percent))
    }
    add(rows, fixedPart(lang, 'ui.voice-vi', copy.audioVi))
    add(rows, fixedPart(lang, 'ui.voice-vi-male', copy.audioViMale))
    add(rows, fixedPart(lang, 'ui.voice-pt', copy.audioPt))
    add(rows, fixedPart(lang, 'ui.voice-pt-male', copy.audioPtMale))
    add(rows, fixedPart(lang, 'ui.voice-de', copy.audioDe))
    add(rows, fixedPart(lang, 'ui.voice-de-high', copy.audioDeHigh))
    add(rows, fixedPart(lang, 'ui.voice-en', copy.audioEn))
    add(rows, fixedPart(lang, 'ui.voice-en-male', copy.audioEnMale))
    for (const concept of rawCatalog.concepts) {
      add(rows, lineContext(copy, lang, concept.id, concept.context[lang]))
    }
    for (const note of rawCatalog.pairNotes) {
      add(rows, pairPart(copy, lang, note.id, note.text[lang]))
    }
    for (const card of rawCatalog.infoCards) {
      for (const part of infoCardParts(copy, lang, card)) add(rows, part)
    }
  }
  return [...rows].map(([file, text]) => ({ file, text }))
}
