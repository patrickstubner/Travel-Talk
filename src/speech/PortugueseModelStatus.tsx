import { useEffect, useState } from 'react'
import type { Dictionary } from '../i18n/dictionary'
import { ensurePortugueseModel, portugueseSpeechState, speechModelsInThisRun, subscribePortugueseSpeech, type SpeechState } from './vosk-pt'

/** Starts the Portuguese model the first time a speaking page mounts, and shows progress. */
export function PortugueseModelStatus({ copy }: { copy: Dictionary }) {
  const [state, setState] = useState<SpeechState>(portugueseSpeechState)
  useEffect(() => {
    if (!speechModelsInThisRun()) return undefined
    const stop = subscribePortugueseSpeech(setState)
    void ensurePortugueseModel()
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
  return null
}
