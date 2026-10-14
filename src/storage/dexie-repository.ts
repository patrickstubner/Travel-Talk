import Dexie, { type Table } from 'dexie'
import { isSpeedStep } from '../audio/speed'
import { capDueIso, emptyCard, toStored } from '../srs/scheduler'
import { storedCardSchema } from './import'
import {
  LEVEL_PLACEHOLDER,
  PERSON_LIMIT,
  cleanPersonName,
  coerceSettings,
  defaultSettings,
  type ImportedPerson,
  type PersonRecord,
  type ProgressRepository,
  type ProgressSnapshot,
  type Settings,
  type StoredCard,
} from './types'

type PersonRow = PersonRecord

type DeviceRow = { id: 'device'; activePersonId: string }

type CardRow = StoredCard & { personId: string }

type LegacySettingsRow = Settings & { id: string; slow?: boolean; pairId?: string | null; uiLang?: string }

class TravelDB extends Dexie {
  people!: Table<PersonRow, string>
  device!: Table<DeviceRow, string>
  personCards!: Table<CardRow, [string, string]>

  constructor(name: string) {
    super(name)
    this.version(1).stores({
      settings: 'id',
      cards: 'cardId',
    })
    this.version(2)
      .stores({
        settings: 'id',
        cards: 'cardId',
        people: 'id',
        device: 'id',
        cardHold: 'cardId',
      })
      .upgrade(async (tx) => {
        const row = (await tx.table('settings').get('app')) as LegacySettingsRow | undefined
        const cards = (await tx.table('cards').toArray()) as StoredCard[]
        const id = crypto.randomUUID()
        const { id: _id, ...rest } = row ?? { id: 'app' }
        await tx.table('people').add({
          id,
          name: '',
          level: LEVEL_PLACEHOLDER,
          settings: coerceSettings(rest),
        })
        await tx.table('device').add({ id: 'device', activePersonId: id })
        if (cards.length > 0) await tx.table('cardHold').bulkAdd(cards)
      })
    this.version(3)
      .stores({
        settings: null,
        cards: null,
        cardHold: null,
        people: 'id',
        device: 'id',
        personCards: '[personId+cardId], personId',
      })
      .upgrade(async (tx) => {
        const device = (await tx.table('device').get('device')) as DeviceRow | undefined
        const personId = device?.activePersonId
        if (!personId) return
        const held = (await tx.table('cardHold').toArray()) as StoredCard[]
        if (held.length === 0) return
        await tx.table('personCards').bulkAdd(held.map((card) => ({ ...card, personId })))
      })
  }
}

export class DexieProgressRepository implements ProgressRepository {
  private readonly db: TravelDB

  constructor(name = 'travel-talk') {
    this.db = new TravelDB(name)
  }

  async load(): Promise<ProgressSnapshot> {
    await this.ensurePerson()
    const device = await this.activeDevice()
    const people = await this.db.people.toArray()
    const active = people.find((person) => person.id === device.activePersonId) ?? people[0]
    if (!active) return { settings: { ...defaultSettings }, cards: [], people: [], activePersonId: '' }
    const rows = await this.db.personCards.where('personId').equals(active.id).toArray()
    const cards: StoredCard[] = []
    let repaired = 0
    const now = Date.now()
    for (const raw of rows) {
      const { personId: _personId, ...card } = raw
      try {
        const parsed = storedCardSchema.parse(card)
        const due = capDueIso(parsed.due, parsed.last_review, now)
        if (due === parsed.due) {
          cards.push(parsed)
          continue
        }
        const fixed = { ...parsed, due }
        await this.db.personCards.put({ ...fixed, personId: active.id })
        cards.push(fixed)
      } catch {
        const fresh = repairedCard(card)
        if (!fresh) continue
        await this.db.personCards.put({ ...fresh, personId: active.id })
        cards.push(fresh)
        repaired += 1
      }
    }
    const settings = coerceSettings(active.settings)
    return {
      settings,
      cards,
      people: people.map((person) => ({ ...person, settings: coerceSettings(person.settings), level: LEVEL_PLACEHOLDER })),
      activePersonId: active.id,
      repaired,
    }
  }

