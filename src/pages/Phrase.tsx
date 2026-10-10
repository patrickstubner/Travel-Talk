import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { addressForms, hasAddressToken } from '../../content/address'
import type { Lang } from '../../content/phrase'
import { pickRealization, resolvePlayback } from '../content/resolve'
import { pairById } from '../domain/pairs'
import { decodeContourFile, playClip } from '../audio/player'
import { startMicrophone } from '../audio/recorder'
import { interfaceLang } from '../app/labels'
import { useApp } from '../app/state'
import { useCopy, useSettings } from '../app/use-copy'
import { PitchPanel } from '../components/PitchPanel'
import { RichText } from '../components/RichText'
import { contourFromSamples, type Contour } from '../pitch/contour'
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
  const { catalog, saveSettings } = useApp()
  const settings = useSettings()
  const copy = useCopy()
  const pair = pairById(settings.pairId)
  const concept = catalog?.concepts.find((item) => item.id === conceptId)
  const ui = interfaceLang(settings)
  const [heard, setHeard] = useState<'file' | 'synth' | null>(null)
  const [recording, setRecording] = useState(false)
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null)
  const [mineUrl, setMineUrl] = useState<string | null>(null)
  const [micError, setMicError] = useState(false)
  const [userContour, setUserContour] = useState<Contour>([])
  const [modelContour, setModelContour] = useState<Contour>([])
  const [modelMissing, setModelMissing] = useState(false)

  const target = concept && pair ? resolvePlayback(concept, pair.target, settings.viRegion, prefsFromSettings(pair.target, settings)) : undefined
  const source = concept && pair ? resolvePlayback(concept, pair.source, settings.viRegion, prefsFromSettings(pair.source, settings)) : undefined
  const targetFile = target?.file ?? ''

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

  async function onPlay(file: string): Promise<void> {
    const result = await playClip(file, target?.speech ?? '', pair?.target ?? 'de')
    setHeard(result)
  }

  async function onRecord(): Promise<void> {
    setMicError(false)
    try {
      const next = await startMicrophone((taken) => {
        setMineUrl((previous) => {
          if (previous) URL.revokeObjectURL(previous)
          return taken.url
        })
        setUserContour(taken.samples && taken.sampleRate ? contourFromSamples(taken.samples, taken.sampleRate) : [])
        setRecording(false)
        setRecorder(null)
      })
      if (!next) {
        setMicError(true)
        return
      }
      setRecorder(next)
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
      <div className="row">
        <button type="button" className="button" onClick={() => void onPlay(settings.slow ? target.slowFile : target.file)}>
          {copy.play}
        </button>
        <button type="button" onClick={() => void onPlay(target.slowFile)}>
          {copy.playSlow}
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
            <button type="button" onClick={() => recorder?.stop()}>
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
