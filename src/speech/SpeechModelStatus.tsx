import { useEffect, useState } from 'react'
import type { Lang } from '../../content/phrase'
import { LANG_LABEL } from '../app/labels'
import type { Dictionary } from '../i18n/dictionary'
import {
  SPEECH_MODELS,
  acceptSpeechModel,
  connectionSavesData,
  prepareSpeechModel,
  speechModelsInThisRun,
  speechState,
  subscribeSpeech,
  type SpeechState,
} from './vosk'

/** Asks before the download for the language being practised. A checked cache loads without a tap. */
export function SpeechModelStatus({ copy, lang, uiLang }: { copy: Dictionary; lang: Lang; uiLang: Lang }) {
  const [state, setState] = useState<SpeechState>(speechState(lang))
  const [offer, setOffer] = useState(false)
  const [saveData, setSaveData] = useState(false)
  const megabytes = Math.max(1, Math.round(SPEECH_MODELS[lang].bytes / 1_000_000))
  const name = LANG_LABEL[lang][uiLang]
  useEffect(() => {
    if (!speechModelsInThisRun()) return undefined
    setSaveData(connectionSavesData())
    setOffer(false)
    const stop = subscribeSpeech(lang, setState)
    void prepareSpeechModel(lang).then((next) => setOffer(next === 'offer'))
    return stop
  }, [lang])
  if (state.phase === 'loading') {
    return (
      <p className="voice-note" role="status" data-testid="speech-progress">
        {copy.speechProgress(name, state.progress)}
        <progress value={state.progress} max={100} />
      </p>
    )
  }
  if (state.phase === 'failed') {
    return (
      <p className="voice-note" role="status" data-testid="speech-fallback">
        {copy.speechFallback}
      </p>
    )
  }
  if (offer && state.phase !== 'ready') {
    return (
      <p className="voice-note" data-testid="speech-offer">
        {saveData ? copy.speechOfferSave(name, megabytes) : copy.speechOffer(name, megabytes)}{' '}
        <button
          type="button"
          data-testid="speech-load"
          onClick={() => {
            setOffer(false)
            acceptSpeechModel(lang)
          }}
        >
          {copy.speechLoad}
        </button>
      </p>
    )
  }
  return null
}
