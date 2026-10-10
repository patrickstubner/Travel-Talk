import { useState } from 'react'
import { DE_ADDRESS, PT_ADDRESS, PT_SPEAKER, VI_ADDRESS } from '../../content/address'
import { pairById, pairUses } from '../domain/pairs'
import { interfaceLang } from '../app/labels'
import { useApp } from '../app/state'
import { useCopy, useSettings } from '../app/use-copy'
import { IMPORT_LIMIT, emptySnapshot, parseImport, toExport } from '../storage/import'
import type { Settings } from '../storage/types'

function cleanNote(value: string): string {
  return value.replace(/[^\P{C}\n\t]/gu, '').slice(0, 500)
}

export function SettingsPage() {
  const { snapshot, saveSettings, replaceAll } = useApp()
  const settings = useSettings()
  const copy = useCopy()
  const ui = interfaceLang(settings)
  const pair = pairById(settings.pairId)
  const [importState, setImportState] = useState<'ok' | 'bad' | 'reset' | null>(null)
  const [persistState, setPersistState] = useState<'ok' | 'no' | null>(null)
  if (!snapshot) return null
  const current = snapshot

  function update(patch: Partial<Settings>): void {
    void saveSettings({ ...settings, ...patch })
  }

  function exportFile(): void {
    const blob = new Blob([toExport(current, new Date())], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'travel-talk.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function onImport(file: File | undefined): Promise<void> {
    setImportState(null)
    if (!file || file.size > IMPORT_LIMIT) {
      setImportState('bad')
      return
    }
    try {
      const text = await file.text()
      const next = parseImport(text)
      await replaceAll(next)
      setImportState('ok')
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
      <div className="row">
        <button type="button" onClick={exportFile}>
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
      {importState === 'ok' ? <p role="status">{copy.importOk}</p> : null}
      {importState === 'bad' ? <p role="alert">{copy.importBad}</p> : null}
      <button
        type="button"
        onClick={() => {
          void replaceAll(emptySnapshot()).then(() => setImportState('reset'))
        }}
      >
        {copy.reset}
      </button>
      {importState === 'reset' ? <p role="status">{copy.resetOk}</p> : null}
      <button type="button" onClick={() => void persist()}>
        {copy.persist}
      </button>
      {persistState === 'ok' ? <p>{copy.persistOk}</p> : null}
      {persistState === 'no' ? <p>{copy.persistNo}</p> : null}
      <p className="hint">{copy.privacy}</p>
      {pair ? null : <p>{copy.needPair}</p>}
    </section>
  )
}
