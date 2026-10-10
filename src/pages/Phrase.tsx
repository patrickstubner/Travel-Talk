import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { addressForms, hasAddressToken } from '../../content/address'
import type { Lang } from '../../content/phrase'
import { pickRealization, resolvePlayback } from '../content/resolve'
import { pairById } from '../domain/pairs'
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
import { prefsFromSettings, type Settings } from '../storage/types'

const AUDIO_COPY = {
  vi: 'audioVi',
  'pt-BR': 'audioPt',
  de: 'audioDe',
  en: 'audioEn',
} as const

function applyVariant(settings: Settings, lang: Lang, id: string): Settings {
  if (lang === 'vi' && (id === 'phone' || id === 'zalo')) return { ...settings, viContact: id }
  if (lang === 'vi') return { ...settings, addressVi: id }
  if (lang === 'pt-BR' && (id === 'obrigado' || id === 'obrigada')) return { ...settings, ptSpeaker: id }
  if (lang === 'pt-BR') return { ...settings, addressPt: id }
  if (lang === 'de' && (id === 'sie' || id === 'du')) return { ...settings, addressDe: id }
  return settings
}

export function PhrasePage() {
  const { conceptId = '' } = useParams()
  const { catalog, snapshot, saveSettings } = useApp()
  const settings = useSettings()
  const copy = useCopy()
  const pair = pairById(settings.pairId)
  const concept = catalog?.concepts.find((item) => item.id === conceptId)
  const ui = interfaceLang(settings)
  const [heard, setHeard] = useState<'file' | 'synth' | null>(null)
  const [recording, setRecording] = useState(false)
  const [mineUrl, setMineUrl] = useState<string | null>(null)
  const sessionRef = useRef<CaptureSession | null>(null)
  const urlRef = useRef<string | null>(null)
  const aliveRef = useRef(true)
  const [micError, setMicError] = useState(false)
  const [userContour, setUserContour] = useState<Contour>([])
  const [modelContour, setModelContour] = useState<Contour>([])
  const [modelMissing, setModelMissing] = useState(false)

  const target = concept && pair ? resolvePlayback(concept, pair.target, settings.viRegion, prefsFromSettings(pair.target, settings)) : undefined
  const source = concept && pair ? resolvePlayback(concept, pair.source, settings.viRegion, prefsFromSettings(pair.source, settings)) : undefined
  const targetFile = target?.file ?? ''

  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
      sessionRef.current?.release(urlRef.current)
      sessionRef.current = null
      urlRef.current = null
      setMineUrl(null)
      setRecording(false)
    }
  }, [conceptId])

  useEffect(() => {
    let active = true
    if (!targetFile || pair?.target !== 'vi') return
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
  }, [targetFile, pair?.target])

  if (!catalog || !concept || !pair || !target || !source) {
    return <p>{pair ? copy.noResults : copy.needPair}</p>
  }

  const realization = pickRealization(concept, pair.target, settings.viRegion)
  const address = realization && (hasAddressToken(realization.text) || hasAddressToken(realization.speech ?? ''))
  const forms = address ? addressForms(pair.target) : []
  const variants = !address ? (realization?.variants ?? []) : []
  const pairNotes = catalog.pairNotes.filter(
    (note) => note.sourceLang === pair.source && note.targetLang === pair.target && (!note.conceptId || note.conceptId === concept.id),
  )

  const stored = snapshot?.cards.find((card) => card.cardId === cardIdFor(pair.id, concept.id))
  const step = effectiveSpeed(settings.speed, stored)
  const percent = speedPercent(step)

  async function onPlay(file: string, rate: SpeedStep): Promise<void> {
    const result = await playClip(file, target?.speech ?? '', pair?.target ?? 'de', rate)
    setHeard(result)
  }

  function rememberUrl(url: string | null): void {
    if (urlRef.current && urlRef.current !== url) URL.revokeObjectURL(urlRef.current)
    urlRef.current = url
    setMineUrl(url)
  }

  async function onRecord(): Promise<void> {
    setMicError(false)
    try {
      const next = await startMicrophone((taken) => {
        if (!aliveRef.current) {
          if (taken.url) URL.revokeObjectURL(taken.url)
          return
        }
        rememberUrl(taken.url)
        setUserContour(taken.samples && taken.sampleRate ? contourFromSamples(taken.samples, taken.sampleRate) : [])
        setRecording(false)
      })
      if (!next || !aliveRef.current) {
        next?.release(null)
        if (!next) setMicError(true)
        return
      }
      sessionRef.current?.release(null)
      sessionRef.current = next
      setRecording(true)
    } catch {
      setMicError(true)
    }
  }

  return (
    <article className="stack phrase">
      <p>
        <Link to={`/situation/${concept.situationIds[0] ?? ''}`}>{copy.back}</Link>
      </p>
      <p className="badge">{copy.unchecked}</p>
      <h1>
        <RichText text={target.text} />
      </h1>
      <p className="gloss">
        <RichText text={source.text} />
      </p>
      <p className="hint">{copy.exampleAudio}</p>
      <p>{copy.context}: {concept.context[ui]}</p>
      {pair.target === 'vi' ? <p className="warn">{copy.audioVi}</p> : <p className="hint">{copy[AUDIO_COPY[pair.target]]}</p>}
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
        <button type="button" className="button" onClick={() => void onPlay(tempoFile(target.file, step), step)}>
          {copy.play}
        </button>
        <Link className="button" to={`/show/${concept.id}`}>
          {copy.showThis}
        </Link>
      </div>
      {forms.length > 0 ? (
        <fieldset>
          <legend>{copy.addressTitle}</legend>
          {forms.map((form) => (
            <label key={form.id} className="choice">
              <input
                type="radio"
                name="address"
                checked={prefsFromSettings(pair.target, settings).includes(form.id)}
                onChange={() => void saveSettings(applyVariant(settings, pair.target, form.id))}
              />
              {form.label}
              <span className="hint">{form.note[ui]}</span>
            </label>
          ))}
        </fieldset>
      ) : null}
      {variants.length > 0 ? (
        <fieldset>
          <legend>{copy.addressTitle}</legend>
          {variants.map((variant) => (
            <label key={variant.id} className="choice">
              <input
                type="radio"
                name="variant"
                checked={target.variantId === variant.id || (target.variantId === 'base' && variant.text === realization?.text)}
                onChange={() => void saveSettings(applyVariant(settings, pair.target, variant.id))}
              />
              {variant.label}
            </label>
          ))}
        </fieldset>
      ) : null}
      {pair.target === 'vi' && concept.realizations.some((row) => row.lang === 'vi' && row.region) ? (
        <fieldset>
          <legend>{copy.viRegion}</legend>
          <label className="choice">
            <input type="radio" name="region" checked={settings.viRegion === 'south'} onChange={() => void saveSettings({ ...settings, viRegion: 'south' })} />
            {copy.regionSouth}
          </label>
          <label className="choice">
            <input type="radio" name="region" checked={settings.viRegion === 'north'} onChange={() => void saveSettings({ ...settings, viRegion: 'north' })} />
            {copy.regionNorth}
          </label>
        </fieldset>
      ) : null}
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
      {pair.target === 'vi' ? <PitchPanel model={modelContour} user={userContour} copy={copy} modelMissing={modelMissing} /> : null}
    </article>
  )
}
