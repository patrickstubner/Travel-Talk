import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { Lang } from '../../content/phrase'
import { SPEECH_MODELS } from './vosk'

const LANGS: Lang[] = ['de', 'en', 'pt-BR', 'vi']

describe('speech model archives', () => {
  it('pins one Apache small model for every language', () => {
    expect(Object.keys(SPEECH_MODELS).sort()).toEqual([...LANGS].sort())
    for (const lang of LANGS) {
      const spec = SPEECH_MODELS[lang]
      const bytes = readFileSync(fileURLToPath(new URL(`../../public/${spec.file}`, import.meta.url)))
      expect(bytes.byteLength, lang).toBe(spec.bytes)
      expect(createHash('sha256').update(bytes).digest('hex'), lang).toBe(spec.sha256)
      expect(spec.sha256, lang).toMatch(/^[0-9a-f]{64}$/)
      expect(spec.zipSha256, lang).toMatch(/^[0-9a-f]{64}$/)
      expect(spec.file.endsWith('.tar.gz'), lang).toBe(true)
    }
  })
})
