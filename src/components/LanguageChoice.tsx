import type { Lang } from '../../content/phrase'
import { LANG_LABEL } from '../app/labels'
import { APP_LANGS } from '../domain/direction'
import type { Dictionary } from '../i18n/dictionary'
import type { Settings } from '../storage/types'

function voiceCopy(target: Lang | null, copy: Dictionary): { label: string; note: string; title: string } {
  if (target === 'vi') return { label: copy.voiceVi, note: copy.voiceViNote, title: copy.voiceTitle }
  if (target === 'en') return { label: copy.voiceEn, note: copy.voiceEnNote, title: copy.voiceTitle }
  if (target === 'pt-BR') return { label: copy.voicePt, note: copy.voicePlainNote, title: copy.voiceTitle }
  return { label: copy.voiceDe, note: copy.voicePlainNote, title: copy.voiceTitle }
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
  onChange: (patch: Pick<Settings, 'appLang' | 'targetLang' | 'viRegion'>) => void
  onContinue?: () => void
}) {
  const ready = settings.appLang != null && settings.targetLang != null && settings.appLang !== settings.targetLang
  const showRegion = settings.appLang === 'vi' || settings.targetLang === 'vi'
  const voice = voiceCopy(settings.targetLang, copy)

  function pickApp(lang: Lang): void {
    if (lang === settings.targetLang && settings.appLang) onChange({ appLang: lang, targetLang: settings.appLang, viRegion: settings.viRegion })
    else onChange({ appLang: lang, targetLang: settings.targetLang, viRegion: settings.viRegion })
  }

  function pickTarget(lang: Lang): void {
    if (lang === settings.appLang && settings.targetLang) onChange({ appLang: settings.targetLang, targetLang: lang, viRegion: settings.viRegion })
    else onChange({ appLang: settings.appLang, targetLang: lang, viRegion: settings.viRegion })
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
              <button type="button" aria-pressed={settings.viRegion === 'south'} onClick={() => onChange({ appLang: settings.appLang, targetLang: settings.targetLang, viRegion: 'south' })}>
                {copy.regionSouth}
              </button>
              <button type="button" aria-pressed={settings.viRegion === 'north'} onClick={() => onChange({ appLang: settings.appLang, targetLang: settings.targetLang, viRegion: 'north' })}>
                {copy.regionNorth}
              </button>
            </div>
          </div>
        ) : null}
      </section>
      {settings.targetLang ? (
        <section className="card pad">
          <h2>{voice.title}</h2>
          <p className="voice-pill">{voice.label}</p>
          <p className="voice-note">{voice.note}</p>
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
