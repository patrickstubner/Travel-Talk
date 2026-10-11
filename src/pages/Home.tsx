import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Lang } from '../../content/phrase'
import { selectedVoice, withDefaultVoices } from '../audio/voices'
import { LANG_LABEL } from '../app/labels'
import { LanguageChoice } from '../components/LanguageChoice'
import { VoiceOfflineButton } from '../components/VoiceOffline'
import { useApp } from '../app/state'
import { useCopy, useSettings } from '../app/use-copy'
import { buildSession, currentDirection, dueConcepts, orderedConcepts, usableConcepts } from '../srs/session'
import type { Dictionary } from '../i18n/dictionary'
import type { Settings } from '../storage/types'

function languagesInUse(settings: Settings): Lang[] {
  return [settings.targetLang, settings.appLang].filter((lang, index, all): lang is Lang => lang != null && all.indexOf(lang) === index)
}

export function HomePage() {
  const { catalog, snapshot, saveSettings } = useApp()
  const settings = useSettings()
  const copy = useCopy()
  const [draft, setDraft] = useState<Settings | null>(null)
  if (!catalog || !snapshot) return null
  const direction = currentDirection(settings.appLang, settings.targetLang)

  if (!direction || !settings.appLang || !settings.targetLang) {
    const pending = draft ?? settings
    return (
      <LanguageChoice
        settings={pending}
        copy={copy}
        ui={pending.appLang ?? 'de'}
        mode="onboarding"
        onChange={(patch) => setDraft({ ...pending, ...patch })}
        onContinue={() => {
          if (!pending.appLang || !pending.targetLang) return
          void saveSettings(withDefaultVoices(pending))
        }}
      />
    )
  }

  const usable = usableConcepts(orderedConcepts(catalog), settings.appLang, settings.targetLang, settings.viRegion)
  const now = new Date()
  const due = dueConcepts(usable, snapshot.cards, direction, now).length
  const fresh = buildSession(usable, snapshot.cards, direction, now, 'new').length
  const skipped = catalog.concepts.length - usable.length

  return (
    <div className="stack" data-testid="start">
      <h1>{copy.learnToday}</h1>
      {snapshot.repaired ? <p role="status">{copy.cardsReset(snapshot.repaired)}</p> : null}
      {!settings.voiceHintSeen ? (
        <p className="voice-note" role="status">
          {copy.voiceHint}{' '}
          <button type="button" onClick={() => void saveSettings({ ...settings, voiceHintSeen: true })}>
            {copy.voiceHintClose}
          </button>
        </p>
      ) : null}
      <OfflineOffer settings={settings} copy={copy} />
      <p>{copy.startLead(fresh, due)}</p>
      <Link className="button primary" to="/practice">
        {copy.learnToday}
      </Link>
      <p className="hint">{copy.sessionLength}</p>
      <Link className="menu-card" to="/practice?kind=review">
        <strong>{copy.reviewTitle}</strong>
        <span>{due === 0 ? copy.reviewNone : copy.reviewCard(due)}</span>
      </Link>
      <Link className="menu-card" to="/practice?kind=new">
        <strong>{copy.learnNew}</strong>
        <span>{fresh === 0 ? copy.noNewToday : copy.learnNewHint}</span>
      </Link>
      <Link className="menu-card" to="/lookup">
        <strong>{copy.lookupCard}</strong>
        <span>{copy.lookupHint}</span>
      </Link>
      <Link className="menu-card" to="/show">
        <strong>{copy.showCard}</strong>
        <span>{copy.showHint}</span>
      </Link>
      {skipped > 0 ? <p className="hint">{copy.missingLine}</p> : null}
      <p className="hint">{copy.uncheckedCalm}</p>
    </div>
  )
}

function OfflineOffer({ settings, copy }: { settings: Settings; copy: Dictionary }) {
  const ui = settings.appLang ?? 'de'
  const langs = languagesInUse(settings)
  if (langs.length === 0) return null
  return (
    <section className="stack" aria-label={copy.offlineLoad}>
      {langs.map((lang) => (
        <div key={lang}>
          <p className="hint">{LANG_LABEL[lang][ui]}</p>
          <VoiceOfflineButton lang={lang} voice={selectedVoice(settings, lang)} copy={copy} dropOnSuccess />
        </div>
      ))}
    </section>
  )
}
