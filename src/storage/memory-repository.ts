import { LEVEL_PLACEHOLDER, PERSON_LIMIT, cleanPersonName, defaultSettings, type ImportedPerson, type PersonRecord, type ProgressRepository, type ProgressSnapshot, type Settings, type StoredCard } from './types'

type Held = PersonRecord & { cards: StoredCard[] }

export class MemoryProgressRepository implements ProgressRepository {
  private people: Held[] = [{ id: 'p1', name: '', level: LEVEL_PLACEHOLDER, settings: { ...defaultSettings }, cards: [] }]
  private activeId = 'p1'

  async load(): Promise<ProgressSnapshot> {
    const active = this.people.find((person) => person.id === this.activeId) ?? this.people[0]
    return {
      settings: { ...(active?.settings ?? defaultSettings) },
      cards: (active?.cards ?? []).map((card) => ({ ...card })),
      people: this.people.map(({ cards: _cards, ...person }) => ({ ...person, settings: { ...person.settings } })),
      activePersonId: active?.id ?? '',
    }
  }

  async saveSettings(settings: Settings): Promise<void> {
    const active = this.current()
    if (active) active.settings = { ...settings }
  }

  async saveCard(card: StoredCard): Promise<void> {
    const active = this.current()
    if (!active) return
    active.cards = [...active.cards.filter((item) => item.cardId !== card.cardId), { ...card }]
  }

  async replaceAll(snapshot: ProgressSnapshot): Promise<void> {
    const active = this.current()
    if (!active) return
    active.settings = { ...snapshot.settings }
    active.cards = snapshot.cards.map((card) => ({ ...card }))
  }

  async addPerson(name: string): Promise<boolean> {
    const clean = cleanPersonName(name)
    if (!clean || this.people.length >= PERSON_LIMIT) return false
    const id = crypto.randomUUID()
    this.people.push({ id, name: clean, level: LEVEL_PLACEHOLDER, settings: { ...defaultSettings }, cards: [] })
    this.activeId = id
    return true
  }

  async renamePerson(id: string, name: string): Promise<boolean> {
    const clean = cleanPersonName(name)
    const found = this.people.find((person) => person.id === id)
    if (!clean || !found) return false
    found.name = clean
    return true
  }

  async deletePerson(id: string): Promise<void> {
    this.people = this.people.filter((person) => person.id !== id)
    if (this.people.length === 0) {
      const fresh = crypto.randomUUID()
      this.people = [{ id: fresh, name: '', level: LEVEL_PLACEHOLDER, settings: { ...defaultSettings }, cards: [] }]
      this.activeId = fresh
      return
    }
    if (!this.people.some((person) => person.id === this.activeId)) this.activeId = this.people[0]?.id ?? ''
  }

  async switchPerson(id: string): Promise<void> {
    if (this.people.some((person) => person.id === id)) this.activeId = id
  }

  async importPerson(mode: 'replace' | 'add', person: ImportedPerson): Promise<'ok' | 'full'> {
    if (mode === 'add') {
      const added = await this.addPerson(person.name)
      if (!added) return 'full'
      await this.replaceAll({ settings: person.settings, cards: person.cards })
      return 'ok'
    }
    const active = this.current()
    if (!active) return 'full'
    const name = cleanPersonName(person.name)
    if (name) active.name = name
    active.settings = { ...person.settings }
    active.cards = person.cards.map((card) => ({ ...card }))
    return 'ok'
  }

  async importAll(people: readonly ImportedPerson[]): Promise<void> {
    const next: Held[] = []
    for (const person of people.slice(0, PERSON_LIMIT)) {
      const name = cleanPersonName(person.name)
      if (!name) continue
      next.push({
        id: crypto.randomUUID(),
        name,
        level: LEVEL_PLACEHOLDER,
        settings: { ...person.settings },
        cards: person.cards.map((card) => ({ ...card })),
      })
    }
    if (next.length === 0) {
      const id = crypto.randomUUID()
      this.people = [{ id, name: '', level: LEVEL_PLACEHOLDER, settings: { ...defaultSettings }, cards: [] }]
      this.activeId = id
      return
    }
    this.people = next
    this.activeId = next[0]?.id ?? ''
  }

  async everyone(): Promise<ImportedPerson[]> {
    return this.people.map((person) => ({
      name: person.name,
      settings: { ...person.settings },
      cards: person.cards.map((card) => ({ ...card })),
    }))
  }

  private current(): Held | undefined {
    return this.people.find((person) => person.id === this.activeId)
  }
}
