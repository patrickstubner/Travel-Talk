import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { conceptsForSituation, resolvePlayback } from '../content/resolve'
import { directionId } from '../domain/direction'
import { alignmentFitsDuration, alignmentScale, loadAlignment, type WordTime } from '../audio/align'
import { playClip } from '../audio/player'
import { linksFor } from '../content/word-links'
import { spokenFile } from '../audio/voices'
import { effectiveSpeed, speedPercent, tempoFile } from '../audio/speed'
import { useApp } from '../app/state'
import { useCopy, useSettings } from '../app/use-copy'
import { KaraokeLine } from '../components/KaraokeLine'
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
  const [seconds, setSeconds] = useState<number | null>(null)
  const [times, setTimes] = useState<WordTime[] | null>(null)
  const [clipDuration, setClipDuration] = useState<number | null>(null)
  const [offlineAudio, setOfflineAudio] = useState(false)
  const list = useMemo(() => {
    if (!catalog) return []
    if (!conceptId) return conceptsForSituation(catalog, 'emergency')
    const concept = catalog.concepts.find((item) => item.id === conceptId)
    const situationId = concept?.situationIds[0]
    return situationId ? conceptsForSituation(catalog, situationId) : conceptsForSituation(catalog, 'emergency')
  }, [catalog, conceptId])
  const initial = Math.max(0, list.findIndex((item) => item.id === conceptId))
  const [index, setIndex] = useState(initial)
  const concept = list[index] ?? list[0]
  const target = concept && targetLang ? resolvePlayback(concept, targetLang, settings.viRegion, prefsFromSettings(targetLang, settings)) : undefined
  const source = concept && app ? resolvePlayback(concept, app, settings.viRegion, prefsFromSettings(app, settings)) : undefined
  const stored = direction && concept ? snapshot?.cards.find((card) => card.cardId === cardIdFor(direction, concept.id)) : undefined
  const step = effectiveSpeed(settings.speed, stored)
  const followWords = settings.highlightWords !== false
  const targetSpeech = target?.speech ?? ''
  const targetFile = target && targetLang ? tempoFile(spokenFile(settings, targetLang, target.file), step) : ''
  const links = useMemo(() => {
    if (!followWords || !concept || !target || !source || !app || !targetLang) return []
    return linksFor(concept.id, targetLang, app, target.speech, source.speech, settings)
  }, [app, concept, followWords, settings, source, target, targetLang])
  useEffect(() => {
    if (!followWords || !targetFile || !targetSpeech) {
      setTimes(null)
      return
    }
    let live = true
    void loadAlignment(targetFile, targetSpeech).then((value) => {
      if (live) setTimes(value)
    })
    return () => {
      live = false
    }
  }, [followWords, targetFile, targetSpeech])
  if (!catalog) return null
  if (!direction || !app || !targetLang) return <p>{copy.needPair}</p>
  if (!concept) return <p>{copy.noResults}</p>
  const percent = speedPercent(step)

  return (
    <section className="stack show" data-testid="show">
      <p className="for-other">{copy.forOther}</p>
      {offlineAudio ? (
        <p className="warn" role="status">
          {copy.audioOffline}
        </p>
      ) : null}
      {followWords && target ? (
        <KaraokeLine
          heading
          lang={targetLang}
          speech={target.speech}
          gloss={gloss && source ? source.speech : null}
          links={gloss ? links : []}
          times={times && (clipDuration == null || alignmentFitsDuration(times, clipDuration, alignmentScale(targetFile))) ? times : null}
          seconds={playing ? seconds : null}
          note={gloss ? copy.glossUnchecked : undefined}
          template={target.text}
        />
      ) : (
        <>
          <h1>
            <RichText text={target?.text ?? ''} />
          </h1>
          {gloss && source ? (
            <p className="gloss">
              <RichText text={source.text} />
            </p>
          ) : null}
        </>
      )}
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
            setSeconds(0)
            setClipDuration(null)
            setOfflineAudio(false)
            void playClip(
              tempoFile(spokenFile(settings, targetLang, target.file), step),
              target.speech,
              targetLang,
              step,
              () => {
                setPlaying(false)
                setSeconds(null)
              },
              (time) => setSeconds(time),
              (duration) => setClipDuration(duration),
            ).then((result) => {
              if (result === 'offline') {
                setPlaying(false)
                setSeconds(null)
                setOfflineAudio(true)
              }
            })
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
