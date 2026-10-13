import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { collectHelpLines } from './notes'

describe('help clip text hash', () => {
  it('matches the sha-256 of every current help line', () => {
    const stored = JSON.parse(readFileSync('tools/help_text_hashes.json', 'utf8')) as Record<string, unknown>
    const lines = collectHelpLines()
    expect(Object.keys(stored).sort()).toEqual(lines.map((line) => line.file).sort())
    for (const line of lines) {
      const digest = createHash('sha256').update(line.text, 'utf8').digest('hex')
      expect(stored[line.file], line.file).toBe(digest)
    }
  })

  it('rebuilds when the stored hash is missing or the text changed', () => {
    const out = execFileSync('python3', ['tools/help_stamp.py', '--self-test'], { encoding: 'utf8' })
    expect(out).toContain('ok')
    const source = readFileSync('tools/help_audio.py', 'utf8')
    expect(source).toContain('clip_is_current')
    expect(source).not.toMatch(/if dest\.exists\(\) and dest\.stat\(\)\.st_size > 0:\s*continue/)
  })
})