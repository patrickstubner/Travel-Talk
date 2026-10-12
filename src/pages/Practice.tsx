import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { Concept } from '../../content/phrase'
import { selectedVoice, spokenFile } from '../audio/voices'
import { resolvePlayback } from '../content/resolve'
import { alignmentFitsDuration, alignmentScale, loadAlignment, type WordTime } from '../audio/align'
import { decodeContourFile, playClip, stopClip } from '../audio/player'
import { linksFor } from '../content/word-links'
import { tempoFile } from '../audio/speed'
import { startMicrophone, type CaptureSession } from '../audio/recorder'
import { useApp } from '../app/state'
import { useCopy, useSettings } from '../app/use-copy'
import { KaraokeLine } from '../components/KaraokeLine'
import { RepeatFeedback } from '../components/RepeatFeedback'
import { RichText } from '../components/RichText'
import { Rating, emptyCard, fromStored, previewDue, reviewCard, toStored, type Grade } from '../srs/scheduler'
import {
  buildSession,
  cardIdFor,
  currentDirection,
  distractorConcepts,
  gapLabel,
  orderedConcepts,
  sessionCanDo,
  stepsFor,
  targetTextVisible,
  usableConcepts,
  type LearnStep,
  type SessionItem,
  type SessionKind,
} from '../srs/session'
import { prefsFromSettings } from '../storage/types'

function kindFrom(value: string | null): SessionKind {
  if (value === 'review' || value === 'new') return value
  return 'mix'
}

