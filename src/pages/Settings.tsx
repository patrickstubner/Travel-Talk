import { useMemo, useState } from 'react'
import { DE_ADDRESS, PT_ADDRESS, PT_SPEAKER, VI_ADDRESS } from '../../content/address'
import { pairById, pairUses } from '../domain/pairs'
import { interfaceLang } from '../app/labels'
import { useApp } from '../app/state'
import { useCopy, useSettings } from '../app/use-copy'
import { publicUrl } from '../public-url'
import { IMPORT_LIMIT, emptySnapshot, parseImport, previewImport, toExport, type ImportPreview } from '../storage/import'
import type { ProgressSnapshot, Settings } from '../storage/types'

function cleanNote(value: string): string {
  return value.replace(/[^\P{C}\n\t]/gu, '').slice(0, 500)
}

type PendingImport = {
  snapshot: ProgressSnapshot
  skipped: number
  preview: ImportPreview
}

export function SettingsPage() {
  const { catalog, snapshot, saveSettings, replaceAll } = useApp()
  const settings = useSettings()
  const copy = useCopy()
  const ui = interfaceLang(settings)
  const pair = pairById(settings.pairId)
  const conceptIds = useMemo(() => new Set(catalog?.concepts.map((concept) => concept.id) ?? []), [catalog])
  const [importState, setImportState] = useState<'ok' | 'bad' | 'reset' | null>(null)
  const [skipped, setSkipped] = useState(0)
  const [pending, setPending] = useState<PendingImport | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [includeNote, setIncludeNote] = useState(false)
  const [persistState, setPersistState] = useState<'ok' | 'no' | null>(null)
  if (!snapshot) return null
  const current = snapshot

  function update(patch: Partial<Settings>): void {
    void saveSettings({ ...settings, ...patch })
  }

  function downloadSnapshot(include: boolean, name: string): void {
    const blob = new Blob([toExport(current, new Date(), include)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = name
    link.click()
    URL.revokeObjectURL(url)
  }

  async function onImport(file: File | undefined): Promise<void> {
    setImportState(null)
    setPending(null)
    setSkipped(0)
    if (!file || file.size > IMPORT_LIMIT) {
      setImportState('bad')
      return
    }
    try {
      const text = await file.text()
      const outcome = parseImport(text, conceptIds)
      downloadSnapshot(true, 'travel-talk-sicherung.json')
      setPending({ snapshot: outcome.snapshot, skipped: outcome.skipped, preview: previewImport(outcome.snapshot) })
    } catch {
      setImportState('bad')
    }
  }

  async function persist(): Promise<void> {
    if (!navigator.storage?.persist) {
      setPersistState('no')
      return
    }
    const granted = await navigator.storage.persist()
    setPersistState(granted ? 'ok' : 'no')
  }

  return (
    <section className="stack">
      <h1>{copy.settingsTitle}</h1>
      <fieldset>
        <legend>{copy.uiLanguage}</legend>
        <label className="choice">
          <input type="radio" name="ui" checked={settings.uiLang === 'de'} onChange={() => update({ uiLang: 'de' })} />
          {copy.uiGerman}
        </label>
        <label className="choice">
          <input type="radio" name="ui" checked={settings.uiLang === 'source'} onChange={() => update({ uiLang: 'source' })} />
          {copy.uiSource}
        </label>
      </fieldset>
      {pairUses(settings.pairId, 'vi') ? (
        <fieldset>
          <legend>{copy.viRegion}</legend>
          <label className="choice">
            <input type="radio" name="region" checked={settings.viRegion === 'south'} onChange={() => update({ viRegion: 'south' })} />
            {copy.regionSouth}
          </label>
          <label className="choice">
            <input type="radio" name="region" checked={settings.viRegion === 'north'} onChange={() => update({ viRegion: 'north' })} />
            {copy.regionNorth}
          </label>
          <label>
            {copy.addressTitle}
            <select value={settings.addressVi} onChange={(event) => update({ addressVi: event.target.value })}>
              {VI_ADDRESS.map((form) => (
                <option key={form.id} value={form.id}>
                  {form.label}
                </option>
              ))}
            </select>
          </label>
          <p className="hint">{VI_ADDRESS.find((form) => form.id === settings.addressVi)?.note[ui]}</p>
          <label>
            Zalo
            <select value={settings.viContact} onChange={(event) => update({ viContact: event.target.value as Settings['viContact'] })}>
              <option value="phone">số điện thoại</option>
              <option value="zalo">Zalo</option>
            </select>
          </label>
        </fieldset>
      ) : null}
      {pairUses(settings.pairId, 'pt-BR') ? (
        <fieldset>
          <legend>{copy.addressTitle}</legend>
          <label>
            você
            <select value={settings.addressPt} onChange={(event) => update({ addressPt: event.target.value })}>
              {PT_ADDRESS.map((form) => (
                <option key={form.id} value={form.id}>
                  {form.label}
                </option>
              ))}
            </select>
          </label>
          <p className="hint">{PT_ADDRESS.find((form) => form.id === settings.addressPt)?.note[ui]}</p>
          <label>
            obrigado
            <select value={settings.ptSpeaker} onChange={(event) => update({ ptSpeaker: event.target.value as Settings['ptSpeaker'] })}>
              {PT_SPEAKER.map((form) => (
                <option key={form.id} value={form.id}>
                  {form.label}
                </option>
              ))}
            </select>
          </label>
        </fieldset>
      ) : null}
      {pairUses(settings.pairId, 'de') ? (
        <fieldset>
          <legend>{copy.addressTitle}</legend>
          <label>
            Sie
            <select value={settings.addressDe} onChange={(event) => update({ addressDe: event.target.value })}>
              {DE_ADDRESS.map((form) => (
                <option key={form.id} value={form.id}>
                  {form.label}
                </option>
              ))}
            </select>
          </label>
          <p className="hint">{DE_ADDRESS.find((form) => form.id === settings.addressDe)?.note[ui]}</p>
        </fieldset>
      ) : null}
      <label>
        {copy.retention}
        <select value={String(settings.retention)} onChange={(event) => update({ retention: Number(event.target.value) })}>
          <option value="0.85">0.85</option>
          <option value="0.9">0.9</option>
          <option value="0.95">0.95</option>
        </select>
      </label>
      <label className="choice">
        <input type="checkbox" checked={settings.slow} onChange={(event) => update({ slow: event.target.checked })} />
        {copy.slowToggle}
      </label>
      <label>
        {copy.personalNote}
        <textarea value={settings.personalNote} maxLength={500} onChange={(event) => update({ personalNote: cleanNote(event.target.value) })} />
      </label>
      <p className="hint">{copy.personalNoteHelp}</p>
      <label className="choice">
        <input type="checkbox" checked={includeNote} onChange={(event) => setIncludeNote(event.target.checked)} />
        {copy.exportNote}
      </label>
      <p className="hint">{copy.exportNoteHint}</p>
      <div className="row">
        <button type="button" onClick={() => downloadSnapshot(includeNote, 'travel-talk.json')}>
          {copy.exportLabel}
        </button>
        <label className="button">
          {copy.importLabel}
          <input
            className="file"
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              void onImport(file)
            }}
          />
        </label>
      </div>
      {pending ? (
        <div className="card dialog" role="dialog" aria-modal="true" aria-labelledby="import-title">
          <h2 id="import-title">{copy.confirmImport}</h2>
          <p>{copy.importSummary(pending.preview.cards, pending.preview.earliest, pending.preview.latest, pending.preview.hasNote)}</p>
          <p className="hint">{copy.importBackup}</p>
          {pending.skipped > 0 ? <p>{copy.importSkipped(pending.skipped)}</p> : null}
          <div className="row">
            <button type="button" onClick={() => downloadSnapshot(true, 'travel-talk-sicherung.json')}>
              {copy.backupDownload}
            </button>
            <button
              type="button"
              className="button"
              onClick={() => {
                const next = pending.snapshot
                const leftOut = pending.skipped
                setPending(null)
                void replaceAll(next).then(() => {
                  setSkipped(leftOut)
                  setImportState('ok')
                })
              }}
            >
              {copy.confirmImport}
            </button>
            <button type="button" onClick={() => setPending(null)}>
              {copy.cancel}
            </button>
          </div>
        </div>
      ) : null}
      {importState === 'ok' ? <p role="status">{copy.importOk}</p> : null}
      {skipped > 0 && importState === 'ok' ? <p role="status">{copy.importSkipped(skipped)}</p> : null}
      {importState === 'bad' ? <p role="alert">{copy.importBad}</p> : null}
      <button type="button" onClick={() => setConfirmReset(true)}>
        {copy.reset}
      </button>
      {confirmReset ? (
        <div className="card dialog" role="dialog" aria-modal="true" aria-labelledby="reset-title">
          <h2 id="reset-title">{copy.confirmReset}</h2>
          <p>{copy.resetAsk}</p>
          <p className="hint">{copy.importBackup}</p>
          <div className="row">
            <button type="button" onClick={() => downloadSnapshot(true, 'travel-talk-sicherung.json')}>
              {copy.backupDownload}
            </button>
            <button
              type="button"
              className="button clay"
              onClick={() => {
                setConfirmReset(false)
                void replaceAll(emptySnapshot()).then(() => setImportState('reset'))
              }}
            >
              {copy.confirmReset}
            </button>
            <button type="button" onClick={() => setConfirmReset(false)}>
              {copy.cancel}
            </button>
          </div>
        </div>
      ) : null}
      {importState === 'reset' ? <p role="status">{copy.resetOk}</p> : null}
      <button type="button" onClick={() => void persist()}>
        {copy.persist}
      </button>
      {persistState === 'ok' ? <p>{copy.persistOk}</p> : null}
      {persistState === 'no' ? <p>{copy.persistNo}</p> : null}
      <section className="card stack" aria-labelledby="voices-title">
        <h2 id="voices-title">{copy.voicesTitle}</h2>
        <p>{copy.voicesVi}</p>
        <p>
          <a href="https://creativecommons.org/licenses/by/4.0/" rel="noreferrer noopener">
            {copy.voicesCc}
          </a>
        </p>
        <p>{copy.voicesSlow}</p>
        <p>
          <a href={publicUrl('audio/NOTICE.txt')}>{copy.voicesNotice}</a>
        </p>
      </section>
      <p className="hint">{copy.privacy}</p>
      {pair ? null : <p>{copy.needPair}</p>}
    </section>
  )
}
