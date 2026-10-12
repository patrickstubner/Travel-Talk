import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('help clip text hash', () => {
  it('rebuilds when the stored hash is missing or the text changed', () => {
    const out = execFileSync('python3', ['tools/help_stamp.py', '--self-test'], { encoding: 'utf8' })
    expect(out).toContain('ok')
    const source = readFileSync('tools/help_audio.py', 'utf8')
    expect(source).toContain('clip_is_current')
    expect(source).not.toMatch(/if dest\.exists\(\) and dest\.stat\(\)\.st_size > 0:\s*continue/)
  })
})