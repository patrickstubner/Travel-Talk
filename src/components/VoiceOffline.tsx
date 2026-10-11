import { useEffect, useRef, useState } from 'react'
import type { Lang } from '../../content/phrase'
import { loadVoiceOffline, voiceProgress } from '../audio/offline'
import type { CatalogVoice } from '../audio/voices'
import type { Dictionary } from '../i18n/dictionary'

type Phase =
  | { kind: 'check' }
  | { kind: 'idle'; have: number; total: number }
  | { kind: 'loading'; have: number; total: number }
  | { kind: 'ready'; total: number }
  | { kind: 'error'; have: number; total: number }
  | { kind: 'full'; have: number; total: number }

export function VoiceOfflineButton({
  lang,
  voice,
  copy,
  dropOnSuccess,
}: {
  lang: Lang
  voice: CatalogVoice
  copy: Dictionary
  dropOnSuccess: boolean
}) {
  const [phase, setPhase] = useState<Phase>({ kind: 'check' })
  const dropRef = useRef(dropOnSuccess)
  dropRef.current = dropOnSuccess
  const run = useRef(0)

  useEffect(() => {
    let live = true
    function apply(progress: { have: number; total: number }): void {
      if (!live) return
      if (progress.total > 0 && progress.have === progress.total) setPhase({ kind: 'ready', total: progress.total })
      else setPhase({ kind: 'idle', have: progress.have, total: progress.total })
    }
    void voiceProgress(lang, voice).then(apply)
    function onPreserved(): void {
      void voiceProgress(lang, voice).then(apply)
    }
    window.addEventListener('travel-talk-audio-preserved', onPreserved)
    return () => {
      live = false
      window.removeEventListener('travel-talk-audio-preserved', onPreserved)
    }
  }, [lang, voice])

  async function start(): Promise<void> {
    const token = run.current + 1
    run.current = token
    setPhase((prev) => ({
      kind: 'loading',
      have: 'have' in prev ? prev.have : 0,
      total: 'total' in prev ? prev.total : 0,
    }))
    const outcome = await loadVoiceOffline(
      lang,
      voice,
      (have, total) => {
        if (run.current === token) setPhase({ kind: 'loading', have, total })
      },
      { dropOthers: () => dropRef.current },
    )
    if (run.current !== token) return
    setPhase((prev) => {
      const have = 'have' in prev ? prev.have : 0
      const total = 'total' in prev ? prev.total : 0
      if (outcome === 'ready') return { kind: 'ready', total }
      if (outcome === 'full') return { kind: 'full', have, total }
      return { kind: 'error', have, total }
    })
  }

  if (phase.kind === 'check') return null
  if (phase.kind === 'ready') {
    return (
      <p className="hint voice-offline" role="status">
        {copy.offlineReady}
      </p>
    )
  }
  if (phase.kind === 'full') {
    return (
      <p className="warn voice-offline" role="alert">
        {copy.offlineFull}
      </p>
    )
  }
  return (
    <div className="voice-offline">
      {phase.kind === 'loading' ? <p role="status">{copy.offlineProgress(phase.have, phase.total)}</p> : null}
      {phase.kind === 'loading' ? null : (
        <button type="button" onClick={() => void start()}>
          {phase.kind === 'error' ? copy.offlineRetry : copy.offlineLoad}
        </button>
      )}
    </div>
  )
}
