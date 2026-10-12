import { defineConfig } from 'vitest/config'

/** Shipped-clip regression. Kept out of `npm test` so the UI suite stays short. */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/pitch/clips.test.ts'],
    fileParallelism: false,
  },
})
