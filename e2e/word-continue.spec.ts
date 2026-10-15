import { expect, test, type Page } from '@playwright/test'

async function openWordRound(page: Page): Promise<void> {
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

/** Replay and Continue share one bar. A scroll must not lay one over the other. */
async function overlapProblems(page: Page): Promise<string[]> {
  return page.evaluate(async () => {
    const bar = document.querySelector('[data-testid="word-actions"]')
    const next = bar?.querySelector('button.primary')
    const play = bar?.querySelector('button.play-row')
    if (!(next instanceof HTMLElement) || !(play instanceof HTMLElement)) return ['missing actions']
    const scroller = document.scrollingElement
    if (!scroller) return ['missing scroller']
    const max = Math.max(0, scroller.scrollHeight - window.innerHeight)
    const stops = new Set([0, max])
    for (let scroll = 0; scroll <= max; scroll += 40) stops.add(scroll)
    const problems: string[] = []
    for (const scroll of [...stops].sort((a, b) => a - b)) {
      scroller.scrollTop = scroll
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })
      const nextBox = next.getBoundingClientRect()
      const playBox = play.getBoundingClientRect()
      const overlap =
        nextBox.x < playBox.x + playBox.width &&
        nextBox.x + nextBox.width > playBox.x &&
        nextBox.y < playBox.y + playBox.height &&
        nextBox.y + nextBox.height > playBox.y
      const hit = document.elementFromPoint(nextBox.left + nextBox.width / 2, nextBox.top + nextBox.height / 2)
      if (overlap || !next.contains(hit)) {
        problems.push(`${Math.round(scroll)} overlap=${overlap} hit=${hit instanceof Element ? hit.className : 'none'}`)
      }
    }
    scroller.scrollTop = 0
    return problems
  })
}

test('word round one Continue tap advances at 844x390 and portrait', async ({ page }) => {
  test.setTimeout(120_000)
  await openWordRound(page)
  for (const viewport of [
    { width: 844, height: 390 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport)
    await page.reload()
    await page.getByTestId('word-intro').waitFor()
    await expect(page.locator('h2.eyebrow').first()).toHaveText('Hören · 1 von 3')
    expect(await overlapProblems(page)).toEqual([])
    await page.getByTestId('word-actions').getByRole('button', { name: 'Weiter', exact: true }).click()
    await expect(page.locator('h2.eyebrow').first()).toHaveText('Hören · 2 von 3')
  }
})
