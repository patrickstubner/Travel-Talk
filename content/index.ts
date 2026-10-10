import { cultureNotes, infoCards, pairNotes } from './culture'
import { emergencyPhrases } from './phrases/emergency'
import { meetingPhrases } from './phrases/meeting'
import { travelPhrases } from './phrases/travel'
import { situations } from './situations'

export const rawCatalog = {
  situations,
  concepts: [...emergencyPhrases, ...meetingPhrases, ...travelPhrases],
  cultureNotes,
  infoCards,
  pairNotes,
}
