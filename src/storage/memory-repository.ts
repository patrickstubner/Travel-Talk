import { defaultSettings, type ProgressRepository, type ProgressSnapshot, type Settings, type StoredCard } from './types'

export class MemoryProgressRepository implements ProgressRepository {
  private snapshot: ProgressSnapshot = { settings: { ...defaultSettings }, cards: [] }

  async load(): Promise<ProgressSnapshot> {
    return {
      settings: { ...this.snapshot.settings },
      cards: this.snapshot.cards.map((card) => ({ ...card })),
    }
  }

  async saveSettings(settings: Settings): Promise<void> {
    this.snapshot.settings = { ...settings }
  }

  async saveCard(card: StoredCard): Promise<void> {
    const rest = this.snapshot.cards.filter((item) => item.cardId !== card.cardId)
    this.snapshot.cards = [...rest, { ...card }]
  }

  async replaceAll(snapshot: ProgressSnapshot): Promise<void> {
    this.snapshot = {
      settings: { ...snapshot.settings },
      cards: snapshot.cards.map((card) => ({ ...card })),
    }
  }
}
