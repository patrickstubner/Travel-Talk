import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { conceptsForSituation, resolvePlayback } from '../content/resolve'
import { directionId } from '../domain/direction'
import { playClip } from '../audio/player'
import { effectiveSpeed, speedPercent, tempoFile } from '../audio/speed'
import { useApp } from '../app/state'
import { useCopy, useSettings } from '../app/use-copy'
import { RichText } from '../components/RichText'
import { cardIdFor } from '../srs/session'
import { prefsFromSettings } from '../storage/types'

export function ShowPage() {
  const { conceptId } = useParams()
  const { catalog, snapshot } = useApp()
  const settings = useSettings()
  const copy = useCopy()
  const app = settings.appLang
  const targetLang = settings.targetLang
  const direction = app && targetLang ? directionId(app, targetLang) : null
  const [gloss, setGloss] = useState(false)
  const [note, setNote] = useState(false)
  const [playing, setPlaying] = useState(false)
  const list = useMemo(() => {
    if (!catalog) return []
    if (!conceptId) return conceptsForSituation(catalog, 'emergency')
    const concept = catalog.concepts.find((item) => item.id === conceptId)
    const situationId = concept?.situationIds[0]
    return situationId ? conceptsForSituation(catalog, situationId) : conceptsForSituation(catalog, 'emergency')
  }, [catalog, conceptId])
  const initial = Math.max(0, list.findIndex((item) => item.id === conceptId))
  const [index, setIndex] = useState(initial)
  if (!catalog) return null
  if (!direction || !app || !targetLang) return <p>{copy.needPair}</p>
  const concept = list[index] ?? list[0]
  if (!concept) return <p>{copy.noResults}</p>
  const target = resolvePlayback(concept, targetLang, settings.viRegion, prefsFromSettings(targetLang, settings))
  const source = resolvePlayback(concept, app, settings.viRegion, prefsFromSettings(app, settings))
  const stored = snapshot?.cards.find((card) => card.cardId === cardIdFor(direction, concept.id))
  const step = effectiveSpeed(settings.speed, stored)
  const percent = speedPercent(step)

  return (
    <section className="stack show" data-testid="show">
      <p className="for-other">{copy.forOther}</p>
      <h1>
        <RichText text={target?.text ?? ''} />
      </h1>
      {gloss && source ? (
        <p className="gloss">
          <RichText text={source.text} />
        </p>
      ) : null}
      {note && settings.personalNote ? <p className="note">{settings.personalNote}</p> : null}
      <div className="row">
        <button type="button" onClick={() => setIndex((value) => (value - 1 + list.length) % list.length)}>
          {copy.back}
        </button>
        <button type="button" onClick={() => setIndex((value) => (value + 1) % list.length)}>
          {copy.next}
        </button>
        <button
          type="button"
          className="play-row"
          aria-pressed={playing}
          onClick={() => {
            if (!target) return
            setPlaying(true)
            void playClip(tempoFile(target.file, step), target.speech, targetLang, step, () => setPlaying(false))
          }}
        >
          <span className="play-mark" aria-hidden="true" />
          {playing ? copy.playing : copy.play}
        </button>
        <p className="speed-now">{copy.speedShown(percent)}</p>
        <button type="button" onClick={() => setGloss((value) => !value)}>
          {gloss ? copy.hideGloss : copy.showGloss}
        </button>
        {settings.personalNote ? (
          <button type="button" onClick={() => setNote((value) => !value)}>
            {note ? copy.hideNote : copy.showNote}
          </button>
        ) : null}
      </div>
      <label>
        {copy.situations}
        <select value={concept.id} onChange={(event) => setIndex(list.findIndex((item) => item.id === event.target.value))}>
          {list.map((item) => {
            const line = resolvePlayback(item, targetLang, settings.viRegion, prefsFromSettings(targetLang, settings))
            return (
              <option key={item.id} value={item.id}>
                {line?.text ?? item.id}
              </option>
            )
          })}
        </select>
      </label>
      <p>
        <Link to={`/phrase/${concept.id}`}>{copy.back}</Link>
      </p>
    </section>
  )
}
