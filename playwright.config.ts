import { defineConfig, devices } from '@playwright/test'
import { deMicWav, enMicWav } from './e2e/fake-mic'

const phone = { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 }

function micArgs(file: string): string[] {
  return [
    '--use-fake-ui-for-media-stream',
    '--use-fake-device-for-media-stream',
    `--use-file-for-fake-audio-capture=${file}`,
  ]
}

export default defineConfig({
  testDir: 'e2e',
  globalSetup: './e2e/global-setup.ts',
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4173/Travel-Talk/',
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 1,
    permissions: ['microphone'],
    // The test replaces the AAC clip with a wav. A service worker would keep serving the m4a.
    serviceWorkers: 'block',
  },
  webServer: {
    command: 'npm run preview -- --port 4173 --host 127.0.0.1',
    url: 'http://127.0.0.1:4173/Travel-Talk/',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    { name: 'de', grep: /German ten-word/, use: { ...phone, launchOptions: { args: micArgs(deMicWav) } } },
    { name: 'en', grep: /English ten-word/, use: { ...phone, launchOptions: { args: micArgs(enMicWav) } } },
    {
      name: 'landscape',
      grep: /844x390/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 },
    },
  ],
})
