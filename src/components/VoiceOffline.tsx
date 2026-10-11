import { useEffect, useRef, useState } from 'react'
import type { Lang } from '../../content/phrase'
import { AUDIO_CHANGED, discardAdded, loadVoiceOffline, notifyAudioChanged, voiceProgress } from '../audio/offline'
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
  pendingNote,
  retainIds = [],
}: {
  lang: Lang
  voice: CatalogVoice
  copy: Dictionary
  dropOnSuccess: boolean
  onKeepPrevious?: () => void
  /** Shown on the start page until this voice is fully cached. */
  pendingNote?: string
  /** Other people's voices of this language. A full download must not delete them. */
  retainIds?: readonly string[]
}) {
  const [phase, setPhase] = useState<Phase>({ kind: 'check' })
  const dropRef = useRef(dropOnSuccess)
  dropRef.current = dropOnSuccess
  const retainRef = useRef(retainIds)
  retainRef.current = retainIds
  const run = useRef(0)
  const busy = useRef(false)

  useEffect(() => {
    let live = true
    function apply(progress: { have: number; total: number }): void {
      if (!live || busy.current) return
      if (progress.total > 0 && progress.have === progress.total) setPhase({ kind: 'ready', total: progress.total })
      else setPhase({ kind: 'idle', have: progress.have, total: progress.total })
    }
    void voiceProgress(lang, voice).then(apply)
    function onChanged(): void {
      void voiceProgress(lang, voice).then(apply)
    }
    window.addEventListener(AUDIO_CHANGED, onChanged)
    return () => {
      live = false
      window.removeEventListener(AUDIO_CHANGED, onChanged)
    }
  }, [lang, voice])

  async function start(): Promise<void> {
    const token = run.current + 1
    run.current = token
    busy.current = true
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
      { dropOthers: () => dropRef.current, retainIds: retainRef.current },
    )
    busy.current = false
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
    const urls = phase.added
    busy.current = true
    try {
      await discardAdded(urls)
      onKeepPrevious?.()
    } finally {
      busy.current = false
    }
    notifyAudioChanged()
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
      {pendingNote ? <p className="hint">{pendingNote}</p> : null}
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
      {phase.kind === 'full' && onKeepPrevious ? (
        <button type="button" onClick={() => void keepPrevious()}>
          {copy.offlineKeep}
        </button>
      ) : null}
    </div>
  )
}
