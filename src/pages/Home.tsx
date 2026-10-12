import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { voiceProgress } from '../audio/offline'
import { selectedVoice, voicesFor, voicesKeptByOthers, withDefaultVoices } from '../audio/voices'
import { LANG_LABEL } from '../app/labels'
import { LanguageChoice } from '../components/LanguageChoice'
import { VoiceOfflineButton } from '../components/VoiceOffline'
import { useApp } from '../app/state'
import { useCopy, useSettings } from '../app/use-copy'
import { WORDS } from '../../content/words'
import { buildDay, missingKeyword } from '../srs/day'
import { cardIdFor, currentDirection, dueConcepts, isDueCard, orderedConcepts, usableConcepts } from '../srs/session'
import type { Dictionary } from '../i18n/dictionary'
import type { Settings } from '../storage/types'

export function HomePage() {
  const { catalog, snapshot, saveSettings } = useApp()
  const settings = useSettings()
  const copy = useCopy()
  const [confirmed, setConfirmed] = useState(false)
  const startedComplete = useRef<boolean | null>(null)
  if (snapshot && startedComplete.current === null) {
    startedComplete.current = Boolean(settings.appLang && settings.targetLang)
  }
  if (!catalog || !snapshot) return null
  const direction = currentDirection(settings.appLang, settings.targetLang)
  const stayOnboarding = startedComplete.current === false && !confirmed

  if (stayOnboarding || !direction || !settings.appLang || !settings.targetLang) {
    return (
      <LanguageChoice
        settings={settings}
        copy={copy}
        ui={settings.appLang ?? 'de'}
        mode="onboarding"
        onChange={(patch) => {
          const next = { ...settings, ...patch }
          void saveSettings(next.appLang && next.targetLang ? withDefaultVoices(next) : next)
        }}
        onContinue={() => {
          if (!settings.appLang || !settings.targetLang) return
          setConfirmed(true)
          void saveSettings(withDefaultVoices(settings))
        }}
      />
    )
  }

  const usable = usableConcepts(orderedConcepts(catalog), settings.appLang, settings.targetLang, settings.viRegion)
  const now = new Date()
  const due =
    dueConcepts(usable, snapshot.cards, direction, now).length +
    WORDS.filter((word) => isDueCard(snapshot.cards.find((card) => card.cardId === cardIdFor(direction, word.id)), now)).length
  const planned = buildDay(usable, snapshot.cards, direction, now, 'new')
  const fresh = planned.items.filter((item) => item.kind === 'sentence').length
  const coming = fresh + planned.waiting
  const words = planned.items.filter((item) => item.kind === 'word').length
  const appLang = settings.appLang
  const waiting = appLang ? usable.find((concept) => missingKeyword(concept.id, snapshot.cards, direction, appLang, settings.viRegion)) : undefined
  const missing = waiting && appLang ? missingKeyword(waiting.id, snapshot.cards, direction, appLang, settings.viRegion) : null
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
      <OfflineOffer
        settings={settings}
        copy={copy}
        retainIds={voicesKeptByOthers(snapshot.people ?? [], snapshot.activePersonId, settings.targetLang)}
        onKeepVoice={(id) => {
          if (!settings.targetLang) return
          void saveSettings({ ...settings, voices: { ...settings.voices, [settings.targetLang]: id } })
        }}
      />
      <p>{copy.startLead(fresh === 0 ? 0 : coming, due, fresh === 0 ? planned.waiting : 0)}</p>
      {words > 0 ? <p>{copy.todayWords(words)}</p> : null}
      {missing ? <p>{copy.missingWord(missing)}</p> : null}
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
        <span>{fresh === 0 && planned.waiting > 0 ? copy.sentencesAfterWords(planned.waiting) : coming === 0 ? copy.noNewToday : copy.learnNewHint}</span>
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

function OfflineOffer({
  settings,
  copy,
  retainIds,
  onKeepVoice,
}: {
  settings: Settings
  copy: Dictionary
  retainIds: readonly string[]
  onKeepVoice: (id: string) => void
}) {
  const lang = settings.targetLang
  const current = lang ? selectedVoice(settings, lang) : null
  const [previousId, setPreviousId] = useState<string | null>(null)
  useEffect(() => {
    if (!lang || !current) return
    let live = true
    const others = voicesFor(lang).filter((voice) => voice.id !== current.id)
    void (async () => {
      const ready: string[] = []
      let legacy: string | null = null
      for (const voice of others) {
        const progress = await voiceProgress(lang, voice)
        if (progress.total > 0 && progress.have === progress.total) {
          ready.push(voice.id)
          if (voice.legacy) legacy = voice.id
        }
      }
      if (live) setPreviousId(legacy ?? ready[0] ?? null)
    })()
    return () => {
      live = false
    }
  }, [lang, current])
  if (!lang || !current) return null
  const ui = settings.appLang ?? 'de'
  return (
    <section className="stack" aria-label={copy.offlineLoad}>
      <p className="hint">{LANG_LABEL[lang][ui]}</p>
      <VoiceOfflineButton
        lang={lang}
        voice={current}
        copy={copy}
        dropOnSuccess
        pendingNote={copy.offlineReload}
        retainIds={retainIds}
        helpLang={settings.appLang ?? undefined}
        onKeepPrevious={previousId ? () => onKeepVoice(previousId) : undefined}
      />
    </section>
  )
}
