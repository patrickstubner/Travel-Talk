import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium, expect, test, type Page } from '@playwright/test'

const SOURCE = 'public/audio/de/day.numbers__any__base.r70.m4a'

function renderWav(padSeconds: number): string {
  const dir = mkdtempSync(join(tmpdir(), 'vosk-de-'))
  const out = join(dir, padSeconds > 0 ? 'mic.wav' : 'model.wav')
  execFileSync(
    'ffmpeg',
    [
      '-y',
      '-loglevel',
      'error',
      '-i',
      SOURCE,
      ...(padSeconds > 0 ? ['-af', `apad=pad_dur=${padSeconds}`] : []),
      '-ac',
      '2',
      '-ar',
      '44100',
      '-c:a',
      'pcm_s16le',
      out,
    ],
    { stdio: 'ignore' },
  )
  return out
}

async function openGermanPhrase(page: Page): Promise<void> {
  await page.goto('#/')
  await page.getByRole('textbox', { name: 'Wie sollen wir dich nennen?' }).fill('A')
  await page.getByRole('button', { name: 'Weiter', exact: true }).click()
  const board = page.getByTestId('onboarding')
  await board.getByRole('group', { name: 'Sprache der App' }).getByRole('button', { name: 'Englisch', exact: true }).click()
  await board.getByRole('group', { name: 'Language you want to learn' }).getByRole('button', { name: 'German', exact: true }).click()
  await page.getByRole('button', { name: 'Continue to Learn today' }).click()
  await page.goto('#/phrase/day.numbers')
  await expect(page.getByRole('button', { name: 'Record' })).toBeVisible()
}

test('german model loads at 844x390 and scores the sentence', async ({ baseURL }) => {
  test.setTimeout(180_000)
  const browser = await chromium.launch({
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      `--use-file-for-fake-audio-capture=${renderWav(8)}`,
    ],
  })
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 844, height: 390 },
    serviceWorkers: 'block',
    permissions: ['microphone'],
  })
  const page = await context.newPage()
  const modelWav = readFileSync(renderWav(0))
  await page.route('**/*day.numbers*.m4a', async (route) => {
    await route.fulfill({ status: 200, contentType: 'audio/wav', body: Buffer.from(modelWav) })
  })
  let modelHits = 0
  await page.route('**/*vosk-model-small-de-0.15.tar.gz', async (route) => {
    modelHits += 1
    if (modelHits > 1) {
      await route.fulfill({ status: 200, contentType: 'application/gzip', body: Buffer.from('tampered-model') })
      return
    }
    await route.continue()
  })
  await openGermanPhrase(page)
  const offer = page.getByTestId('speech-offer')
  await expect(offer).toBeVisible()
  await expect(offer).toContainText('German')
  expect(modelHits).toBe(0)
  const model = page.waitForResponse((response) => response.url().includes('vosk-model-small-de-0.15.tar.gz') && response.ok())
  await page.getByTestId('speech-load').click()
  const progress = page.getByTestId('speech-progress')
  await expect(progress).toBeVisible()
  await expect(progress).toContainText('German speech recognition')
  const response = await model
  expect(Number(response.headers()['content-length'])).toBe(46501380)
  await expect(progress).toHaveCount(0, { timeout: 120_000 })
  expect(modelHits).toBe(1)
  await expect(page.getByTestId('speech-fallback')).toHaveCount(0)

  await page.getByRole('button', { name: 'Record' }).click()
  const stop = page.getByRole('button', { name: 'Stop', exact: true })
  await expect(stop).toBeVisible()
  await page.waitForTimeout(9500)
  await stop.click()

  await expect
    .poll(async () => page.getByTestId('repeat-feedback').getAttribute('data-speech-state'), { timeout: 60_000 })
    .not.toBe('pending')
  const state = await page.getByTestId('repeat-feedback').getAttribute('data-speech-state')
  const heard = await page.getByTestId('repeat-feedback').getAttribute('data-heard')
  expect(state, `heard: ${heard}`).toBe('ready')
  const stars = Number(await page.getByTestId('repeat-stars').getAttribute('data-stars'))
  expect(stars, `heard: ${heard}`).toBeGreaterThanOrEqual(3)
  await browser.close()
})