  async saveSettings(personId: string, settings: Settings): Promise<void> {
    await this.db.transaction('rw', this.db.people, async () => {
      if (!(await this.db.people.get(personId))) return
      await this.db.people.update(personId, { settings })
    })
  }

  async saveCard(personId: string, card: StoredCard): Promise<void> {
    await this.db.transaction('rw', this.db.people, this.db.personCards, async () => {
      if (!(await this.db.people.get(personId))) return
      await this.db.personCards.put({ ...card, personId })
    })
  }

  async replaceAll(personId: string, snapshot: ProgressSnapshot): Promise<void> {
    await this.writePerson(personId, snapshot.settings, snapshot.cards)
  }

  async addPerson(name: string): Promise<boolean> {
    const clean = cleanPersonName(name)
    if (!clean) return false
    return this.db.transaction('rw', this.db.people, this.db.device, async () => {
      const count = await this.db.people.count()
      if (count >= PERSON_LIMIT) return false
      const id = crypto.randomUUID()
      await this.db.people.add({ id, name: clean, level: LEVEL_PLACEHOLDER, settings: { ...defaultSettings } })
      await this.db.device.put({ id: 'device', activePersonId: id })
      return true
    })
  }

  async renamePerson(id: string, name: string): Promise<boolean> {
    const clean = cleanPersonName(name)
    if (!clean) return false
    const found = await this.db.people.get(id)
    if (!found) return false
    await this.db.people.update(id, { name: clean })
    return true
  }

  async deletePerson(id: string): Promise<void> {
    await this.db.transaction('rw', this.db.people, this.db.device, this.db.personCards, async () => {
      await this.db.personCards.where('personId').equals(id).delete()
      await this.db.people.delete(id)
      const rest = await this.db.people.toArray()
      const device = await this.db.device.get('device')
      if (rest.length === 0) {
        const fresh = crypto.randomUUID()
        await this.db.people.add({ id: fresh, name: '', level: LEVEL_PLACEHOLDER, settings: { ...defaultSettings } })
        await this.db.device.put({ id: 'device', activePersonId: fresh })
        return
      }
      if (!device || device.activePersonId === id || !rest.some((person) => person.id === device.activePersonId)) {
        const next = rest[0]
        if (next) await this.db.device.put({ id: 'device', activePersonId: next.id })
      }
    })
  }

  async switchPerson(id: string): Promise<void> {
    const found = await this.db.people.get(id)
    if (!found) return
    await this.db.device.put({ id: 'device', activePersonId: id })
  }

  async importPerson(mode: 'replace' | 'add', person: ImportedPerson, keepLocal?: Settings, personId?: string): Promise<'ok' | 'full'> {
    const settings = mergeLocal(person.settings, keepLocal)
    if (mode === 'add') {
      const clean = cleanPersonName(person.name)
      if (!clean) return 'full'
      return this.db.transaction('rw', this.db.people, this.db.device, this.db.personCards, async () => {
        const count = await this.db.people.count()
        if (count >= PERSON_LIMIT) return 'full' as const
        const id = crypto.randomUUID()
        await this.db.people.add({ id, name: clean, level: LEVEL_PLACEHOLDER, settings })
        if (person.cards.length > 0) {
          await this.db.personCards.bulkPut(person.cards.map((card) => ({ ...card, personId: id })))
        }
        await this.db.device.put({ id: 'device', activePersonId: id })
        return 'ok' as const
      })
    }
    const id = personId ?? (await this.activeDevice()).activePersonId
    await this.writePerson(id, settings, person.cards)
    return 'ok'
  }

