import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium, expect, test, type Page } from '@playwright/test'

const SOURCE = 'public/audio/pt-BR/cadu/arrival.days__any__base.r70.m4a'

function renderWav(padSeconds: number): string {
  const dir = mkdtempSync(join(tmpdir(), 'vosk-pt-'))
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

async function openPortugueseRepeat(page: Page): Promise<void> {
  await page.goto('#/')
  await page.getByRole('textbox', { name: 'Wie sollen wir dich nennen?' }).fill('A')
  await page.getByRole('button', { name: 'Weiter', exact: true }).click()
  const board = page.getByTestId('onboarding')
  await board.getByRole('group', { name: 'Sprache der App' }).getByRole('button', { name: 'Deutsch' }).click()
  await board.getByRole('group', { name: 'Sprache, die du lernen willst' }).getByRole('button', { name: 'Portugiesisch (Brasilien)' }).click()
  await page.getByRole('button', { name: 'Weiter zu Heute lernen' }).click()
  await page.getByRole('heading', { name: 'Heute lernen' }).waitFor()
  await page.getByRole('link', { name: 'Heute lernen' }).click()
  const record = page.getByRole('button', { name: 'Aufnehmen', exact: true })
  for (let step = 0; step < 8 && (await record.count()) === 0; step += 1) {
    const skip = page.getByTestId('skip-words')
    if (await skip.count()) await skip.click()
    else await page.getByRole('button', { name: 'Weiter', exact: true }).click()
  }
  await expect(record).toBeVisible()
}

test('portuguese model loads at 844x390 and scores the sentence', async ({ baseURL }) => {
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
  await page.route('**/arrival.days__any__base.r70.m4a', async (route) => {
    await route.fulfill({ status: 200, contentType: 'audio/wav', body: Buffer.from(modelWav) })
  })
  const model = page.waitForResponse((response) => response.url().includes('vosk-model-small-pt-0.3.tar.gz') && response.ok())
  await openPortugueseRepeat(page)
  const progress = page.getByTestId('speech-progress')
  await expect(progress).toBeVisible()
  const response = await model
  expect(Number(response.headers()['content-length'])).toBe(32454947)
  await expect(progress).toHaveCount(0, { timeout: 120_000 })
  await expect(page.getByTestId('speech-fallback')).toHaveCount(0)

  await page.getByRole('button', { name: 'Aufnehmen', exact: true }).click()
  const stop = page.getByRole('button', { name: 'Stopp', exact: true })
  await expect(stop).toBeVisible()
  await page.waitForTimeout(4500)
  await stop.click()

  await expect
    .poll(async () => page.getByTestId('repeat-feedback').getAttribute('data-speech-state'), { timeout: 60_000 })
    .not.toBe('pending')
  const state = await page.getByTestId('repeat-feedback').getAttribute('data-speech-state')
  const heard = await page.getByTestId('repeat-feedback').getAttribute('data-heard')
  expect(state, `heard: ${heard}`).toBe('ready')
  const stars = Number(await page.getByTestId('repeat-stars').getAttribute('data-stars'))
  expect(stars, `heard: ${heard}`).toBeGreaterThanOrEqual(2)
  await browser.close()
})
