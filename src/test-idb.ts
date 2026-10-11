import Dexie from 'dexie'
import { IDBFactory } from 'fake-indexeddb'

/** A fresh database. Dexie keeps its own indexedDB handle, so replacing the global is not enough. */
export function freshIndexedDb(): void {
  const indexedDB = new IDBFactory()
  globalThis.indexedDB = indexedDB
  Dexie.dependencies.indexedDB = indexedDB
}
