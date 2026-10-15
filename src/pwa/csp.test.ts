import { describe, expect, it } from 'vitest'
import { PAGE_CSP, VOSK_SCRIPT_CACHE, VOSK_WORKER_CSP, pageCspIsLoose, voskServiceWorkerPrelude } from './csp'

describe('content security policy', () => {
  it('keeps eval and blob workers off the page', () => {
    expect(pageCspIsLoose(PAGE_CSP)).toBe(false)
    expect(PAGE_CSP).toContain("script-src 'self'")
    expect(PAGE_CSP).toContain("worker-src 'self'")
    expect(PAGE_CSP).toContain("media-src 'self' blob:")
    expect(PAGE_CSP).not.toContain('wasm-unsafe-eval')
  })

  it('allows eval only on the worker response and drops old script cache entries', () => {
    expect(VOSK_WORKER_CSP).toContain("'unsafe-eval'")
    expect(VOSK_WORKER_CSP).toContain("'wasm-unsafe-eval'")
    expect(VOSK_WORKER_CSP).toContain("connect-src 'none'")
    const prelude = voskServiceWorkerPrelude()
    expect(prelude).toContain(VOSK_WORKER_CSP)
    expect(prelude).toContain(`caches.delete('${VOSK_SCRIPT_CACHE}')`)
    expect(prelude).toContain("/vosk-worker.js")
    expect(pageCspIsLoose(PAGE_CSP)).toBe(false)
  })
})