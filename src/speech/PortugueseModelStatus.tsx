import { useEffect, useState } from 'react'
import type { Dictionary } from '../i18n/dictionary'
import {
  PORTUGUESE_MODEL_BYTES,
  acceptPortugueseModel,
  connectionSavesData,
  portugueseSpeechState,
  preparePortugueseModel,
  speechModelsInThisRun,
  subscribePortugueseSpeech,
  type SpeechState,
} from './vosk-pt'

const MEGABYTES = Math.max(1, Math.round(PORTUGUESE_MODEL_BYTES / 1_000_000))

/** Asks before the download. A checked cache loads without a tap. saveData never starts one. */
export function PortugueseModelStatus({ copy }: { copy: Dictionary }) {
  const [state, setState] = useState<SpeechState>(portugueseSpeechState)
  const [offer, setOffer] = useState(false)
  const [saveData, setSaveData] = useState(false)
  useEffect(() => {
    if (!speechModelsInThisRun()) return undefined
    setSaveData(connectionSavesData())
    const stop = subscribePortugueseSpeech(setState)
    void preparePortugueseModel().then((next) => setOffer(next === 'offer'))
    return stop
  }, [])
  if (state.phase === 'loading') {
    return (
      <p className="voice-note" role="status" data-testid="speech-progress">
        {copy.speechProgress(state.progress)}
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
        {saveData ? copy.speechOfferSave(MEGABYTES) : copy.speechOffer(MEGABYTES)}{' '}
        <button
          type="button"
          data-testid="speech-load"
          onClick={() => {
            setOffer(false)
            acceptPortugueseModel()
          }}
        >
          {copy.speechLoad}
        </button>
      </p>
    )
  }
  return null
}
