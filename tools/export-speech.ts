import { writeFileSync } from 'node:fs'
import { requireCatalog } from '../src/content/load'
import { allSpeechLines } from '../src/content/resolve'

const lines = allSpeechLines(requireCatalog().concepts)
writeFileSync('tools/lines.json', JSON.stringify(lines))
console.error(`lines ${lines.length}`)
