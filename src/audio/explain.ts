import { htmlLang } from '../app/labels'
import type { Lang } from '../../content/phrase'
import { playClip, stopClip } from './player'

/** One paragraph in the info sheet. `clip` is a bundled Piper file, or null when only the device voice can say it. */
export type ExplainPart = { text: string; clip: string | null }

/** `{lang}/help/{id}__any__base.m4a`. `id` is a fixed token, never a free path. */
export function helpFile(lang: Lang, id: string): string {
  if (!/^[a-z0-9.-]+$/.test(id)) throw new Error('HELP_ID')
  return `${lang}/help/${id}__any__base.m4a`
}

export function stopExplanation(): void {
  stopClip()
  globalThis.speechSynthesis?.cancel()
}

function playOne(file: string, lang: Lang): Promise<'file' | 'offline' | 'stopped'> {
  return new Promise((resolve) => {
    let settled = false
    const finish = (result: 'file' | 'offline' | 'stopped') => {
      if (settled) return
      settled = true
      resolve(result)
    }
    void playClip(file, '', lang, 1, () => finish('file'), undefined, undefined, () => finish('stopped')).then((result) => {
      if (result === 'offline') finish('offline')
    })
  })
}

function speakOne(text: string, lang: Lang): Promise<'spoken' | 'stopped'> {
  const synth = globalThis.speechSynthesis
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return Promise.resolve('spoken')
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = htmlLang(lang)
    let settled = false
    const finish = (result: 'spoken' | 'stopped') => {
      if (settled) return
      settled = true
      resolve(result)
    }
    utterance.onend = () => finish('spoken')
    utterance.onerror = () => finish('stopped')
    synth.cancel()
    synth.speak(utterance)
  })
}

/**
 * Plays each paragraph's Piper clip. A missing or offline clip is spoken with
 * `speechSynthesis` in the app language. Sentence audio never comes through here.
 */
export async function speakExplanation(lang: Lang, parts: ExplainPart[], token: { current: number }, mine: number): Promise<void> {
  for (const part of parts) {
    if (token.current !== mine) return
    const text = part.text.trim()
    if (!text) continue
    if (part.clip) {
      const played = await playOne(part.clip, lang)
      if (token.current !== mine || played === 'stopped') return
      if (played === 'file') continue
    }
    const spoken = await speakOne(text, lang)
    if (token.current !== mine || spoken === 'stopped') return
  }
}
