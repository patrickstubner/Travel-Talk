import { readFileSync, existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { hasAddressToken } from '../../content/address'
import { requireCatalog } from './load'
import { tempoFile } from '../audio/speed'
import { VOICES } from '../audio/voices'
import { AUDIO_FILE, allSpeechLines, conceptsForSituation, isStale, resolvePlayback, voiceFile } from './resolve'

const catalog = requireCatalog()
const banned = new RegExp(
  [
    [112, 97, 116, 114, 105, 99, 107],
    [114, 111, 103, 233, 114, 105, 97],
    [114, 111, 103, 101, 114, 105, 97],
    [115, 116, 117, 98, 110, 101, 114],
  ]
    .map((codes) => String.fromCharCode(...codes))
    .join('|'),
  'i',
)
const european = /\b(tu|autocarro|comboio|pequeno-almoço|pequeno almoço)\b/i
const tone = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i

function walk(value: unknown, visit: (text: string) => void): void {
  if (typeof value === 'string') visit(value)
  else if (Array.isArray(value)) value.forEach((item) => walk(item, visit))
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => walk(item, visit))
}

describe('catalog', () => {
  it('covers the journey and keeps counts for the first situations', () => {
    expect(catalog.situations).toHaveLength(9)
    expect(conceptsForSituation(catalog, 'emergency').length).toBeGreaterThanOrEqual(18)
    expect(conceptsForSituation(catalog, 'meeting').length).toBeGreaterThanOrEqual(18)
    expect(conceptsForSituation(catalog, 'arrival').length).toBeGreaterThanOrEqual(8)
    expect(conceptsForSituation(catalog, 'food').length).toBeGreaterThanOrEqual(8)
    for (const situation of catalog.situations) {
      expect(conceptsForSituation(catalog, situation.id).length).toBeGreaterThanOrEqual(5)
    }
  })

  it('marks every line unchecked and avoids banned text', () => {
    const texts: string[] = []
    walk(catalog, (text) => texts.push(text))
    expect(texts.some((text) => text.includes('ß'))).toBe(false)
    expect(texts.some((text) => banned.test(text))).toBe(false)
    for (const concept of catalog.concepts) {
      for (const row of concept.realizations) expect(row.geprueft).toBe(false)
    }
    for (const note of catalog.cultureNotes) expect(note.geprueft).toBe(false)
    for (const card of catalog.infoCards) expect(card.geprueft).toBe(false)
  })

  it('keeps Brazilian Portuguese and Vietnamese tone marks', () => {
    for (const concept of catalog.concepts) {
      for (const row of concept.realizations) {
        if (row.lang === 'pt-BR') {
          expect(row.text).not.toMatch(european)
          expect(row.speech ?? '').not.toMatch(european)
          for (const variant of row.variants ?? []) expect(variant.text).not.toMatch(european)
        }
        if (row.lang === 'vi' && row.text.length > 12) expect(row.text).toMatch(tone)
        if (row.lang === 'de' || row.lang === 'en') {
          expect(hasAddressToken(row.text)).toBe(false)
          expect(hasAddressToken(row.speech ?? '')).toBe(false)
        }
        if (row.variants && (hasAddressToken(row.text) || hasAddressToken(row.speech ?? ''))) {
          throw new Error(`token and variants on ${concept.id}`)
        }
      }
    }
  })

  it('points every playback file at a generated speech line', () => {
    const files = new Set(allSpeechLines(catalog.concepts).map((line) => line.file))
    const prefs = ['anh', 'voce', 'sie', 'obrigado', 'phone']
    for (const concept of catalog.concepts) {
      for (const lang of ['de', 'en', 'pt-BR', 'vi'] as const) {
        for (const region of ['south', 'north'] as const) {
          const playback = resolvePlayback(concept, lang, region, prefs)
          expect(playback).toBeTruthy()
          expect(playback && files.has(playback.file)).toBe(true)
          expect(playback && AUDIO_FILE.test(playback.file)).toBe(true)
          expect(playback && AUDIO_FILE.test(tempoFile(playback.file, 0.7))).toBe(true)
          expect(playback && AUDIO_FILE.test(tempoFile(playback.file, 0.85))).toBe(true)
        }
      }
    }
  })

  it('matches the audio manifest when the files are present', () => {
    const manifestPath = 'public/audio/manifest.json'
    expect(existsSync(manifestPath)).toBe(true)
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as unknown
    expect(Array.isArray(manifest)).toBe(true)
    const listed = new Set(manifest as string[])
    for (const line of allSpeechLines(catalog.concepts)) {
      expect(listed.has(line.file)).toBe(true)
      expect(listed.has(tempoFile(line.file, 0.7))).toBe(true)
      expect(listed.has(tempoFile(line.file, 0.85))).toBe(true)
    }
    for (const line of allSpeechLines(catalog.concepts)) {
      for (const voice of VOICES.filter((item) => item.bundled && item.lang === line.lang)) {
        const file = voiceFile(line.file, voice.id, voice.legacy)
        expect(listed.has(file), file).toBe(true)
        expect(file).toMatch(AUDIO_FILE)
        expect(listed.has(tempoFile(file, 0.7))).toBe(true)
        expect(listed.has(tempoFile(file, 0.85))).toBe(true)
      }
    }
    for (const file of listed) expect(file).toMatch(AUDIO_FILE)
  })

  it('ages info cards after six months', () => {
    expect(isStale('2026-10-10', new Date('2026-10-10T00:00:00Z'))).toBe(false)
    expect(isStale('2025-01-01', new Date('2026-10-10T00:00:00Z'))).toBe(true)
    expect(isStale('not-a-date', new Date('2026-10-10T00:00:00Z'))).toBe(true)
  })
})
