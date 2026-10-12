import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // A query gives up after 5s and prints the page (src/test-setup.ts).
    // The test itself needs longer, or Vitest reports a blank timeout first.
    testTimeout: 15_000,
    hookTimeout: 15_000,
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'content/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', 'src/pitch/clips.test.ts'],
    environmentOptions: {
      happyDOM: { url: 'about:blank' },
    },
  },
})
