import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { selectedVoice, spokenFile } from '../audio/voices'
import { resolvePlayback } from '../content/resolve'
import { directionId } from '../domain/direction'
import { alignmentFitsDuration, alignmentScale, loadAlignment, type WordTime } from '../audio/align'
import { decodeContourFile, playClip } from '../audio/player'
import { linksFor } from '../content/word-links'
import { SPEED_STEPS, effectiveSpeed, speedPercent, tempoFile, type SpeedStep } from '../audio/speed'
import { startMicrophone, type CaptureSession } from '../audio/recorder'
import { interfaceLang } from '../app/labels'
import { useApp } from '../app/state'
import { useCopy, useSettings } from '../app/use-copy'
import { PitchPanel } from '../components/PitchPanel'
import { KaraokeLine } from '../components/KaraokeLine'
import { RichText } from '../components/RichText'
import { contourFromSamples, type Contour } from '../pitch/contour'
import { cardIdFor } from '../srs/session'
import type { Dictionary } from '../i18n/dictionary'
import { prefsFromSettings, type Settings } from '../storage/types'
import type { Lang } from '../../content/phrase'

function audioCaption(copy: Dictionary, lang: Lang, settings: Settings): string {
  const id = selectedVoice(settings, lang).id
  if (lang === 'vi') return id === 'vais1000' ? copy.audioVi : copy.audioViMale
  if (lang === 'de') return id === 'thorsten-high' ? copy.audioDeHigh : copy.audioDe
  if (lang === 'en') return id === 'joe' ? copy.audioEnMale : copy.audioEn
  return id === 'cadu' ? copy.audioPtMale : copy.audioPt
}

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
  const [mineUrl, setMineUrl] = useState<string | null>(null)
  const sessionRef = useRef<CaptureSession | null>(null)
  const urlRef = useRef<string | null>(null)
  const aliveRef = useRef(true)
  const micToken = useRef(0)
  const releaseRef = useRef<() => void>(() => undefined)

  function releaseCaptureNow(): void {
    micToken.current += 1
    sessionRef.current?.release(urlRef.current)
    sessionRef.current = null
    urlRef.current = null
    if (!aliveRef.current) return
    setRecording(false)
  }

  releaseRef.current = releaseCaptureNow
  const [micError, setMicError] = useState(false)
  const [userContour, setUserContour] = useState<Contour>([])
  const [modelContour, setModelContour] = useState<Contour>([])
  const [modelMissing, setModelMissing] = useState(false)

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
      setMineUrl(null)
    }
  }, [conceptId])

  const targetSpeech = target?.speech ?? ''
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
    if (!targetFile || targetLang !== 'vi' || userContour.length === 0) return
    void decodeContourFile(targetFile).then((decoded) => {
      if (!active) return
      if (!decoded) {
        setModelContour([])
        setModelMissing(true)
        return
      }
      setModelMissing(false)
      setModelContour(contourFromSamples(decoded.samples, decoded.sampleRate))
    })
    return () => {
      active = false
    }
  }, [targetFile, targetLang, userContour.length])

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
    const result = await playClip(
      file,
      target?.speech ?? '',
      targetLang ?? 'de',
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
    setMicError(false)
    const token = micToken.current + 1
    micToken.current = token
    try {
      const next = await startMicrophone((taken) => {
        if (!aliveRef.current || token !== micToken.current) {
          if (taken.url) URL.revokeObjectURL(taken.url)
          return
        }
        rememberUrl(taken.url)
        setUserContour(taken.samples && taken.sampleRate ? contourFromSamples(taken.samples, taken.sampleRate) : [])
        setRecording(false)
      })
      if (!next || !aliveRef.current || token !== micToken.current) {
        next?.release(null)
        if (!next && aliveRef.current && token === micToken.current) setMicError(true)
        return
      }
      sessionRef.current?.release(null)
      sessionRef.current = next
      setRecording(true)
    } catch {
      if (aliveRef.current && token === micToken.current) setMicError(true)
    }
  }

  return (
    <article className="stack phrase">
      <p>
        <Link to={`/situation/${concept.situationIds[0] ?? ''}`}>{copy.back}</Link>
      </p>
      {followWords ? (
        <KaraokeLine
          heading
          lang={targetLang}
          speech={target.speech}
          gloss={source.speech}
          links={links}
          times={times && (clipDuration == null || alignmentFitsDuration(times, clipDuration, alignmentScale(timingFile))) ? times : null}
          seconds={playing ? seconds : null}
          note={copy.glossUnchecked}
          template={target.text}
        />
      ) : (
        <>
          <h1>
            <RichText text={target.text} />
          </h1>
          <p className="gloss">
            <RichText text={source.text} />
          </p>
        </>
      )}
      <p className="hint">{copy.exampleAudio}</p>
      <p>
        {copy.context}: {concept.context[ui]}
      </p>
      {targetLang === 'vi' ? <p className="warn">{audioCaption(copy, targetLang, settings)}</p> : <p className="hint">{audioCaption(copy, targetLang, settings)}</p>}
      {heard === 'offline' ? <p className="warn" role="status">{copy.audioOffline}</p> : null}
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
        <p className="hint">{settings.speed === 'auto' ? copy.speedAutoHint(percent) : copy.speedFixedHint(percent)}</p>
      </fieldset>
      <div className="row">
        <button
          type="button"
          className="play-row"
          aria-pressed={playing}
          onClick={() => void onPlay(tempoFile(spokenFile(settings, targetLang, target.file), step), step)}
        >
          <span className="play-mark" aria-hidden="true" />
          {playing ? copy.playing : copy.play}
        </button>
        <Link className="button" to={`/show/${concept.id}`}>
          {copy.showThis}
        </Link>
      </div>
      {pairNotes.map((note) => (
        <p key={note.id} className="hint">
          {copy.pairNote}: {note.text[ui]}
        </p>
      ))}
      <section className="record">
        <h2>{copy.record}</h2>
        <p className="hint">{copy.micHint}</p>
        {micError ? <p role="alert">{copy.micDenied}</p> : null}
        <div className="row">
          {recording ? (
            <button type="button" onClick={() => sessionRef.current?.recorder.stop()}>
              {copy.stop}
            </button>
          ) : (
            <button type="button" onClick={() => void onRecord()}>
              {copy.record}
            </button>
          )}
          {mineUrl ? (
            <button
              type="button"
              onClick={() => {
                const audio = new Audio(mineUrl)
                void audio.play()
              }}
            >
              {copy.playMine}
            </button>
          ) : null}
        </div>
      </section>
      {targetLang === 'vi' && userContour.length > 0 ? (
        <PitchPanel model={modelContour} user={userContour} copy={copy} modelMissing={modelMissing} />
      ) : null}
      <p className="hint">{copy.uncheckedCalm}</p>
    </article>
  )
}
