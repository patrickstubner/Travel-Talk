import { useMemo, useState } from 'react'
import { DE_ADDRESS, PT_ADDRESS, PT_SPEAKER, VI_ADDRESS } from '../../content/address'
import { voicesKeptByOthers } from '../audio/voices'
import { LanguageChoice } from '../components/LanguageChoice'
import { interfaceLang } from '../app/labels'
import { useApp } from '../app/state'
import { useCopy, useSettings } from '../app/use-copy'
import { publicUrl } from '../public-url'
import { IMPORT_FUTURE, IMPORT_LIMIT, IMPORT_NEWER, emptySnapshot, importKeepsLocalNote, parseImport, previewImport, retainLocalNote, toExport, type ImportPreview } from '../storage/import'
import { cleanPersonName, cleanPersonalNote, usesLang, type ImportedPerson, type ProgressSnapshot, type Settings } from '../storage/types'

function cleanNote(value: string): string {
  return cleanPersonalNote(value)
}

type PendingImport = {
  snapshot: ProgressSnapshot
  skipped: number
  preview: ImportPreview
  uiNotRelabeled: boolean
  scope: 'person' | 'all'
  people: ImportedPerson[]
}

export function SettingsPage() {
  const { catalog, snapshot, saveSettings, replaceAll, importPerson, importAll, everyone } = useApp()
  const settings = useSettings()
  const copy = useCopy()
  const ui = interfaceLang(settings)
  const conceptIds = useMemo(() => new Set(catalog?.concepts.map((concept) => concept.id) ?? []), [catalog])
  const [importState, setImportState] = useState<'ok' | 'bad' | 'newer' | 'future' | 'reset' | null>(null)
  const [keptDirection, setKeptDirection] = useState(false)
  const [skipped, setSkipped] = useState(0)
  const [pending, setPending] = useState<PendingImport | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [includeNote, setIncludeNote] = useState(false)
  const [addName, setAddName] = useState('')
  const [persistState, setPersistState] = useState<'ok' | 'no' | null>(null)
  if (!snapshot) return null
  const current = snapshot
  const activeName = cleanPersonName(current.people?.find((person) => person.id === current.activePersonId)?.name ?? '')
  const canExport = activeName != null && settings.appLang != null && settings.targetLang != null
  const canExportAll = canExport && (current.people ?? []).every((person) => cleanPersonName(person.name) && person.settings.appLang && person.settings.targetLang)

  function update(patch: Partial<Settings>): void {
    void saveSettings({ ...settings, ...patch })
  }

  async function downloadSnapshot(include: boolean, name: string, scope: 'person' | 'all'): Promise<void> {
    const pack = scope === 'all' ? { scope, people: await everyone() } : undefined
    const blob = new Blob([toExport(current, new Date(), include, pack)], { type: 'application/json' })
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
      if (!catalog) return
      const text = await file.text()
      const outcome = parseImport(text, conceptIds)
      setPending({
        snapshot: outcome.snapshot,
        skipped: outcome.skipped,
        preview: previewImport(outcome.snapshot),
        uiNotRelabeled: outcome.uiNotRelabeled,
        scope: outcome.scope,
        people: outcome.people,
      })
    } catch (error) {
      if (error instanceof Error && error.message === IMPORT_NEWER) setImportState('newer')
      else if (error instanceof Error && error.message === IMPORT_FUTURE) setImportState('future')
      else setImportState('bad')
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
    <section className="stack" data-testid="settings">
      <LanguageChoice
        settings={settings}
        copy={copy}
        ui={ui}
        mode="settings"
        retainIds={settings.targetLang ? voicesKeptByOthers(current.people ?? [], current.activePersonId, settings.targetLang) : []}
        onChange={(patch) => update(patch)}
      />
      <label className="choice">
        <input
          type="checkbox"
          checked={settings.highlightWords !== false}
          onChange={(event) => {
            const next = { ...settings }
            if (event.target.checked) delete next.highlightWords
            else next.highlightWords = false
            void saveSettings(next)
          }}
        />
        {copy.highlightTitle}
      </label>
      <p className="hint">{copy.highlightHint}</p>
      {usesLang(settings, 'vi') ? (
        <fieldset>
          <legend>{copy.addressTitle}</legend>
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
      {usesLang(settings, 'pt-BR') ? (
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
      {usesLang(settings, 'de') ? (
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
        <button type="button" disabled={!canExport} onClick={() => void downloadSnapshot(includeNote, 'travel-talk.json', 'person')}>
          {copy.exportLabel}
        </button>
        <button type="button" disabled={!canExportAll} onClick={() => void downloadSnapshot(includeNote, 'travel-talk-alle.json', 'all')}>
          {copy.exportAll}
        </button>
        <label className="button">
          {copy.importLabel}
          <input
            className="file"
            type="file"
            accept="application/json,.json"
            disabled={!catalog}
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
          <p>{importKeepsLocalNote(pending.snapshot.settings.personalNote) ? copy.importNoteKept : copy.importNoteReplaced}</p>
          <p className="hint">{copy.importBackup}</p>
          {pending.scope === 'all' ? <p>{copy.importAllAsk}</p> : null}
          {pending.scope === 'all' ? <p>{copy.importPeople(pending.people.length)}</p> : null}
          {pending.scope === 'person' && !cleanPersonName(pending.people[0]?.name) ? (
            <label>
              {copy.importAddName}
              <input value={addName} maxLength={40} onChange={(event) => setAddName(event.target.value)} />
            </label>
          ) : null}
          {pending.skipped > 0 ? <p>{copy.importSkipped(pending.skipped)}</p> : null}
          <div className="row">
            <button type="button" disabled={!canExport} onClick={() => void downloadSnapshot(includeNote, 'travel-talk-sicherung.json', 'person')}>
              {copy.backupDownload}
            </button>
            {pending.scope === 'all' ? (
              <button
                type="button"
                className="button"
                onClick={() => {
                  const people = pending.people
                  const leftOut = pending.skipped
                  setPending(null)
                  void importAll(people).then(() => {
                    setSkipped(leftOut)
                    setImportState('ok')
                  })
                }}
              >
                {copy.importReplaceAll}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    const person = pending.people[0]
                    if (!person) return
                    const leftOut = pending.skipped
                    const relabeled = pending.uiNotRelabeled
                    setPending(null)
                    void importPerson('replace', {
                      ...person,
                      name: person.name || activeName || '',
                      settings: {
                        ...person.settings,
                        personalNote: retainLocalNote(current.settings.personalNote, person.settings.personalNote),
                      },
                    }).then(() => {
                      setSkipped(leftOut)
                      setKeptDirection(relabeled)
                      setImportState('ok')
                    })
                  }}
                >
                  {copy.importReplace}
                </button>
                <button
                  type="button"
                  disabled={(current.people?.length ?? 0) >= 10 || !cleanPersonName(pending.people[0]?.name || addName)}
                  onClick={() => {
                    const person = pending.people[0]
                    const name = cleanPersonName(person?.name || addName)
                    if (!person || !name) return
                    const leftOut = pending.skipped
                    setPending(null)
                    void importPerson('add', { ...person, name }).then((result) => {
                      if (result === 'ok') {
                        setSkipped(leftOut)
                        setImportState('ok')
                      } else setImportState('bad')
                    })
                  }}
                >
                  {copy.importAdd}
                </button>
              </>
            )}
            <button type="button" onClick={() => setPending(null)}>
              {copy.cancel}
            </button>
          </div>
        </div>
      ) : null}
      {importState === 'ok' ? <p role="status">{copy.importOk}</p> : null}
      {importState === 'ok' && keptDirection ? <p role="status">{copy.directionKept}</p> : null}
      {skipped > 0 && importState === 'ok' ? <p role="status">{copy.importSkipped(skipped)}</p> : null}
      {importState === 'newer' ? <p role="alert">{copy.importNewer}</p> : null}
      {importState === 'future' ? <p role="alert">{copy.importFuture}</p> : null}
      {importState === 'bad' ? <p role="alert">{copy.importBad}</p> : null}
      <button type="button" onClick={() => setConfirmReset(true)}>
        {copy.resetPerson}
      </button>
      {confirmReset ? (
        <div className="card dialog" role="dialog" aria-modal="true" aria-labelledby="reset-title">
          <h2 id="reset-title">{copy.confirmReset}</h2>
          <p>{copy.resetPersonAsk}</p>
          <p className="hint">{copy.importBackup}</p>
          <div className="row">
            <button type="button" disabled={!canExport} onClick={() => void downloadSnapshot(includeNote, 'travel-talk-sicherung.json', 'person')}>
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
        <p>{copy.voicesChanged}</p>
        <p>
          <a href="https://creativecommons.org/licenses/by/4.0/" rel="noreferrer noopener">
            {copy.voicesCc}
          </a>
          {' · '}
          <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" rel="noreferrer noopener">
            {copy.voicesNc}
          </a>
        </p>
        <p>{copy.voicesSlow}</p>
        <p>
          <a href={publicUrl('audio/NOTICE.txt')}>{copy.voicesNotice}</a>
        </p>
      </section>
      <p className="hint">{copy.privacy}</p>
    </section>
  )
}