export function PracticePage() {
  const { catalog, snapshot, saveCard } = useApp()
  const settings = useSettings()
  const copy = useCopy()
  const [params] = useSearchParams()
  const kind = kindFrom(params.get('kind'))
  const direction = currentDirection(settings.appLang, settings.targetLang)
  const [run, setRun] = useState(0)
  const [queue, setQueue] = useState<SessionItem[]>([])
  const [index, setIndex] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)
  const [choices, setChoices] = useState<Concept[]>([])
  const [playing, setPlaying] = useState(false)
  const [seconds, setSeconds] = useState<number | null>(null)
  const [times, setTimes] = useState<WordTime[] | null>(null)
  const [clipDuration, setClipDuration] = useState<number | null>(null)
  const [offlineAudio, setOfflineAudio] = useState(false)
  const [recording, setRecording] = useState(false)
  const [micNote, setMicNote] = useState(false)
  const [finished, setFinished] = useState(false)
  const [readyFor, setReadyFor] = useState('')
  const [micStarting, setMicStarting] = useState(false)
  const [take, setTake] = useState<{ url: string; samples: Float32Array | null; sampleRate: number } | null>(null)
  const [modelTake, setModelTake] = useState<{ samples: Float32Array; sampleRate: number } | null>(null)
  const [modelMissing, setModelMissing] = useState(false)
  const [feedbackTimes, setFeedbackTimes] = useState<WordTime[] | null>(null)
  const [timingsPending, setTimingsPending] = useState(false)
  const sessionRef = useRef<CaptureSession | null>(null)
  const takeRef = useRef<{ url: string; samples: Float32Array | null; sampleRate: number } | null>(null)
  const lockedFile = useRef('')
  const urlRef = useRef<string | null>(null)
  const aliveRef = useRef(true)
  const micToken = useRef(0)
  const releaseRef = useRef<() => void>(() => undefined)

  function releaseMic(): void {
    micToken.current += 1
    sessionRef.current?.release(null)
    sessionRef.current = null
    urlRef.current = null
    const previous = takeRef.current
    takeRef.current = null
    if (previous?.url) URL.revokeObjectURL(previous.url)
    if (!aliveRef.current) return
    setTake(null)
    setRecording(false)
    setMicStarting(false)
  }

  releaseRef.current = releaseMic

  useEffect(() => {
    aliveRef.current = true
    function onHidden(): void {
      if (document.visibilityState === 'hidden') releaseRef.current()
    }
    function onPageHide(): void {
      releaseRef.current()
    }
    document.addEventListener('visibilitychange', onHidden)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      aliveRef.current = false
      document.removeEventListener('visibilitychange', onHidden)
      window.removeEventListener('pagehide', onPageHide)
      releaseRef.current()
    }
  }, [])

  useEffect(() => {
    if (!catalog || !snapshot || !direction || !settings.appLang || !settings.targetLang) return
    const personId = snapshot.activePersonId ?? ''
    const key = `${personId}:${direction}:${kind}:${run}`
    if (readyFor === key) return
    const usable = usableConcepts(orderedConcepts(catalog), settings.appLang, settings.targetLang, settings.viRegion)
    setQueue(buildSession(usable, snapshot.cards, direction, new Date(), kind))
    setIndex(0)
    setStepIndex(0)
    setAnswered(false)
    setPicked(null)
    setFinished(false)
    setMicNote(false)
    setReadyFor(key)
  }, [catalog, direction, kind, readyFor, run, settings.appLang, settings.targetLang, settings.viRegion, snapshot])

  const item = queue[index]
  const steps = item ? stepsFor(item.isNew) : []
  const step = steps[stepIndex]
  const concept = catalog?.concepts.find((entry) => entry.id === item?.id)

  useEffect(() => {
    if (!concept || !settings.targetLang) return
    if (step !== 'slow' && step !== 'normal' && step !== 'understand') return
    const line = resolvePlayback(concept, settings.targetLang, settings.viRegion, prefsFromSettings(settings.targetLang, settings))
    if (!line) return
    let live = true
    const rate = step === 'slow' ? 0.7 : 1
    lockedFile.current = tempoFile(spokenFile(settings, settings.targetLang, line.file), rate)
    setPlaying(true)
    setSeconds(0)
    setClipDuration(null)
    setOfflineAudio(false)
    void playClip(
      tempoFile(spokenFile(settings, settings.targetLang, line.file), rate),
      line.speech,
      settings.targetLang,
      rate,
      () => {
        if (live && aliveRef.current) {
          lockedFile.current = ''
          setPlaying(false)
          setSeconds(null)
        }
      },
      (time) => {
        if (live && aliveRef.current) setSeconds(time)
      },
      (duration) => {
        if (live && aliveRef.current) setClipDuration(duration)
      },
    ).then((result) => {
      if (!live || !aliveRef.current) return
      if (result === 'offline') {
        lockedFile.current = ''
        setPlaying(false)
        setSeconds(null)
        setOfflineAudio(true)
      }
    })
    return () => {
      live = false
    }
  }, [concept, settings, step])

  useEffect(() => {
    if (settings.highlightWords === false || !concept || !settings.targetLang) {
      setTimes(null)
      return
    }
    const line = resolvePlayback(concept, settings.targetLang, settings.viRegion, prefsFromSettings(settings.targetLang, settings))
    if (!line) return
    const rate = step === 'slow' ? 0.7 : 1
    const file = tempoFile(spokenFile(settings, settings.targetLang, line.file), rate)
    const timing = playing && lockedFile.current ? lockedFile.current : file
    let live = true
    void loadAlignment(timing, line.speech).then((value) => {
      if (live) setTimes(value)
    })
    return () => {
      live = false
    }
  }, [concept, playing, settings, step])

  useEffect(() => {
    if (step !== 'repeat' || !take?.samples || !concept || !settings.targetLang) {
      setModelTake(null)
      setFeedbackTimes(null)
      setModelMissing(false)
      setTimingsPending(false)
      return
    }
    const line = resolvePlayback(concept, settings.targetLang, settings.viRegion, prefsFromSettings(settings.targetLang, settings))
    if (!line) return
    const file = tempoFile(spokenFile(settings, settings.targetLang, line.file), 1)
    let live = true
    setTimingsPending(true)
    void decodeContourFile(file).then(async (decoded) => {
      if (!live) return
      const aligned = await loadAlignment(file, line.speech)
      if (!live) return
      const duration = decoded ? decoded.samples.length / decoded.sampleRate : 0
      setModelTake(decoded)
      setModelMissing(!decoded)
      if (decoded && aligned && alignmentFitsDuration(aligned, duration, alignmentScale(file))) setFeedbackTimes(aligned)
      else setFeedbackTimes(null)
      setTimingsPending(false)
    })
    return () => {
      live = false
    }
  }, [concept, settings, step, take])

  useEffect(() => {
    if (!catalog || !concept || step !== 'understand') return
    const mixed = [concept, ...distractorConcepts(concept.id, catalog.concepts, 3).map((entry) => catalog.concepts.find((item) => item.id === entry.id)).filter((entry): entry is Concept => entry != null)]
    for (let i = mixed.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      const left = mixed[i]
      const right = mixed[j]
      if (left && right) {
        mixed[i] = right
        mixed[j] = left
      }
    }
    setChoices(mixed)
    setPicked(null)
    setAnswered(false)
  }, [catalog, concept, step])

  if (!catalog || !snapshot) return null
  if (!direction || !settings.appLang || !settings.targetLang) return <p>{copy.needPair}</p>

  const app = settings.appLang
  const targetLang = settings.targetLang
  const activeDirection = direction

  function goNext(): void {
    releaseMic()
    setAnswered(false)
    setPicked(null)
    setMicNote(false)
    setPlaying(false)
    setOfflineAudio(false)
    if (stepIndex + 1 < steps.length) {
      setStepIndex((value) => value + 1)
      return
    }
    if (index + 1 < queue.length) {
      setIndex((value) => value + 1)
      setStepIndex(0)
      return
    }
    setFinished(true)
  }

  async function hear(file: string, speech: string, rate: 0.7 | 1): Promise<void> {
    if (!targetLang) return
    const played = tempoFile(spokenFile(settings, targetLang, file), rate)
    lockedFile.current = played
    setPlaying(true)
    setOfflineAudio(false)
    setSeconds(0)
    setClipDuration(null)
    const result = await playClip(
      played,
      speech,
      targetLang,
      rate,
      () => {
        if (!aliveRef.current) return
        lockedFile.current = ''
        setPlaying(false)
        setSeconds(null)
      },
      (time) => {
        if (aliveRef.current) setSeconds(time)
      },
      (duration) => {
        if (aliveRef.current) setClipDuration(duration)
      },
    )
    if (aliveRef.current && result === 'offline') {
      lockedFile.current = ''
      setPlaying(false)
      setSeconds(null)
      setOfflineAudio(true)
    }
  }

  async function rate(grade: Grade): Promise<void> {
    if (!concept) return
    const cardId = cardIdFor(activeDirection, concept.id)
    const stored = snapshot?.cards.find((card) => card.cardId === cardId)
    const now = new Date()
    const card = stored ? fromStored(stored) : emptyCard(now)
    const next = reviewCard(card, grade, now, snapshot?.settings.retention ?? 0.9, false)
    await saveCard(toStored(cardId, next))
    goNext()
  }

  if (finished) {
    const canDo = sessionCanDo(catalog, queue.map((entry) => entry.id), app)
    return (
      <section className="stack" data-testid="session-end">
        <p className="eyebrow">{copy.sessionKicker}</p>
        <h1>{copy.sessionDone}</h1>
        <div className="card pad">
          <p>{queue.every((entry) => entry.isNew) ? copy.sessionNewCount(queue.length) : copy.sessionCount(queue.length)}</p>
          {canDo ? <p>{canDo}</p> : null}
          {queue.every((entry) => entry.isNew) ? <p>{copy.noReviewWasDue}</p> : null}
          <p>{copy.tomorrowReviews}</p>
        </div>
        <Link className="button primary" to="/">
          {copy.done}
        </Link>
        <button type="button" className="button wide" onClick={() => setRun((value) => value + 1)}>
          {copy.anotherSession}
        </button>
      </section>
    )
  }

  if (!item || !concept || !step) {
    return (
      <section className="stack" data-testid="practice">
        <h1>{copy.learnToday}</h1>
        <p>{kind === 'review' ? copy.noReviews : copy.noNewToday}</p>
        <Link to="/">{copy.back}</Link>
      </section>
    )
  }

  const source = resolvePlayback(concept, app, settings.viRegion, prefsFromSettings(app, settings))
  const target = resolvePlayback(concept, targetLang, settings.viRegion, prefsFromSettings(targetLang, settings))
  if (!source || !target) {
    return (
      <section className="stack">
        <p>{copy.missingLine}</p>
        <button type="button" className="button" onClick={goNext}>
          {copy.next}
        </button>
      </section>
    )
  }

  const showTarget = targetTextVisible(step, item.isNew, answered)
  const followWords = settings.highlightWords !== false
  const revealGloss = step !== 'understand' || answered
  const links = followWords && revealGloss ? linksFor(concept.id, targetLang, app, target.speech, source.speech, settings) : []
  const playRate = step === 'slow' ? 0.7 : 1
  const heardFile = tempoFile(spokenFile(settings, targetLang, target.file), playRate)
  const timingFile = playing && lockedFile.current ? lockedFile.current : heardFile
  const markTimes =
    times &&
    (clipDuration == null || alignmentFitsDuration(times, clipDuration, alignmentScale(timingFile)))
      ? times
      : null
  const spoken = followWords ? (
    <KaraokeLine
      lang={targetLang}
      speech={target.speech}
      gloss={revealGloss ? source.speech : null}
      links={links}
      times={markTimes}
      seconds={playing ? seconds : null}
      note={revealGloss ? copy.glossUnchecked : undefined}
      template={target.text}
    />
  ) : null
  const stored = snapshot.cards.find((card) => card.cardId === cardIdFor(activeDirection, concept.id))
  const now = new Date()
  const dues = step === 'recall' && answered ? previewDue(stored ? fromStored(stored) : emptyCard(now), now, settings.retention) : null

  function gap(grade: Grade): string {
    if (!dues) return ''
    const label = gapLabel(dues[grade], now)
    if (label.kind === 'tomorrow') return copy.tomorrow
    if (label.kind === 'minutes') return copy.inMinutes(label.count)
    if (label.kind === 'hours') return copy.inHours(label.count)
    return copy.inDays(label.count)
  }

  const heading: Record<LearnStep, string> = {
    slow: copy.stepSlow(index + 1, queue.length),
    normal: copy.stepNormal(index + 1, queue.length),
    repeat: copy.stepRepeat(index + 1, queue.length),
    understand: copy.stepUnderstand(index + 1, queue.length),
    recall: copy.stepRecall(index + 1, queue.length),
    rate: copy.stepRecall(index + 1, queue.length),
  }

  return (
    <section className="stack" data-testid="practice">
      <p className="eyebrow">{heading[step]}</p>
      {offlineAudio ? (
        <p className="warn" role="status">
          {copy.audioOffline}
        </p>
      ) : null}
      {step === 'slow' || step === 'normal' ? (
        <>
          <h1>
            <RichText text={source.text} />
          </h1>
          <button
            type="button"
            className="play-row"
            aria-pressed={playing}
            onClick={() => void hear(target.file, target.speech, step === 'slow' ? 0.7 : 1)}
          >
            <span className="play-mark" aria-hidden="true" />
            {playing ? (step === 'slow' ? copy.playingSlow : copy.playingNormal) : step === 'slow' ? copy.playSlow : copy.playNormal}
          </button>
          {showTarget ? (
            followWords && spoken ? (
              spoken
            ) : (
              <p className={playing ? 'target-line playing' : 'target-line'} data-testid="target-line" lang={targetLang}>
                <RichText text={target.text} />
              </p>
            )
          ) : null}
          <p className="hint">{concept.context[app]}</p>
          {step === 'slow' ? (
            <>
              <button type="button" className="button wide" onClick={() => void hear(target.file, target.speech, 0.7)}>
                {copy.replaySlow}
              </button>
              <button type="button" className="button primary" onClick={goNext}>
                {copy.playNormal}
              </button>
            </>
          ) : (
            <button type="button" className="button primary" onClick={goNext}>
              {copy.next}
            </button>
          )}
        </>
      ) : null}
      {step === 'repeat' ? (
        <>
          <h1>{copy.stepRepeat(index + 1, queue.length)}</h1>
          {showTarget ? (
            followWords && spoken ? (
              spoken
            ) : (
              <p className="target-line" data-testid="target-line" lang={targetLang}>
                <RichText text={target.text} />
              </p>
            )
          ) : null}
          <button
            type="button"
            className="button wide"
            aria-pressed={playing}
            disabled={recording}
            onClick={() => void hear(target.file, target.speech, 1)}
          >
            {playing ? copy.playing : copy.play}
          </button>
          {micNote ? <p className="voice-note">{copy.micSkipped}</p> : null}
          {take?.samples && !recording ? (
            <RepeatFeedback
              copy={copy}
              lang={targetLang}
              region={settings.viRegion}
              speech={target.speech}
              words={feedbackTimes}
              modelSamples={modelTake?.samples ?? null}
              modelRate={modelTake?.sampleRate ?? 0}
              userSamples={take.samples}
              userRate={take.sampleRate}
              modelMissing={modelMissing}
              timingsPending={timingsPending}
              voiceId={selectedVoice(settings, targetLang).id}
            />
          ) : null}
          {take && !take.samples && !recording ? <p role="status">{copy.pitchEmpty}</p> : null}
          <div className="row">
            {recording ? (
              <button type="button" onClick={() => sessionRef.current?.recorder.stop()}>
                {copy.stop}
              </button>
            ) : (
              <button
                type="button"
                disabled={micStarting}
                onClick={() => {
                  stopClip()
                  setPlaying(false)
                  const token = micToken.current + 1
                  micToken.current = token
                  setMicNote(false)
                  setMicStarting(true)
                  void startMicrophone((taken) => {
                    if (!aliveRef.current) {
                      if (taken.url) URL.revokeObjectURL(taken.url)
                      return
                    }
                    const previous = takeRef.current
                    if (previous?.url && previous.url !== taken.url) URL.revokeObjectURL(previous.url)
                    const next = { url: taken.url, samples: taken.samples, sampleRate: taken.sampleRate }
                    takeRef.current = next
                    setTake(next)
                    setRecording(false)
                  })
                    .then((next) => {
                      if (!next || !aliveRef.current || token !== micToken.current) {
                        next?.release(null)
                        if (aliveRef.current && token === micToken.current) {
                          setMicNote(true)
                          setMicStarting(false)
                        }
                        return
                      }
                      sessionRef.current?.release(null)
                      sessionRef.current = next
                      setRecording(true)
                      setMicStarting(false)
                    })
                    .catch(() => {
                      if (aliveRef.current && token === micToken.current) {
                        setMicNote(true)
                        setMicStarting(false)
                      }
                    })
                }}
              >
                {take ? copy.repeatFeedback.again : copy.record}
              </button>
            )}
          </div>
          <button type="button" className="button primary" disabled={micStarting} onClick={goNext}>
            {copy.next}
          </button>
        </>
      ) : null}
      {step === 'understand' ? (
        <>
          <h1>{item.isNew ? copy.visibleTitle : copy.meaningPrompt}</h1>
          {item.isNew ? <p>{copy.newStays}</p> : null}
          {item.isNew ? <p>{copy.meaningPrompt}</p> : null}
          <button
            type="button"
            className="play-row"
            aria-pressed={playing}
            onClick={() => void hear(target.file, target.speech, 1)}
          >
            <span className="play-mark" aria-hidden="true" />
            {playing ? copy.playingNormal : copy.play}
          </button>
          {showTarget ? (
            followWords && spoken ? (
              spoken
            ) : (
              <p className={playing ? 'target-line playing' : 'target-line'} data-testid="target-line" lang={targetLang}>
                <RichText text={target.text} />
              </p>
            )
          ) : null}
          <ul className="choices">
            {choices.map((choice) => {
              const line = resolvePlayback(choice, app, settings.viRegion, prefsFromSettings(app, settings))
              return (
                <li key={choice.id}>
                  <button
                    type="button"
                    disabled={picked != null}
                    onClick={() => {
                      setPicked(choice.id)
                      setAnswered(true)
                      void hear(target.file, target.speech, 1)
                    }}
                  >
                    <RichText text={line?.text ?? choice.id} />
                  </button>
                </li>
              )
            })}
          </ul>
          {answered ? <p className="hint">{copy.afterChoice}</p> : null}
          {answered ? (
            <button type="button" className="button primary" onClick={goNext}>
              {copy.next}
            </button>
          ) : null}
        </>
      ) : null}
      {step === 'recall' ? (
        <>
          <h1>{copy.recallTitle}</h1>
          <div className="card pad">
            <p className="prompt">
              <RichText text={source.text} />
            </p>
          </div>
          {!answered ? (
            <button
              type="button"
              className="button wide"
              onClick={() => {
                setAnswered(true)
                void hear(target.file, target.speech, 1)
              }}
            >
              {copy.saidIt}
            </button>
          ) : (
            <div className="card pad stack">
              <button type="button" className="play-row" aria-pressed={playing} onClick={() => void hear(target.file, target.speech, 1)}>
                <span className="play-mark" aria-hidden="true" />
                {playing ? copy.playingNormal : copy.play}
              </button>
              {followWords && spoken ? (
                spoken
              ) : (
                <p className={playing ? 'target-line playing' : 'target-line'} data-testid="target-line" lang={targetLang}>
                  <RichText text={target.text} />
                </p>
              )}
            </div>
          )}
          {answered ? (
            <>
              <div className="rate-grid">
                {(
                  [
                    [Rating.Again, copy.rateAgain],
                    [Rating.Hard, copy.rateSoon],
                    [Rating.Good, copy.rateLater],
                    [Rating.Easy, copy.rateMuchLater],
                  ] as const
                ).map(([grade, label]) => (
                  <button key={grade} type="button" onClick={() => void rate(grade)}>
                    <strong>{label}</strong>
                    <span>{gap(grade)}</span>
                  </button>
                ))}
              </div>
              <p className="hint">{copy.rateHint}</p>
            </>
          ) : null}
        </>
      ) : null}
    </section>
  )
}
