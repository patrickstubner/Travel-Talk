import { readFileSync } from 'fs'
import { mkdirSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import { deMicWav, enMicWav } from './fake-mic'
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
const PHRASE = '#/phrase/day.numbers'

async function openPhrase(page: Page): Promise<void> {
  await page.goto('#/')
  await page.getByRole('textbox', { name: 'Wie sollen wir dich nennen?' }).fill('A')
  await page.getByRole('button', { name: 'Weiter', exact: true }).click()
}

/**
 * Playwright's Chromium build does not decode AAC. The sentence wav already
 * used as the microphone also stands in for that m4a, so the model curve can load.
 */
async function serveSentence(page: Page, wav: string): Promise<void> {
  const body = readFileSync(wav)
  await page.route('**/*day.numbers*.m4a', async (route) => {
    await route.fulfill({ status: 200, contentType: 'audio/wav', body })
  })
}

async function record(page: Page, start: string, stop: string): Promise<void> {
  await page.getByRole('button', { name: start }).click()
  const stopButton = page.getByRole('button', { name: stop, exact: true })
  await expect(stopButton).toBeVisible()
  await page.waitForTimeout(7400)
  await stopButton.click()
}

async function expectCompactResult(page: Page, shot: string): Promise<void> {
  await expect(page.getByTestId('melody-bar')).toBeVisible()
  await expect(page.getByTestId('rhythm-bar')).toBeVisible()
  await expect(page.locator('.word-card')).toHaveCount(10)
  const stars = page.getByTestId('repeat-stars')
  await expect(stars).toBeVisible()
  await expect(stars.getByRole('img')).toHaveAttribute('aria-label', /^[0-5] (von 5 Sternen|of 5 stars)$/)
  await expect(stars.locator('.star')).toHaveCount(5)
  const starBox = await stars.locator('.take-stars-row').boundingBox()
  const viewport = page.viewportSize()
  expect(starBox).toBeTruthy()
  expect(starBox!.x).toBeGreaterThanOrEqual(0)
  expect(starBox!.x + starBox!.width).toBeLessThanOrEqual((viewport?.width ?? 375) + 1)
  await page.screenshot({ path: shot, fullPage: true })
  const result = await page.locator('[data-testid="repeat-feedback"]').evaluate((section) => {
    const cards = [...section.querySelectorAll('.word-card')].map((card) => {
      const canvas = card.querySelector('canvas')
      const word = card.querySelector('.word-chip-text')?.textContent ?? ''
      let modelPixels = 0
      if (canvas instanceof HTMLCanvasElement) {
        const context = canvas.getContext('2d')
        const image = context?.getImageData(0, 0, canvas.width, canvas.height)
        const data = image?.data
        if (data) {
          for (let index = 0; index < data.length; index += 4) {
            const red = data[index] ?? 0
            const green = data[index + 1] ?? 0
            const blue = data[index + 2] ?? 0
            const model = green > 70 && red < 90 && green > red + 20 && blue > 40
            const you = red > 90 && green < 100 && blue < 90 && red > green + 20
            if (model || you) modelPixels += 1
          }
        }
      }
      const parts = [card.querySelector('.word-chip-text'), ...card.querySelectorAll('.mark')].filter(
        (node): node is HTMLElement => node instanceof HTMLElement,
      )
      return {
        word,
        curves: card.querySelectorAll('canvas').length,
        modelPixels,
        parts: parts.map((part) => {
          // A flex item's getClientRects() stays 1 when the glyphs wrap, so the
        // line count is the border box divided by the used line-height.
        const lineHeight = Number.parseFloat(getComputedStyle(part).lineHeight)
          const height = part.getBoundingClientRect().height
          return {
            text: part.textContent ?? '',
            lines: Number.isFinite(lineHeight) && lineHeight > 0 ? height / lineHeight : 99,
            scrollWidth: part.scrollWidth,
            clientWidth: part.clientWidth,
          }
        }),
      }
    })
    return {
      height: section.getBoundingClientRect().height,
      cards,
    }
  })
  expect(result.cards).toHaveLength(10)
  expect(result.height, 'evaluation height').toBeLessThan(800)
  const drawn = result.cards.filter((card) => card.modelPixels > 8).length
  expect(drawn).toBeGreaterThanOrEqual(8)
  for (const card of result.cards) {
    expect(card.word.trim().length, 'word label').toBeGreaterThan(0)
    expect(card.curves, card.word).toBe(1)
    for (const part of card.parts) {
      expect(part.lines, part.text).toBeGreaterThan(0.5)
      expect(part.lines, part.text).toBeLessThan(1.45)
      expect(part.scrollWidth, part.text).toBeLessThanOrEqual(part.clientWidth + 1)
    }
  }
  const pageBox = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(pageBox.scrollWidth).toBeLessThanOrEqual(pageBox.clientWidth)
}

test('German ten-word sentence stays compact at 375 px', async ({ page }) => {
  await serveSentence(page, deMicWav)
  await openPhrase(page)
  const germanBoard = page.getByTestId('onboarding')
  await germanBoard.getByRole('group', { name: 'Sprache der App' }).getByRole('button', { name: 'Englisch', exact: true }).click()
  await germanBoard.getByRole('group', { name: 'Language you want to learn' }).getByRole('button', { name: 'German', exact: true }).click()
  await page.getByRole('button', { name: 'Continue to Learn today' }).click()
  await page.goto(PHRASE)
  await record(page, 'Record', 'Stop')
  await expectCompactResult(page, `${SHOTS}/phrase-de-375.png`)
})

test('English ten-word sentence stays compact at 375 px', async ({ page }) => {
  await serveSentence(page, enMicWav)
  await openPhrase(page)
  const englishBoard = page.getByTestId('onboarding')
  await englishBoard.getByRole('group', { name: 'Sprache der App' }).getByRole('button', { name: 'Deutsch', exact: true }).click()
  await englishBoard.getByRole('group', { name: 'Sprache, die du lernen willst' }).getByRole('button', { name: 'Englisch', exact: true }).click()
  await page.getByRole('button', { name: 'Weiter zu Heute lernen' }).click()
  await page.goto(PHRASE)
  await record(page, 'Aufnehmen', 'Stopp')
  await expectCompactResult(page, `${SHOTS}/phrase-en-375.png`)
})
