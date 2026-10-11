import { cultureNotes, infoCards, pairNotes } from './culture'
import { emergencyPhrases } from './phrases/emergency'
import { meetingPhrases } from './phrases/meeting'
import { transportPhrases } from './phrases/transport'
import { travelPhrases } from './phrases/travel'
import { situations } from './situations'

export const rawCatalog = {
  situations,
  concepts: [...emergencyPhrases, ...meetingPhrases, ...travelPhrases, ...transportPhrases],
  cultureNotes,
  infoCards,
  pairNotes,
}
