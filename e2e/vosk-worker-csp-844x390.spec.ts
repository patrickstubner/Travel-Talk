import { expect, test, type Page } from '@playwright/test'

test.use({ serviceWorkers: 'allow' })

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

async function waitForServiceWorker(page: Page): Promise<void> {
  await page.waitForFunction(async () => {
    if (!('serviceWorker' in navigator)) return false
    const ready = await navigator.serviceWorker.ready
    return Boolean(ready.active)
  })
  const hasController = await page.evaluate(() => Boolean(navigator.serviceWorker.controller))
  if (!hasController) {
    await page.reload()
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
  }
}

test('worker CSP is set and the German model loads at 844x390 with the service worker', async ({ page }) => {
  test.setTimeout(180_000)
  await openGermanPhrase(page)
  await waitForServiceWorker(page)

  const header = await page.evaluate(async () => {
    const response = await fetch(new URL('vosk-worker.js', document.baseURI))
    return {
      ok: response.ok,
      csp: response.headers.get('Content-Security-Policy'),
    }
  })
  expect(header.ok).toBe(true)
  expect(header.csp).toContain("script-src 'wasm-unsafe-eval'")
  expect(header.csp).toContain("connect-src 'none'")
  expect(header.csp).toContain("default-src 'none'")
  expect(header.csp?.includes("script-src 'unsafe-eval'")).toBe(false)

  const offer = page.getByTestId('speech-offer')
  await expect(offer).toBeVisible()
  await page.getByTestId('speech-load').click()
  const progress = page.getByTestId('speech-progress')
  await expect(progress).toBeVisible()
  await expect(page.getByTestId('speech-cancel')).toBeVisible()
  await expect(progress).toHaveCount(0, { timeout: 120_000 })
  await expect(page.getByTestId('speech-fallback')).toHaveCount(0)
})
