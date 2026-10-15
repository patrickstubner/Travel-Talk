import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { melodyReferenceVoices, selectedVoice, spokenFile } from '../audio/voices'
import { resolvePlayback, voiceFile } from '../content/resolve'
import { directionId } from '../domain/direction'
import { alignmentFitsDuration, alignmentScale, loadAlignment, type WordTime } from '../audio/align'
import { decodeContourFile, playClip, stopClip } from '../audio/player'
import { linksFor } from '../content/word-links'
import { SPEED_STEPS, effectiveSpeed, speedPercent, tempoFile, type SpeedStep } from '../audio/speed'
import { startMicrophone, type CaptureSession } from '../audio/recorder'
import { stopSlices } from '../audio/slice'
import { interfaceLang } from '../app/labels'
import { useApp } from '../app/state'
import { useCopy, useSettings } from '../app/use-copy'
import { fixedPart, lineContext, pairPart, speedPart, voiceCaption } from '../audio/notes'
import { RepeatFeedback } from '../components/RepeatFeedback'
import { KaraokeLine } from '../components/KaraokeLine'
import { LearnCard } from '../components/LearnCard'
import { RichText } from '../components/RichText'
import { cardIdFor } from '../srs/session'
import { prefsFromSettings } from '../storage/types'

export function PhrasePage() {
  const { conceptId = '' } = useParams()
  const { catalog, snapshot, saveSettings } = useApp()
  const settings = useSettings()
  const copy = useCopy()
  const app = settings.appLang
  const targetLang = settings.targetLang
  const direction = app && targetLang ? directionId(app, targetLang) : null
  const concept = catalog?.concepts.find((item) => item.id === conceptId)
  const ui = interfaceLang(settings)
  const [heard, setHeard] = useState<'file' | 'offline' | null>(null)
  const [playing, setPlaying] = useState(false)
  const [seconds, setSeconds] = useState<number | null>(null)
  const [times, setTimes] = useState<WordTime[] | null>(null)
  const [clipDuration, setClipDuration] = useState<number | null>(null)
  const [recording, setRecording] = useState(false)
  const [micStarting, setMicStarting] = useState(false)
  const [mineUrl, setMineUrl] = useState<string | null>(null)
  const sessionRef = useRef<CaptureSession | null>(null)
  const urlRef = useRef<string | null>(null)
  const mineAudio = useRef<HTMLAudioElement | null>(null)
  const aliveRef = useRef(true)
  const micToken = useRef(0)
  const releaseRef = useRef<() => void>(() => undefined)

  function stopMinePlayback(): void {
    const audio = mineAudio.current
    if (!audio) return
    audio.pause()
    try {
      audio.currentTime = 0
    } catch {
      // The element cannot seek until it has data. Pause already keeps it out of the take.
    }
  }

  function releaseCaptureNow(): void {
    micToken.current += 1
    sessionRef.current?.release(urlRef.current)
    sessionRef.current = null
    urlRef.current = null
    if (!aliveRef.current) return
    setRecording(false)
    setMicStarting(false)
  }

  releaseRef.current = releaseCaptureNow
  const [micError, setMicError] = useState(false)
  const [userAudio, setUserAudio] = useState<{ samples: Float32Array; sampleRate: number } | null>(null)
  const [modelAudio, setModelAudio] = useState<{ samples: Float32Array; sampleRate: number } | null>(null)
  const [referenceTakes, setReferenceTakes] = useState<Array<{ samples: Float32Array; sampleRate: number; words: WordTime[] | null }>>([])
  const [modelMissing, setModelMissing] = useState(false)
  const [feedbackTimes, setFeedbackTimes] = useState<WordTime[] | null>(null)
  const [timingsPending, setTimingsPending] = useState(false)

  const target = concept && targetLang ? resolvePlayback(concept, targetLang, settings.viRegion, prefsFromSettings(targetLang, settings)) : undefined
  const source = concept && app ? resolvePlayback(concept, app, settings.viRegion, prefsFromSettings(app, settings)) : undefined
  const targetFile = target && targetLang ? spokenFile(settings, targetLang, target.file) : ''
  const followWords = settings.highlightWords !== false
  const stored = direction && concept && snapshot
    ? snapshot.cards.find((card) => card.cardId === cardIdFor(direction, concept.id))
    : undefined
  const step = effectiveSpeed(settings.speed, stored)
  const alignFile = targetFile ? tempoFile(targetFile, step) : ''
  const lockedFile = useRef('')
  const timingFile = playing && lockedFile.current ? lockedFile.current : alignFile
  const links = useMemo(() => {
    if (!concept || !target || !source || !app || !targetLang || !followWords) return []
    return linksFor(concept.id, targetLang, app, target.speech, source.speech, settings)
  }, [app, concept, followWords, settings, source, target, targetLang])

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
      stopMinePlayback()
      mineAudio.current = null
      setMineUrl(null)
      setUserAudio(null)
    }
  }, [conceptId])

  const targetSpeech = target?.speech ?? ''
  const referenceKey =
    target && targetLang
      ? melodyReferenceVoices(targetLang, selectedVoice(settings, targetLang).id)
          .map((voice) => tempoFile(voiceFile(target.file, voice.id, voice.legacy), step))
          .join('\n')
      : ''
  useEffect(() => {
    let live = true
    if (!followWords || !timingFile || !targetSpeech) {
      setTimes(null)
      return
    }
    void loadAlignment(timingFile, targetSpeech).then((value) => {
      if (live) setTimes(value)
    })
    return () => {
      live = false
    }
  }, [followWords, targetSpeech, timingFile])

  useEffect(() => {
    let active = true
    if (!userAudio || !alignFile || !targetSpeech) {
      setModelAudio(null)
      setReferenceTakes([])
      setModelMissing(false)
      setFeedbackTimes(null)
      setTimingsPending(false)
      return
    }
    const referenceFiles = referenceKey ? referenceKey.split('\n') : []
    setTimingsPending(true)
    void decodeContourFile(alignFile).then(async (decoded) => {
      if (!active) return
      const aligned = await loadAlignment(alignFile, targetSpeech)
      if (!active) return
      const duration = decoded ? decoded.samples.length / decoded.sampleRate : 0
      setModelAudio(decoded)
      setModelMissing(!decoded)
      if (decoded && aligned && alignmentFitsDuration(aligned, duration, alignmentScale(alignFile))) setFeedbackTimes(aligned)
      else setFeedbackTimes(null)
      const loaded = await Promise.all(
        referenceFiles.map(async (name) => {
          const clip = await decodeContourFile(name)
          if (!clip) return null
          const aligned = await loadAlignment(name, targetSpeech)
          const clipDuration = clip.samples.length / clip.sampleRate
          const words = aligned && alignmentFitsDuration(aligned, clipDuration, alignmentScale(name)) ? aligned : null
          return { samples: clip.samples, sampleRate: clip.sampleRate, words }
        }),
      )
      if (!active) return
      setReferenceTakes(loaded.filter((clip): clip is { samples: Float32Array; sampleRate: number; words: WordTime[] | null } => clip != null))
      setTimingsPending(false)
    })
    return () => {
      active = false
    }
  }, [alignFile, referenceKey, targetSpeech, userAudio])

  if (!catalog || !concept || !direction || !app || !targetLang || !target || !source) {
    return <p>{direction ? copy.noResults : copy.needPair}</p>
  }

  const pairNotes = catalog.pairNotes.filter(
    (note) => note.sourceLang === app && note.targetLang === targetLang && (!note.conceptId || note.conceptId === concept.id),
  )
  const percent = speedPercent(step)

  async function onPlay(file: string, rate: SpeedStep): Promise<void> {
    lockedFile.current = file
    setPlaying(true)
    setSeconds(0)
    setClipDuration(null)
    const release = (): void => {
      if (!aliveRef.current) return
      lockedFile.current = ''
      setPlaying(false)
      setSeconds(null)
    }
    const result = await playClip(
      file,
      target?.speech ?? '',
      targetLang ?? 'de',
      rate,
      release,
      (time) => {
        if (aliveRef.current) setSeconds(time)
      },
      (duration) => {
        if (aliveRef.current) setClipDuration(duration)
      },
      release,
    )
    if (!aliveRef.current) return
    if (result === 'offline') {
      lockedFile.current = ''
      setPlaying(false)
      setSeconds(null)
    }
    setHeard(result)
  }

  function rememberUrl(url: string | null): void {
    if (urlRef.current && urlRef.current !== url) URL.revokeObjectURL(urlRef.current)
    urlRef.current = url
    setMineUrl(url)
  }

  async function onRecord(): Promise<void> {
    stopClip()
    stopSlices()
    stopMinePlayback()
    setPlaying(false)
    setMicError(false)
    setMicStarting(true)
    const token = micToken.current + 1
    micToken.current = token
    try {
      const next = await startMicrophone((taken) => {
        if (!aliveRef.current || token !== micToken.current) {
          if (taken.url) URL.revokeObjectURL(taken.url)
          return
        }
        rememberUrl(taken.url)
        setUserAudio(taken.samples && taken.sampleRate ? { samples: taken.samples, sampleRate: taken.sampleRate } : null)
        setRecording(false)
      })
      if (!aliveRef.current || token !== micToken.current) {
        next?.release(null)
        return
      }
      if (!next) {
        setMicError(true)
        setMicStarting(false)
        return
      }
      sessionRef.current?.release(null)
      sessionRef.current = next
      setRecording(true)
      setMicStarting(false)
    } catch {
      if (aliveRef.current && token === micToken.current) {
        setMicError(true)
        setMicStarting(false)
      }
    }
  }

  return (
    <article className="stack learn phrase" data-testid="phrase">
      <p className="back-row">
        <Link to={`/situation/${concept.situationIds[0] ?? ''}`}>{copy.back}</Link>
      </p>
      <LearnCard
        parts={[
          fixedPart(ui, 'ui.example', copy.exampleAudio),
          lineContext(copy, ui, concept.id, concept.context[ui]),
          voiceCaption(copy, ui, targetLang, settings),
          ...(followWords ? [fixedPart(ui, 'ui.gloss', copy.glossUnchecked), { text: copy.wordDots, clip: null }] : []),
          speedPart(copy, ui, settings.speed, percent),
          ...pairNotes.map((note) => pairPart(copy, ui, note.id, note.text[ui])),
          fixedPart(ui, 'ui.mic', copy.micHint),
          fixedPart(ui, 'ui.unchecked', copy.uncheckedCalm),
        ]}
      >
        {followWords ? (
          <KaraokeLine
            heading
            lang={targetLang}
            speech={target.speech}
            gloss={source.speech}
            links={links}
            times={times && (clipDuration == null || alignmentFitsDuration(times, clipDuration, alignmentScale(timingFile))) ? times : null}
            seconds={playing ? seconds : null}
            template={target.text}
          />
        ) : (
          <>
            <h1 data-testid="target-line" lang={targetLang}>
              <RichText text={target.text} />
            </h1>
            <p className="gloss">
              <RichText text={source.text} />
            </p>
          </>
        )}
      </LearnCard>
      {heard === 'offline' ? (
        <p className="warn" role="status">
          {copy.audioOffline}
        </p>
      ) : null}
      <div className="learn-actions" data-testid="learn-actions">
        <p className="speed-now" data-testid="speed-now">
          {copy.speedShown(percent)}
        </p>
        <fieldset className="speed" data-testid="speed-control">
          <legend>{copy.speedTitle}</legend>
          <div className="row" role="group" aria-label={copy.speedTitle}>
            <button type="button" aria-pressed={settings.speed === 'auto'} onClick={() => void saveSettings({ ...settings, speed: 'auto' })}>
              {copy.speedAuto}
            </button>
            {SPEED_STEPS.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={settings.speed === option}
                onClick={() => void saveSettings({ ...settings, speed: option })}
              >
                {option === 0.7 ? copy.speed70 : option === 0.85 ? copy.speed85 : copy.speed100}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="row">
          <button
            type="button"
            className="play-row"
            aria-pressed={playing}
            disabled={recording || micStarting}
            onClick={() => void onPlay(tempoFile(spokenFile(settings, targetLang, target.file), step), step)}
          >
            <span className="play-mark" aria-hidden="true" />
            {playing ? copy.playing : copy.play}
          </button>
          <Link className="button" to={`/show/${concept.id}`}>
            {copy.showThis}
          </Link>
        </div>
      </div>
      <div className="learn-speak" data-testid="learn-record">
        {micError ? <p role="alert">{copy.micDenied}</p> : null}
        <div className="row">
          {recording ? (
            <button type="button" onClick={() => sessionRef.current?.recorder.stop()}>
              {copy.stop}
            </button>
          ) : (
            <button type="button" className="button accent" disabled={micStarting} onClick={() => void onRecord()}>
              {userAudio ? copy.repeatFeedback.again : copy.record}
            </button>
          )}
          {mineUrl ? (
            <button
              type="button"
              disabled={recording || micStarting}
              onClick={() => {
                stopMinePlayback()
                const audio = new Audio(mineUrl)
                mineAudio.current = audio
                void audio.play()
              }}
            >
              {copy.playMine}
            </button>
          ) : null}
        </div>
        {userAudio && !recording && !micStarting ? (
          <RepeatFeedback
            copy={copy}
            lang={targetLang}
            uiLang={settings.appLang ?? 'de'}
            region={settings.viRegion}
            speech={target.speech}
            words={feedbackTimes}
            modelSamples={modelAudio?.samples ?? null}
            modelRate={modelAudio?.sampleRate ?? 0}
            userSamples={userAudio.samples}
            userRate={userAudio.sampleRate}
            modelMissing={modelMissing}
            timingsPending={timingsPending}
            voiceId={selectedVoice(settings, targetLang).id}
            referenceClips={referenceTakes}
          />
        ) : null}
        {!userAudio && mineUrl ? <p role="status">{copy.pitchEmpty}</p> : null}
      </div>
    </article>
  )
}
