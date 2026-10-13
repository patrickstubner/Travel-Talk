import { useEffect, useRef, useState } from 'react'
import type { Lang } from '../../content/phrase'
import { dropOtherVoicesIfCached, voiceProgress } from '../audio/offline'
import { playClip } from '../audio/player'
import { previewFile, selectedVoice, voicesFor } from '../audio/voices'
import { LANG_LABEL } from '../app/labels'
import { VoiceOfflineButton } from './VoiceOffline'
import { APP_LANGS } from '../domain/direction'
import type { Dictionary } from '../i18n/dictionary'
import type { Settings } from '../storage/types'

export type LanguagePatch = Pick<Settings, 'appLang' | 'targetLang' | 'viRegion' | 'voices'>

function voiceLabel(id: string, copy: Dictionary): string {
  if (id === 'vivos-22') return copy.voiceMann1
  if (id === 'vivos-32') return copy.voiceMann2
  if (id === 'vais1000') return copy.voiceFrauNorth
  if (id === 'thorsten-high') return copy.voiceMannHigh
  if (id === 'thorsten') return copy.voiceMannMid
  if (id === 'ljspeech' || id === 'faber') return copy.voiceFrau
  if (id === 'daisy-studious') return copy.voiceFrauDaisy
  if (id === 'gracie-wise') return copy.voiceFrauGracie
  if (id === 'tammie-ema') return copy.voiceFrauTammie
  if (id === 'claribel-dervla') return copy.voiceFrauClaribel
  return copy.voiceMann
}

function voiceNote(target: Lang, copy: Dictionary): string {
  if (target === 'vi') return copy.voiceViNote
  if (target === 'en') return copy.voiceEnNote
  if (target === 'pt-BR') return copy.voicePtNote
  return copy.voiceDeNote
}

export function LanguageChoice({
  settings,
  copy,
  ui,
  mode,
  onChange,
  onContinue,
  retainIds = [],
}: {
  settings: Settings
  copy: Dictionary
  ui: Lang
  mode: 'onboarding' | 'settings'
  onChange: (patch: LanguagePatch) => void
  onContinue?: () => void
  /** Voices other people still use. This person's previous voice can go. */
  retainIds?: readonly string[]
}) {
  const ready = settings.appLang != null && settings.targetLang != null && settings.appLang !== settings.targetLang
  const target = settings.targetLang
  const options = target ? voicesFor(target) : []
  const current = target ? selectedVoice(settings, target).id : ''
  const shown = target && mode === 'onboarding' && !settings.voices?.[target] ? options.find((voice) => voice.defaultNew)?.id ?? current : current
  const previousVoice = useRef(shown)
  const seenLang = useRef(target)
  if (seenLang.current !== target) {
    seenLang.current = target
    previousVoice.current = shown
  }

  function emit(patch: Partial<LanguagePatch>): void {
    onChange({
      appLang: settings.appLang,
      targetLang: settings.targetLang,
      viRegion: settings.viRegion,
      voices: settings.voices,
      ...patch,
    })
  }

  function pickApp(lang: Lang): void {
    if (lang === settings.targetLang && settings.appLang) emit({ appLang: lang, targetLang: settings.appLang })
    else emit({ appLang: lang })
  }

  function pickVoice(id: string): void {
    if (!target) return
    if (id !== shown) previousVoice.current = shown
    emit({ voices: { ...settings.voices, [target]: id } })
    const voice = options.find((item) => item.id === id)
    if (voice) void dropOtherVoicesIfCached(target, voice, retainIds)
  }

  const [previousReady, setPreviousReady] = useState(false)
  useEffect(() => {
    const id = previousVoice.current
    if (!target || !id || id === shown) {
      setPreviousReady(false)
      return
    }
    const voice = voicesFor(target).find((item) => item.id === id)
    if (!voice) return
    let live = true
    void voiceProgress(target, voice).then((progress) => {
      if (live) setPreviousReady(progress.total > 0 && progress.have === progress.total)
    })
    return () => {
      live = false
    }
  }, [shown, target])

  function keepPreviousVoice(failedId: string): void {
    if (!target) return
    const id = previousVoice.current
    if (!id || id === failedId) return
    emit({ voices: { ...settings.voices, [target]: id } })
    const voice = options.find((item) => item.id === id)
    if (voice) void dropOtherVoicesIfCached(target, voice, retainIds)
  }

  return (
    <div className="stack" data-testid={mode === 'onboarding' ? 'onboarding' : 'language-choice'}>
      <p className="eyebrow">{mode === 'onboarding' ? copy.onboardingKicker : copy.nav.settings}</p>
      <h1>{mode === 'onboarding' ? copy.onboardingTitle : copy.sameChoice}</h1>
      {mode === 'settings' ? <p>{copy.sameChoiceLead}</p> : null}
      <section className="card pad">
        <h2>{copy.appLangTitle}</h2>
        <p className="hint">{copy.appLangHint}</p>
        <div className="choice-grid" role="group" aria-label={copy.appLangTitle}>
          {APP_LANGS.map((lang) => (
            <button key={lang} type="button" aria-pressed={settings.appLang === lang} onClick={() => pickApp(lang)}>
              {LANG_LABEL[lang][ui]}
            </button>
          ))}
        </div>
      </section>
      <p className="hint">{copy.targetLangHint}</p>
      {target ? (
        <section className="card pad">
          <h2>{copy.voiceTitle}</h2>
          <div className="voice-list" role="group" aria-label={copy.voiceTitle}>
            {options.map((voice) => {
              const label = voiceLabel(voice.id, copy)
              return (
                <div key={voice.id} className="voice-option">
                  <button type="button" aria-pressed={shown === voice.id} onClick={() => pickVoice(voice.id)}>
                    {label}
                  </button>
                  <button
                    type="button"
                    aria-label={`${copy.voicePreview}: ${label}`}
                    onClick={() => void playClip(previewFile(target, voice), label, target, 1)}
                  >
                    {copy.voicePreview}
                  </button>
                  <VoiceOfflineButton
                    lang={target}
                    voice={voice}
                    copy={copy}
                    dropOnSuccess={shown === voice.id}
                    retainIds={retainIds}
                    helpLang={settings.appLang ?? undefined}
                    onKeepPrevious={previousReady ? () => keepPreviousVoice(voice.id) : undefined}
                  />
                </div>
              )
            })}
          </div>
          <p className="voice-note">{voiceNote(target, copy)}</p>
        </section>
      ) : null}
      {mode === 'onboarding' ? (
        <>
          <button type="button" className="button primary" disabled={!ready} onClick={onContinue}>
            {copy.continueOn}
          </button>
          <p className="hint">{copy.ifThen}</p>
        </>
      ) : null}
    </div>
  )
}
