import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { PORTUGUESE_MODEL_BYTES, PORTUGUESE_MODEL_FILE, PORTUGUESE_MODEL_SHA256 } from './vosk-pt'

describe('portuguese model archive', () => {
  it('matches the pinned size and sha-256', () => {
    const bytes = readFileSync(fileURLToPath(new URL(`../../public/${PORTUGUESE_MODEL_FILE}`, import.meta.url)))
    expect(bytes.byteLength).toBe(PORTUGUESE_MODEL_BYTES)
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(PORTUGUESE_MODEL_SHA256)
  })
})
