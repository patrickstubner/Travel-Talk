import Dexie, { type Table } from 'dexie'
import { emptyCard, toStored } from '../srs/scheduler'
import { storedCardSchema } from './import'
import { coerceSettings, defaultSettings, type ProgressRepository, type ProgressSnapshot, type Settings, type StoredCard } from './types'

type SettingsRow = Settings & { id: string }

class TravelDB extends Dexie {
  settings!: Table<SettingsRow, string>
  cards!: Table<StoredCard, string>

  constructor(name: string) {
    super(name)
    this.version(1).stores({
      settings: 'id',
      cards: 'cardId',
    })
  }
}

export class DexieProgressRepository implements ProgressRepository {
  private readonly db: TravelDB

  constructor(name = 'travel-talk') {
    this.db = new TravelDB(name)
  }

  async load(): Promise<ProgressSnapshot> {
    const row = await this.db.settings.get('app')
    const rows = (await this.db.cards.toArray()) as unknown[]
    const cards: StoredCard[] = []
    for (const raw of rows) {
      try {
        cards.push(storedCardSchema.parse(raw))
      } catch {
        const fresh = repairedCard(raw)
        if (!fresh) continue
        await this.db.cards.put(fresh)
        cards.push(fresh)
      }
    }
    if (!row) return { settings: { ...defaultSettings }, cards }
    const { id: _id, ...settings } = row
    return { settings: coerceSettings(settings), cards }
  }

  async saveSettings(settings: Settings): Promise<void> {
    await this.db.settings.put({ id: 'app', ...settings })
  }

  async saveCard(card: StoredCard): Promise<void> {
    await this.db.cards.put(card)
  }

  async replaceAll(snapshot: ProgressSnapshot): Promise<void> {
    await this.db.transaction('rw', this.db.settings, this.db.cards, async () => {
      await this.db.settings.clear()
      await this.db.cards.clear()
      await this.db.settings.put({ id: 'app', ...snapshot.settings })
      if (snapshot.cards.length > 0) await this.db.cards.bulkPut(snapshot.cards)
    })
  }
}

const CARD_ID = /^[a-z0-9-]+:[a-z0-9.-]+$/

function repairedCard(raw: unknown): StoredCard | null {
  if (raw == null || typeof raw !== 'object') return null
  const cardId = (raw as { cardId?: unknown }).cardId
  if (typeof cardId !== 'string' || cardId.length > 80 || !CARD_ID.test(cardId)) return null
  return toStored(cardId, emptyCard(new Date()))
}
