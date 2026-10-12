import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'content/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', 'src/pitch/clips.test.ts'],
    environmentOptions: {
      happyDOM: { url: 'about:blank' },
    },
  },
})
