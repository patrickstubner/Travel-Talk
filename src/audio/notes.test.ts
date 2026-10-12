import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { AUDIO_FILE } from '../content/resolve'
import { collectHelpLines } from './notes'

describe('help clips', () => {
  it('names one bundled Piper file per explanation and lists it in the manifest', () => {
    const lines = collectHelpLines()
    expect(lines.length).toBeGreaterThan(500)
    const files = new Set(lines.map((line) => line.file))
    expect(files.size).toBe(lines.length)
    for (const line of lines) {
      expect(line.file).toMatch(AUDIO_FILE)
      expect(line.text.trim().length).toBeGreaterThan(0)
    }
    const write = lines.find((line) => line.file === 'de/help/ctx.emergency.write__any__base.m4a')
    expect(write?.text).toMatch(/Wozu der Satz/)
    expect(write?.text).toMatch(/Adressen/)
    const manifest = JSON.parse(readFileSync('public/audio/manifest.json', 'utf8')) as string[]
    const listed = new Set(manifest)
    for (const line of lines) expect(listed.has(line.file), line.file).toBe(true)
  })
})