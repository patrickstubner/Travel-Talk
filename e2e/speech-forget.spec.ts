import { expect, test, type Page } from '@playwright/test'

const MODEL = '/Travel-Talk/models/vosk-model-small-de-0.15.tar.gz'

async function openSettings(page: Page): Promise<void> {
  await page.goto('#/')
  await page.getByRole('textbox', { name: 'Wie sollen wir dich nennen?' }).fill('A')
  await page.getByRole('button', { name: 'Weiter', exact: true }).click()
  const board = page.getByTestId('onboarding')
  await board.getByRole('group', { name: 'Sprache der App' }).getByRole('button', { name: 'Deutsch', exact: true }).click()
  await board.getByRole('group', { name: 'Sprache, die du lernen willst' }).getByRole('button', { name: 'Englisch', exact: true }).click()
  await page.getByRole('button', { name: 'Weiter zu Heute lernen' }).click()
  await page.evaluate(async (archive) => {
    const url = new URL(archive, window.location.href).href
    const response = await fetch(url)
    if (!response.ok) throw new Error('model fetch failed')
    const cache = await caches.open('travel-talk-vosk')
    await cache.put(url, response)
  }, MODEL)
  await page.goto('#/settings')
}

test('deletes a stored speech model at 844x390 and in portrait', async ({ page }) => {
  test.setTimeout(120_000)
  let modelRequests = 0
  page.on('request', (request) => {
    if (request.url().includes('vosk-model-small-de-0.15.tar.gz')) modelRequests += 1
  })
  await openSettings(page)
  const forget = page.getByRole('button', { name: 'Deutsch löschen, 47 MB' })
  await expect(forget).toBeVisible()
  await expect(page.getByTestId('speech-models')).toBeVisible()
  expect(modelRequests).toBe(1)

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(forget).toBeVisible()
  await forget.click()
  await expect(page.getByTestId('speech-models')).toHaveCount(0)
  expect(modelRequests).toBe(1)

  const stillStored = await page.evaluate(async (archive) => {
    const url = new URL(archive, window.location.href).href
    const cache = await caches.open('travel-talk-vosk')
    return Boolean(await cache.match(url))
  }, MODEL)
  expect(stillStored).toBe(false)
})
