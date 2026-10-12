import { mkdirSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

const SHOTS = '/opt/cursor/artifacts/screenshots'

test.beforeAll(() => {
  mkdirSync(SHOTS, { recursive: true })
})

async function pickTarget(page: Page, menuName: RegExp, language: string): Promise<void> {
  await page.getByRole('button', { name: menuName }).click()
  const groups = page.getByRole('group', { name: menuName })
  await groups.last().getByRole('button', { name: language, exact: true }).click()
}

async function openPhrase(page: Page): Promise<void> {
  await page.goto('#/')
  await page.getByRole('textbox', { name: 'Wie sollen wir dich nennen?' }).fill('A')
  await page.getByRole('button', { name: 'Weiter', exact: true }).click()
}

async function record(page: Page, start: string, stop: string): Promise<void> {
  await page.getByRole('button', { name: start }).click()
  const stopButton = page.getByRole('button', { name: stop, exact: true })
  await expect(stopButton).toBeVisible()
  await page.waitForTimeout(1200)
  await stopButton.click()
}

test('German sentence at 375 px does not overflow after the result', async ({ page }) => {
  await openPhrase(page)
  await page.getByRole('button', { name: 'Englisch', exact: true }).click()
  await pickTarget(page, /^Language you are learning/, 'German')
  await page.getByRole('button', { name: 'Continue to Learn today' }).click()
  await page.goto('#/phrase/emergency.write')
  await record(page, 'Record', 'Stop')
  await expect(page.locator('.word-chip').first()).toBeVisible()
  await page.screenshot({ path: `${SHOTS}/phrase-de-375.png`, fullPage: true })
  const box = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth)
})

test('English sentence at 375 px does not overflow after the result', async ({ page }) => {
  await openPhrase(page)
  await page.getByRole('button', { name: 'Deutsch', exact: true }).click()
  await pickTarget(page, /^Sprache, die du lernst/, 'Englisch')
  await page.getByRole('button', { name: 'Weiter zu Heute lernen' }).click()
  await page.goto('#/phrase/emergency.write')
  await record(page, 'Aufnehmen', 'Stopp')
  await expect(page.locator('.word-chip').first()).toBeVisible()
  await page.screenshot({ path: `${SHOTS}/phrase-en-375.png`, fullPage: true })
  const box = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth)
})
