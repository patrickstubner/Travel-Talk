import { expect, test, type Page } from '@playwright/test'

async function startPractice(page: Page): Promise<void> {
  await page.goto('#/')
  await page.getByRole('textbox', { name: 'Wie sollen wir dich nennen?' }).fill('A')
  await page.getByRole('button', { name: 'Weiter', exact: true }).click()
  const board = page.getByTestId('onboarding')
  await board.getByRole('group', { name: 'Sprache der App' }).getByRole('button', { name: 'Deutsch' }).click()
  await board.getByRole('group', { name: 'Sprache, die du lernen willst' }).getByRole('button', { name: 'Vietnamesisch' }).click()
  await page.getByRole('button', { name: 'Weiter zu Heute lernen' }).click()
  await page.getByRole('heading', { name: 'Heute lernen' }).waitFor()
  await page.getByRole('link', { name: 'Heute lernen' }).click()
  await page.getByTestId('word-intro').waitFor()
}

/**
 * The sticky bar must not sit on these buttons at any scroll position.
 * `guard` is the primary button in the bar. Each target must receive its own tap.
 */
async function coverProblems(page: Page, targetSelector: string, guardSelector: string): Promise<string[]> {
  return page.evaluate(
    async ({ targetSelector, guardSelector }) => {
      const targets = [...document.querySelectorAll(targetSelector)].filter((node): node is HTMLElement => node instanceof HTMLElement)
      const guard = document.querySelector(guardSelector)
      if (!(guard instanceof HTMLElement) || targets.length === 0) return [`missing ${targets.length} ${guard instanceof HTMLElement}`]
      const scroller = document.scrollingElement
      if (!scroller) return ['missing scroller']
      const max = Math.max(0, scroller.scrollHeight - window.innerHeight)
      const stops = new Set([0, max])
      for (let scroll = 0; scroll <= max; scroll += 40) stops.add(scroll)
      const problems: string[] = []
      const overlaps = (a: DOMRect, b: DOMRect) =>
        a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
      for (const scroll of [...stops].sort((a, b) => a - b)) {
        scroller.scrollTop = scroll
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        })
        const guardBox = guard.getBoundingClientRect()
        for (const target of targets) {
          const box = target.getBoundingClientRect()
          const label = target.textContent?.trim() || target.className
          if (box.width < 1 || box.height < 1) {
            problems.push(`${Math.round(scroll)} empty ${label}`)
            continue
          }
          const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
          if (overlaps(guardBox, box) || !target.contains(hit)) {
            problems.push(
              `${Math.round(scroll)} ${label} overlap=${overlaps(guardBox, box)} hit=${hit instanceof Element ? hit.className || hit.tagName : 'none'}`,
            )
          }
        }
      }
      scroller.scrollTop = 0
      return problems
    },
    { targetSelector, guardSelector },
  )
}

test('sticky bar leaves the tempo buttons free at 844x390', async ({ page }) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 844, height: 390 })
  await startPractice(page)
  expect(await coverProblems(page, '[data-testid="word-speed"] button', '[data-testid="word-actions"] button.primary')).toEqual([])

  const skip = page.getByTestId('skip-words')
  for (let step = 0; step < 8 && (await skip.count()) === 0; step += 1) {
    await page.getByRole('button', { name: 'Weiter', exact: true }).click()
  }
  await skip.click()
  await expect(page.getByTestId('learn-actions').getByRole('radio', { name: 'Langsam' })).toBeVisible()
  expect(await coverProblems(page, '[data-testid="learn-actions"] .tempo-switch button', '[data-testid="learn-actions"] button.primary')).toEqual([])
})

test('meaning step keeps Anhören in the sticky row at 844x390', async ({ page }) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 844, height: 390 })
  await startPractice(page)
  for (const viewport of [
    { width: 844, height: 390 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport)
    await page.reload()
    await page.getByTestId('word-intro').waitFor()
    const skip = page.getByTestId('skip-words')
    for (let step = 0; step < 8 && (await skip.count()) === 0; step += 1) {
      await page.getByRole('button', { name: 'Weiter', exact: true }).click()
    }
    await skip.click()
    await page.getByRole('button', { name: 'Weiter', exact: true }).click()
    await page.getByRole('button', { name: 'Weiter', exact: true }).click()
    await expect(page.getByText('Was bedeutet der Satz?')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Anhören' })).toBeVisible()
    await expect(page.getByTestId('meaning-actions')).toHaveCount(0)
    await page.locator('.choices button').first().click()
    const bar = page.getByTestId('meaning-actions')
    const play = bar.getByRole('button', { name: 'Anhören' })
    const next = bar.getByRole('button', { name: 'Weiter', exact: true })
    await expect(play).toBeVisible()
    await expect(next).toBeVisible()
    const playBox = await play.boundingBox()
    const nextBox = await next.boundingBox()
    expect(playBox).toBeTruthy()
    expect(nextBox).toBeTruthy()
    expect(Math.abs(playBox!.y - nextBox!.y)).toBeLessThan(8)
    expect(playBox!.x + playBox!.width).toBeLessThanOrEqual(nextBox!.x + 1)
    expect(await coverProblems(page, '[data-testid="meaning-actions"] button.play-row', '[data-testid="meaning-actions"] button.primary')).toEqual([])
    await next.click()
    await expect(page.getByRole('heading', { name: 'Wie sagst du das?' })).toBeVisible()
  }
})
