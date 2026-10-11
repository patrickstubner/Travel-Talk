import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Catalog } from '../domain/schema'
import { tryLoadCatalog } from '../content/load'
import { DexieProgressRepository } from '../storage/dexie-repository'
import type { ProgressRepository, ProgressSnapshot, Settings, StoredCard } from '../storage/types'

type AppValue = {
  catalog: Catalog | null
  catalogOk: boolean
  snapshot: ProgressSnapshot | null
  storageError: boolean
  saveSettings: (settings: Settings) => Promise<void>
  saveCard: (card: StoredCard) => Promise<void>
  replaceAll: (snapshot: ProgressSnapshot) => Promise<void>
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
      setSnapshot((prev) => (prev ? { ...prev, settings, repaired: prev.repaired } : prev))
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
      setSnapshot(next)
      await repository.replaceAll(next)
    },
    [repository],
  )

  const value = useMemo<AppValue>(
    () => ({
      catalog: catalogResult.ok ? catalogResult.catalog : null,
      catalogOk: catalogResult.ok,
      snapshot,
      storageError,
      saveSettings,
      saveCard,
      replaceAll,
    }),
    [catalogResult, snapshot, storageError, saveSettings, saveCard, replaceAll],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppValue {
  const value = useContext(AppContext)
  if (!value) throw new Error('APP_CONTEXT')
  return value
}