  async everyone(): Promise<ImportedPerson[]> {
    const people = await this.db.people.toArray()
    const cards = await this.db.personCards.toArray()
    return people.map((person) => ({
      name: person.name,
      settings: coerceSettings(person.settings),
      cards: cards
        .filter((card) => card.personId === person.id)
        .map(({ personId: _personId, ...card }) => card),
    }))
  }

  async importAll(people: readonly ImportedPerson[]): Promise<void> {
    const chosen = acceptedPeople(people)
    await this.db.transaction('rw', this.db.people, this.db.device, this.db.personCards, async () => {
      await this.db.personCards.clear()
      await this.db.people.clear()
      let first = ''
      for (const person of chosen) {
        const id = crypto.randomUUID()
        if (!first) first = id
        await this.db.people.add({ id, name: person.name, level: LEVEL_PLACEHOLDER, settings: person.settings })
        if (person.cards.length > 0) {
          await this.db.personCards.bulkPut(person.cards.map((card) => ({ ...card, personId: id })))
        }
      }
      if (!first) {
        first = crypto.randomUUID()
        await this.db.people.add({ id: first, name: '', level: LEVEL_PLACEHOLDER, settings: { ...defaultSettings } })
      }
      await this.db.device.put({ id: 'device', activePersonId: first })
    })
  }

  private async ensurePerson(): Promise<void> {
    const count = await this.db.people.count()
    if (count > 0) return
    const id = crypto.randomUUID()
    await this.db.people.add({ id, name: '', level: LEVEL_PLACEHOLDER, settings: { ...defaultSettings } })
    await this.db.device.put({ id: 'device', activePersonId: id })
  }

  private async activeDevice(): Promise<DeviceRow> {
    await this.ensurePerson()
    const device = await this.db.device.get('device')
    if (device && (await this.db.people.get(device.activePersonId))) return device
    const first = await this.db.people.toCollection().first()
    const next: DeviceRow = { id: 'device', activePersonId: first?.id ?? '' }
    await this.db.device.put(next)
    return next
  }

  private async writePerson(personId: string, settings: Settings, cards: readonly StoredCard[]): Promise<void> {
    await this.db.transaction('rw', this.db.people, this.db.personCards, async () => {
      if (!(await this.db.people.get(personId))) return
      await this.db.people.update(personId, { settings })
      await this.db.personCards.where('personId').equals(personId).delete()
      if (cards.length > 0) await this.db.personCards.bulkPut(cards.map((card) => ({ ...card, personId })))
    })
  }
}

function acceptedPeople(people: readonly ImportedPerson[]): ImportedPerson[] {
  return people.slice(0, PERSON_LIMIT).map((person) => {
    const name = cleanPersonName(person.name)
    if (!name) throw new Error('IMPORT_REJECTED')
    return { ...person, name }
  })
}

function mergeLocal(incoming: Settings, local: Settings | undefined): Settings {
  if (!local) return incoming
  return {
    ...incoming,
    personalNote: incoming.personalNote.trim().length === 0 ? local.personalNote : incoming.personalNote,
    voices: incoming.voices ?? local.voices,
    ...(local.voiceHintSeen ? { voiceHintSeen: true } : {}),
    ...(local.highlightWords === false ? { highlightWords: false } : {}),
    ...(isSpeedStep(local.learnTempo) ? { learnTempo: local.learnTempo } : {}),
    ...(local.skipWords === true ? { skipWords: true } : {}),
    ...(incoming.wordSpeed == null && isSpeedStep(local.wordSpeed) ? { wordSpeed: local.wordSpeed } : {}),
  }
}

const CARD_ID = /^[a-z0-9-]+:[a-z0-9.-]+$/

function repairedCard(raw: unknown): StoredCard | null {
  if (raw == null || typeof raw !== 'object') return null
  const cardId = (raw as { cardId?: unknown }).cardId
  if (typeof cardId !== 'string' || cardId.length > 80 || !CARD_ID.test(cardId)) return null
  return toStored(cardId, emptyCard(new Date()))
}
