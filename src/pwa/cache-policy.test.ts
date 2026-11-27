import { readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { collectHelpLines } from '../audio/notes'
import { HELP_CACHE_LIMIT, PRECACHE_BYTE_BUDGET, PRECACHE_ENTRY_BUDGET, precacheMatches } from './cache-policy'

describe('precache policy', () => {
  it('leaves help clips out and stays within the install budget', () => {
    expect(precacheMatches('audio/de/help/ui.mic__any__base.m4a')).toBe(false)
    expect(precacheMatches('index.html')).toBe(true)
    expect(precacheMatches('audio/de/emergency.help__any__base.align.json')).toBe(false)
    expect(precacheMatches('sw.js')).toBe(false)
    expect(precacheMatches('models/vosk-model-small-pt-0.3.tar.gz')).toBe(false)
    expect(precacheMatches('models/vosk-model-small-de-0.15.tar.gz')).toBe(false)
    expect(precacheMatches('models/vosk-model-small-en-us-0.15.tar.gz')).toBe(false)
    expect(precacheMatches('models/vosk-model-small-vn-0.4.tar.gz')).toBe(false)
    expect(precacheMatches('static/js/vosk.abc123.js')).toBe(false)

    const root = 'public'
    let count = 0
    let size = 0
    const help: string[] = []
    function visit(dir: string): void {
      for (const name of readdirSync(dir)) {
        const abs = join(dir, name)
        const rel = relative(root, abs).replaceAll('\\', '/')
        if (statSync(abs).isDirectory()) {
          visit(abs)
          continue
        }
        if (!precacheMatches(rel)) continue
        if (rel.includes('/help/') && rel.endsWith('.m4a')) help.push(rel)
        count += 1
        size += statSync(abs).size
      }
    }
    visit(root)
    expect(help).toEqual([])
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThanOrEqual(PRECACHE_ENTRY_BUDGET)
    expect(size).toBeLessThanOrEqual(PRECACHE_BYTE_BUDGET)
  })

  it('fits one app language of help clips and not two', () => {
    const byLang = new Map<string, number>()
    for (const line of collectHelpLines()) {
      const lang = line.file.split('/')[0] ?? ''
      byLang.set(lang, (byLang.get(lang) ?? 0) + 1)
    }
    const counts = [...byLang.values()]
    const largest = Math.max(...counts)
    const smallestTwo = counts.sort((a, b) => a - b).slice(0, 2).reduce((sum, value) => sum + value, 0)
    expect(largest).toBeGreaterThan(0)
    expect(HELP_CACHE_LIMIT).toBeGreaterThanOrEqual(largest)
    expect(HELP_CACHE_LIMIT).toBeLessThan(smallestTwo)
  })
})
