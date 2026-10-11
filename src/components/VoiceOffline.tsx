import { useEffect, useRef, useState } from 'react'
import type { Lang } from '../../content/phrase'
import { discardAdded, loadVoiceOffline, voiceProgress } from '../audio/offline'
import type { CatalogVoice } from '../audio/voices'
import type { Dictionary } from '../i18n/dictionary'

type Phase =
  | { kind: 'check' }
  | { kind: 'idle'; have: number; total: number }
  | { kind: 'loading'; have: number; total: number }
  | { kind: 'ready'; total: number }
  | { kind: 'missing'; have: number; total: number; missing: number }
  | { kind: 'error'; have: number; total: number }
  | { kind: 'full'; have: number; total: number; added: string[] }

function counts(phase: Phase): { have: number; total: number } {
  if (phase.kind === 'check') return { have: 0, total: 0 }
  return { have: 'have' in phase ? phase.have : 0, total: phase.total }
}

export function VoiceOfflineButton({
  lang,
  voice,
  copy,
  dropOnSuccess,
  onKeepPrevious,
}: {
  lang: Lang
  voice: CatalogVoice
  copy: Dictionary
  dropOnSuccess: boolean
  onKeepPrevious?: () => void
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
      if (outcome.status === 'full') return { kind: 'full', have, total, added: outcome.added }
      if (outcome.status === 'ready' && outcome.missing > 0) return { kind: 'missing', have, total, missing: outcome.missing }
      if (outcome.status === 'ready') return { kind: 'ready', total }
      return { kind: 'error', have, total }
    })
  }

  async function keepPrevious(): Promise<void> {
    if (phase.kind !== 'full') return
    await discardAdded(phase.added)
    onKeepPrevious?.()
    const progress = await voiceProgress(lang, voice)
    if (progress.total > 0 && progress.have === progress.total) setPhase({ kind: 'ready', total: progress.total })
    else setPhase({ kind: 'idle', have: progress.have, total: progress.total })
  }

  if (phase.kind === 'check') return null
  const progress = counts(phase)
  const showCount = progress.total > 0 && (progress.have > 0 || phase.kind === 'loading' || phase.kind === 'full')
  if (phase.kind === 'ready') {
    return (
      <p className="hint voice-offline" role="status">
        {copy.offlineReady}
      </p>
    )
  }
  return (
    <div className="voice-offline">
      {showCount ? <p role="status">{copy.offlineProgress(progress.have, progress.total)}</p> : null}
      {phase.kind === 'missing' ? <p role="status">{copy.offlineMissing(phase.missing)}</p> : null}
      {phase.kind === 'full' ? (
        <p className="warn" role="alert">
          {copy.offlineFull}
        </p>
      ) : null}
      {phase.kind === 'loading' ? null : (
        <button type="button" onClick={() => void start()}>
          {phase.kind === 'error' || phase.kind === 'full' || phase.kind === 'missing' ? copy.offlineRetry : copy.offlineLoad}
        </button>
      )}
      {phase.kind === 'full' ? (
        <button type="button" onClick={() => void keepPrevious()}>
          {copy.offlineKeep}
        </button>
      ) : null}
    </div>
  )
}
