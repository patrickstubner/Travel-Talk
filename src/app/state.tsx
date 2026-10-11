import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Catalog } from '../domain/schema'
import { tryLoadCatalog } from '../content/load'
import { DexieProgressRepository } from '../storage/dexie-repository'
import type { ImportedPerson, ProgressRepository, ProgressSnapshot, Settings, StoredCard } from '../storage/types'

type AppValue = {
  catalog: Catalog | null
  catalogOk: boolean
  snapshot: ProgressSnapshot | null
  storageError: boolean
  saveSettings: (settings: Settings) => Promise<void>
  saveCard: (card: StoredCard) => Promise<void>
  replaceAll: (snapshot: ProgressSnapshot) => Promise<void>
  addPerson: (name: string) => Promise<boolean>
  renamePerson: (id: string, name: string) => Promise<boolean>
  deletePerson: (id: string) => Promise<void>
  switchPerson: (id: string) => Promise<void>
  importPerson: (mode: 'replace' | 'add', person: ImportedPerson) => Promise<'ok' | 'full'>
  importAll: (people: readonly ImportedPerson[]) => Promise<void>
  everyone: () => Promise<ImportedPerson[]>
}

export const AppContext = createContext<AppValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const catalogResult = useMemo(() => tryLoadCatalog(), [])
  const repository = useMemo<ProgressRepository>(() => new DexieProgressRepository(), [])
  const [snapshot, setSnapshot] = useState<ProgressSnapshot | null>(null)
  const [storageError, setStorageError] = useState(false)

  useEffect(() => {
    let active = true
    repository
      .load()
      .then((loaded) => {
        if (active) setSnapshot(loaded)
      })
      .catch(() => {
        if (active) setStorageError(true)
      })
    return () => {
      active = false
    }
  }, [repository])

  const saveSettings = useCallback(
    async (settings: Settings) => {
      setSnapshot((prev) => {
        if (!prev) return prev
        const people = (prev.people ?? []).map((person) => (person.id === prev.activePersonId ? { ...person, settings } : person))
        return { ...prev, settings, people, repaired: prev.repaired }
      })
      await repository.saveSettings(settings)
    },
    [repository],
  )

  const saveCard = useCallback(
    async (card: StoredCard) => {
      setSnapshot((prev) => {
        if (!prev) return prev
        const cards = prev.cards.filter((item) => item.cardId !== card.cardId)
        return { ...prev, cards: [...cards, card], repaired: prev.repaired }
      })
      await repository.saveCard(card)
    },
    [repository],
  )

  const replaceAll = useCallback(
    async (next: ProgressSnapshot) => {
      await repository.replaceAll(next)
      setSnapshot(await repository.load())
    },
    [repository],
  )

  const reload = useCallback(async () => {
    setSnapshot(await repository.load())
  }, [repository])

  const addPerson = useCallback(
    async (name: string) => {
      const added = await repository.addPerson(name)
      if (added) await reload()
      return added
    },
    [reload, repository],
  )

  const renamePerson = useCallback(
    async (id: string, name: string) => {
      const renamed = await repository.renamePerson(id, name)
      if (renamed) await reload()
      return renamed
    },
    [reload, repository],
  )

  const deletePerson = useCallback(
    async (id: string) => {
      await repository.deletePerson(id)
      await reload()
    },
    [reload, repository],
  )

  const switchPerson = useCallback(
    async (id: string) => {
      await repository.switchPerson(id)
      await reload()
    },
    [reload, repository],
  )

  const importPerson = useCallback(
    async (mode: 'replace' | 'add', person: ImportedPerson) => {
      const local = mode === 'replace' ? snapshot?.settings : undefined
      const result = await repository.importPerson(mode, person, local)
      if (result === 'ok') await reload()
      return result
    },
    [reload, repository, snapshot?.settings],
  )

  const importAll = useCallback(
    async (people: readonly ImportedPerson[]) => {
      await repository.importAll(people)
      await reload()
    },
    [reload, repository],
  )

  const everyone = useCallback(() => repository.everyone(), [repository])

  const value = useMemo<AppValue>(
    () => ({
      catalog: catalogResult.ok ? catalogResult.catalog : null,
      catalogOk: catalogResult.ok,
      snapshot,
      storageError,
      saveSettings,
      saveCard,
      replaceAll,
      addPerson,
      renamePerson,
      deletePerson,
      switchPerson,
      importPerson,
      importAll,
      everyone,
    }),
    [catalogResult, snapshot, storageError, saveSettings, saveCard, replaceAll, addPerson, renamePerson, deletePerson, switchPerson, importPerson, importAll, everyone],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppValue {
  const value = useContext(AppContext)
  if (!value) throw new Error('APP_CONTEXT')
  return value
}
