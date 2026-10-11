import { useState } from 'react'
import { Link } from 'react-router-dom'
import { withDefaultVoices } from '../audio/voices'
import { LanguageChoice } from '../components/LanguageChoice'
import { useApp } from '../app/state'
import { useCopy, useSettings } from '../app/use-copy'
import { buildSession, currentDirection, dueConcepts, orderedConcepts, usableConcepts } from '../srs/session'
import type { Settings } from '../storage/types'

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
