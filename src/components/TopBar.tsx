import { useEffect, useId, useRef, useState } from 'react'
import type { Lang } from '../../content/phrase'
import { LANG_LABEL, interfaceLang } from '../app/labels'
import { useApp } from '../app/state'
import { useCopy, useSettings } from '../app/use-copy'
import { APP_LANGS } from '../domain/direction'
import { PERSON_LIMIT, cleanPersonName, type Settings } from '../storage/types'

export function withTarget(settings: Settings, lang: Lang): Settings {
  let appLang = settings.appLang
  let targetLang = lang
  if (lang === settings.appLang && settings.targetLang) {
    appLang = settings.targetLang
    targetLang = lang
  }
  const more = new Set(settings.moreTargets ?? [])
  if (settings.targetLang && settings.targetLang !== targetLang) more.add(settings.targetLang)
  more.delete(targetLang)
  if (appLang) more.delete(appLang)
  const next: Settings = { ...settings, appLang, targetLang }
  if (more.size > 0) next.moreTargets = [...more]
  else delete next.moreTargets
  return next
}

export function TopBar({ askName = false, hidePerson = false }: { askName?: boolean; hidePerson?: boolean }) {
  const { snapshot, saveSettings, switchPerson, addPerson, renamePerson, deletePerson } = useApp()
  const settings = useSettings()
  const copy = useCopy()
  const ui = interfaceLang(settings)
  const people = snapshot?.people ?? []
  const active = people.find((person) => person.id === snapshot?.activePersonId)
  const [open, setOpen] = useState<'person' | 'lang' | null>(askName ? 'person' : null)
  const [draft, setDraft] = useState('')
  const [renameDraft, setRenameDraft] = useState(active?.name ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [nameFailure, setNameFailure] = useState<'gone' | 'full' | null>(null)
  const [nameInvalid, setNameInvalid] = useState(false)
  const [adding, setAdding] = useState(false)
  const addingRef = useRef(false)
  const renameTouched = useRef(false)
  const seenPersonId = useRef(active?.id)
  const personMenu = useId()
  const langMenu = useId()
  const personButton = useRef<HTMLButtonElement>(null)
  const langButton = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const unnamed = (active?.name ?? '') === ''
  const unnamedRef = useRef(unnamed)
  unnamedRef.current = unnamed

  useEffect(() => {
    const nextId = active?.id
    const switchedPerson = seenPersonId.current !== undefined && nextId !== seenPersonId.current
    if (switchedPerson) renameTouched.current = false
    if (switchedPerson || !renameTouched.current) setRenameDraft(active?.name ?? '')
    seenPersonId.current = nextId
  }, [active?.id, active?.name])

  useEffect(() => {
    if (askName) setOpen('person')
  }, [askName])

  useEffect(() => {
    if (!open) return
    const node = menuRef.current?.querySelector<HTMLElement>(unnamedRef.current ? 'input' : 'button, input')
    node?.focus()
    function onKey(event: KeyboardEvent): void {
      if (event.key !== 'Escape') return
      renameTouched.current = false
      setRenameDraft(active?.name ?? '')
      setNameFailure(null)
      setNameInvalid(false)
      setOpen(null)
      setConfirmDelete(false)
      const back = open === 'person' ? personButton.current : langButton.current
      back?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, active?.id, active?.name, unnamed])

  const target = settings.targetLang
  const variant = target === 'vi' ? (settings.viRegion === 'north' ? copy.regionNorth : copy.regionSouth) : ''
  const targetText = target ? LANG_LABEL[target][ui] : copy.targetLangTitle
  const personText = active?.name || copy.personNameAsk
  const showRegion = settings.appLang === 'vi' || target === 'vi'

  function close(): void {
    setOpen(null)
    setConfirmDelete(false)
    setNameFailure(null)
    setNameInvalid(false)
    renameTouched.current = false
    setRenameDraft(active?.name ?? '')
  }

  function editRename(value: string): void {
    renameTouched.current = true
    setNameInvalid(false)
    setRenameDraft(value)
  }

  async function saveName(value: string, id: string | undefined, mode: 'rename' | 'add'): Promise<void> {
    if (!cleanPersonName(value)) {
      setNameInvalid(true)
      setNameFailure(null)
      return
    }
    setNameInvalid(false)
    setNameFailure(null)
    if (mode === 'add') {
      if (addingRef.current) return
      addingRef.current = true
      setAdding(true)
      try {
        const added = await addPerson(value)
        if (!added) setNameFailure('full')
        else {
          setDraft('')
          close()
        }
      } finally {
        addingRef.current = false
        setAdding(false)
      }
      return
    }
    if (!id) return
    const ok = await renamePerson(id, value)
    if (!ok) setNameFailure('gone')
    else {
      const cleaned = cleanPersonName(value) ?? ''
      close()
      renameTouched.current = false
      setRenameDraft(cleaned)
    }
  }

  return (
    <div className="top-switch" data-testid="top-switch">
      {hidePerson ? null : (
        <button
          ref={personButton}
          type="button"
          className="top-trigger"
          aria-expanded={open === 'person'}
          aria-controls={personMenu}
          aria-label={`${copy.whoTitle}: ${personText}`}
          onClick={() => {
            if (open === 'person') close()
            else setOpen('person')
          }}
        >
          <bdi>{personText}</bdi>
        </button>
      )}
      <button
        ref={langButton}
        type="button"
        className="top-trigger"
        aria-expanded={open === 'lang'}
        aria-controls={langMenu}
        aria-label={variant ? `${copy.targetLangTitle}: ${targetText}, ${variant}` : `${copy.targetLangTitle}: ${targetText}`}
        onClick={() => setOpen((value) => (value === 'lang' ? null : 'lang'))}
      >
        {variant ? `${targetText} · ${variant}` : targetText}
      </button>
      {!hidePerson && open === 'person' ? (
        <div ref={menuRef} id={personMenu} className="top-menu" role="group" aria-label={copy.whoTitle}>
          {people.map((person) => (
            <button
              key={person.id}
              type="button"
              aria-pressed={person.id === active?.id}
              onClick={() => {
                void switchPerson(person.id)
                close()
              }}
            >
              <bdi>{person.name || copy.personNameAsk}</bdi>
            </button>
          ))}
          {active && active.name === '' ? (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                void saveName(renameDraft, active.id, 'rename')
              }}
            >
              <label>
                {copy.personNameAsk}
                <input value={renameDraft} maxLength={40} onChange={(event) => editRename(event.target.value)} />
              </label>
              <button type="submit">{copy.personSave}</button>
            </form>
          ) : active ? (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                void saveName(renameDraft, active.id, 'rename')
              }}
            >
              <label>
                {copy.personRename}
                <input value={renameDraft} maxLength={40} onChange={(event) => editRename(event.target.value)} />
              </label>
              <button type="submit">{copy.personRename}</button>
            </form>
          ) : null}
          {active?.name && people.length < PERSON_LIMIT ? (
            <form
              data-testid="add-person"
              onSubmit={(event) => {
                event.preventDefault()
                void saveName(draft, undefined, 'add')
              }}
            >
              <label>
                {copy.personAdd}
                <input value={draft} maxLength={40} onChange={(event) => setDraft(event.target.value)} />
              </label>
              <button type="submit" disabled={adding}>
                {copy.personAdd}
              </button>
            </form>
          ) : null}
          {active?.name && people.length >= PERSON_LIMIT ? <p>{copy.personLimit}</p> : null}
          {nameInvalid ? <p role="alert">{copy.personNameEmpty}</p> : null}
          {nameFailure === 'gone' ? <p role="alert">{copy.personGone}</p> : null}
          {nameFailure === 'full' ? <p role="alert">{copy.personLimit}</p> : null}
          {active?.name ? (
            confirmDelete ? (
              <div>
                <p>{copy.personDeleteAsk}</p>
                <button
                  type="button"
                  className="button clay"
                  onClick={() => {
                    const id = active.id
                    close()
                    void deletePerson(id)
                  }}
                >
                  {copy.personDelete}
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)}>
                {copy.personDelete}
              </button>
            )
          ) : null}
          <p className="hint">{copy.whoCount(people.length)}</p>
          <p className="hint person-shared">{copy.whoShared}</p>
        </div>
      ) : null}
      {open === 'lang' ? (
        <div ref={menuRef} id={langMenu} className="top-menu" role="group" aria-label={copy.targetLangTitle}>
          <div className="choice-grid" role="group" aria-label={copy.targetLangTitle}>
            {APP_LANGS.map((lang) => (
              <button
                key={lang}
                type="button"
                aria-pressed={target === lang}
                onClick={() => {
                  void saveSettings(withTarget(settings, lang))
                  close()
                }}
              >
                {LANG_LABEL[lang][ui]}
              </button>
            ))}
          </div>
          {showRegion ? (
            <div className="choice-grid" role="group" aria-label={copy.viRegion}>
              <button
                type="button"
                aria-pressed={settings.viRegion === 'south'}
                onClick={() => void saveSettings({ ...settings, viRegion: 'south' })}
              >
                {copy.regionSouth}
              </button>
              <button
                type="button"
                aria-pressed={settings.viRegion === 'north'}
                onClick={() => void saveSettings({ ...settings, viRegion: 'north' })}
              >
                {copy.regionNorth}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
