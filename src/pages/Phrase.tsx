import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { resolvePlayback } from '../content/resolve'
import { directionId } from '../domain/direction'
import { decodeContourFile, playClip } from '../audio/player'
import { SPEED_STEPS, effectiveSpeed, speedPercent, tempoFile, type SpeedStep } from '../audio/speed'
import { startMicrophone, type CaptureSession } from '../audio/recorder'
import { interfaceLang } from '../app/labels'
import { useApp } from '../app/state'
import { useCopy, useSettings } from '../app/use-copy'
import { PitchPanel } from '../components/PitchPanel'
import { RichText } from '../components/RichText'
import { contourFromSamples, type Contour } from '../pitch/contour'
import { cardIdFor } from '../srs/session'
import { prefsFromSettings } from '../storage/types'

const AUDIO_COPY = {
  vi: 'audioVi',
  'pt-BR': 'audioPt',
  de: 'audioDe',
  en: 'audioEn',
} as const

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
  const [heard, setHeard] = useState<'file' | 'synth' | null>(null)
  const [playing, setPlaying] = useState(false)
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
  const targetFile = target?.file ?? ''

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
  const stored = snapshot?.cards.find((card) => card.cardId === cardIdFor(direction, concept.id))
  const step = effectiveSpeed(settings.speed, stored)
  const percent = speedPercent(step)

  async function onPlay(file: string, rate: SpeedStep): Promise<void> {
    setPlaying(true)
    const result = await playClip(file, target?.speech ?? '', targetLang ?? 'de', rate, () => {
      if (aliveRef.current) setPlaying(false)
    })
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
      <h1>
        <RichText text={target.text} />
      </h1>
      <p className="gloss">
        <RichText text={source.text} />
      </p>
      <p className="hint">{copy.exampleAudio}</p>
      <p>
        {copy.context}: {concept.context[ui]}
      </p>
      {targetLang === 'vi' ? <p className="warn">{copy.audioVi}</p> : <p className="hint">{copy[AUDIO_COPY[targetLang]]}</p>}
      {heard === 'synth' ? <p className="warn">{copy.audioSynth}</p> : null}
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
          onClick={() => void onPlay(tempoFile(target.file, step), step)}
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
