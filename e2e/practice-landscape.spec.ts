import { mkdirSync } from 'node:fs'
import { expect, test, type Locator, type Page } from '@playwright/test'

function shotPath(): string {
  const preferred = '/opt/cursor/artifacts'
  try {
    mkdirSync(preferred, { recursive: true })
    return `${preferred}/practice-844x390-record.png`
  } catch {
    mkdirSync('test-results/overflow', { recursive: true })
    return 'test-results/overflow/practice-844x390-record.png'
  }
}

async function box(locator: Locator) {
  const value = await locator.boundingBox()
  expect(value, await locator.evaluate((element) => element.textContent)).toBeTruthy()
  return value!
}

function overlaps(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

async function openRepeat(page: Page): Promise<void> {
  await page.goto('#/')
  await page.getByRole('textbox', { name: 'Wie sollen wir dich nennen?' }).fill('A')
  await page.getByRole('button', { name: 'Weiter', exact: true }).click()
  const board = page.getByTestId('onboarding')
  await board.getByRole('group', { name: 'Sprache der App' }).getByRole('button', { name: 'Deutsch' }).click()
  await board.getByRole('group', { name: 'Sprache, die du lernen willst' }).getByRole('button', { name: 'Vietnamesisch' }).click()
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

test('sentence page keeps Aufnehmen visible beside Weiter at 844x390', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 })
  await openRepeat(page)
  const record = page.getByRole('button', { name: 'Aufnehmen', exact: true })
  const next = page.getByRole('button', { name: 'Weiter', exact: true })
  await expect(next).toBeVisible()

  const recordBox = await box(record)
  const nextBox = await box(next)
  const viewport = page.viewportSize()
  expect(viewport).toEqual({ width: 844, height: 390 })
  for (const item of [recordBox, nextBox]) {
    expect(item.y).toBeGreaterThanOrEqual(0)
    expect(item.y + item.height).toBeLessThanOrEqual(viewport!.height)
    expect(item.x).toBeGreaterThanOrEqual(0)
    expect(item.x + item.width).toBeLessThanOrEqual(viewport!.width)
  }
  expect(overlaps(recordBox, nextBox)).toBe(false)
  expect(Math.abs(recordBox.y - nextBox.y)).toBeLessThan(8)
  expect(recordBox.x + recordBox.width).toBeLessThanOrEqual(nextBox.x)

  const hit = await record.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const target = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
    return element.contains(target)
  })
  expect(hit).toBe(true)

  const nav = await box(page.locator('nav'))
  expect(overlaps(recordBox, nav)).toBe(false)
  expect(overlaps(nextBox, nav)).toBe(false)

  const barPosition = await page.getByTestId('speak-actions').evaluate((element) => getComputedStyle(element).position)
  expect(barPosition).toBe('sticky')
  const lineHit = await page.getByTestId('learn-head').evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const target = document.elementFromPoint(rect.left + Math.min(24, rect.width / 2), rect.top + Math.min(16, rect.height / 2))
    return element.contains(target)
  })
  expect(lineHit).toBe(true)

  await page.screenshot({ path: shotPath() })

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(record).toBeVisible()
  await expect(next).toBeVisible()
  const portraitRecord = await box(record)
  const portraitNext = await box(next)
  const portraitNav = await box(page.locator('nav'))
  const portrait = page.viewportSize()
  expect(portrait).toEqual({ width: 390, height: 844 })
  expect(overlaps(portraitRecord, portraitNext)).toBe(false)
  expect(Math.abs(portraitRecord.y - portraitNext.y)).toBeLessThan(8)
  expect(overlaps(portraitRecord, portraitNav)).toBe(false)
  expect(overlaps(portraitNext, portraitNav)).toBe(false)
  const gap = portraitNav.y - Math.max(portraitRecord.y + portraitRecord.height, portraitNext.y + portraitNext.height)
  expect(gap).toBeGreaterThanOrEqual(0)
  expect(gap).toBeLessThanOrEqual(12)
  const portraitLine = await page.getByTestId('learn-head').evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const target = document.elementFromPoint(rect.left + Math.min(24, rect.width / 2), rect.top + Math.min(16, rect.height / 2))
    return element.contains(target)
  })
  expect(portraitLine).toBe(true)
  await page.screenshot({ path: shotPath().replace('practice-844x390-record.png', 'practice-390x844-record.png') })
})
