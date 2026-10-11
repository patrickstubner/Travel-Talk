import type { Lang } from '../../content/phrase'
import { dropOtherVoicesIfCached } from '../audio/offline'
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
}: {
  settings: Settings
  copy: Dictionary
  ui: Lang
  mode: 'onboarding' | 'settings'
  onChange: (patch: LanguagePatch) => void
  onContinue?: () => void
}) {
  const ready = settings.appLang != null && settings.targetLang != null && settings.appLang !== settings.targetLang
  const showRegion = settings.appLang === 'vi' || settings.targetLang === 'vi'
  const target = settings.targetLang
  const options = target ? voicesFor(target) : []
  const current = target ? selectedVoice(settings, target).id : ''
  const shown = target && mode === 'onboarding' && !settings.voices?.[target] ? options.find((voice) => voice.defaultNew)?.id ?? current : current

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

  function pickTarget(lang: Lang): void {
    if (lang === settings.appLang && settings.targetLang) emit({ appLang: settings.targetLang, targetLang: lang })
    else emit({ targetLang: lang })
  }

  function pickVoice(id: string): void {
    if (!target) return
    emit({ voices: { ...settings.voices, [target]: id } })
    const voice = options.find((item) => item.id === id)
    if (voice) void dropOtherVoicesIfCached(target, voice)
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
      <section className="card pad">
        <h2>{copy.targetLangTitle}</h2>
        <p className="hint">{copy.targetLangHint}</p>
        <div className="choice-grid" role="group" aria-label={copy.targetLangTitle}>
          {APP_LANGS.map((lang) => (
            <button key={lang} type="button" aria-pressed={settings.targetLang === lang} onClick={() => pickTarget(lang)}>
              {LANG_LABEL[lang][ui]}
            </button>
          ))}
        </div>
        <p className="hint">{copy.everyPair}</p>
        {showRegion ? (
          <div className="stack">
            <h2>{copy.scriptTitle}</h2>
            <p className="hint">{copy.scriptHint}</p>
            <div className="choice-grid" role="group" aria-label={copy.scriptTitle}>
              <button type="button" aria-pressed={settings.viRegion === 'south'} onClick={() => emit({ viRegion: 'south' })}>
                {copy.regionSouth}
              </button>
              <button type="button" aria-pressed={settings.viRegion === 'north'} onClick={() => emit({ viRegion: 'north' })}>
                {copy.regionNorth}
              </button>
            </div>
          </div>
        ) : null}
      </section>
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
                  <VoiceOfflineButton lang={target} voice={voice} copy={copy} dropOnSuccess={shown === voice.id} />
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
