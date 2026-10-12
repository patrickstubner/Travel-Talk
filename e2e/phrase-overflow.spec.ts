import { mkdirSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

function shotDir(): string {
  const preferred = '/opt/cursor/artifacts/screenshots'
  try {
    mkdirSync(preferred, { recursive: true })
    return preferred
  } catch {
    const fallback = 'test-results/overflow'
    mkdirSync(fallback, { recursive: true })
    return fallback
  }
}

const SHOTS = shotDir()

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

async function expectReadableChips(page: Page, shot: string): Promise<void> {
  await expect(page.locator('.word-chip').first()).toBeVisible()
  await page.screenshot({ path: shot, fullPage: true })
  const chips = await page.locator('.word-chip').evaluateAll((nodes) =>
    nodes.map((chip) => {
      const parts = [chip.querySelector('.word-chip-text'), ...chip.querySelectorAll('.mark')].filter(
        (node): node is HTMLElement => node instanceof HTMLElement,
      )
      return parts.map((part) => ({
        text: part.textContent ?? '',
        lines: part.getClientRects().length,
        scrollWidth: part.scrollWidth,
        clientWidth: part.clientWidth,
      }))
    }),
  )
  expect(chips.length).toBeGreaterThan(0)
  for (const parts of chips) {
    expect(parts.length).toBeGreaterThan(0)
    for (const part of parts) {
      expect(part.lines, part.text).toBe(1)
      expect(part.scrollWidth, part.text).toBeLessThanOrEqual(part.clientWidth)
    }
  }
  const pageBox = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(pageBox.scrollWidth).toBeLessThanOrEqual(pageBox.clientWidth)
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
  await expectReadableChips(page, `${SHOTS}/phrase-de-375.png`)
})

test('English sentence at 375 px does not overflow after the result', async ({ page }) => {
  await openPhrase(page)
  await page.getByRole('button', { name: 'Deutsch', exact: true }).click()
  await pickTarget(page, /^Sprache, die du lernst/, 'Englisch')
  await page.getByRole('button', { name: 'Weiter zu Heute lernen' }).click()
  await page.goto('#/phrase/emergency.write')
  await record(page, 'Aufnehmen', 'Stopp')
  await expectReadableChips(page, `${SHOTS}/phrase-en-375.png`)
})
