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
  await page.getByTestId('practice-word').waitFor()
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

test('new word shows the meaning question at once at 844x390 and portrait', async ({ page }) => {
  test.setTimeout(120_000)
  await openWordRound(page)
  for (const viewport of [
    { width: 844, height: 390 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport)
    await page.reload()
    await page.getByTestId('practice-word').waitFor()
    await expect(page.getByRole('heading', { name: 'Was bedeutet das Wort?' })).toBeVisible()
    await expect(page.getByTestId('word-intro')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Weiter', exact: true })).toHaveCount(0)
    await expect(page.getByTestId('skip-words')).toBeVisible()
    await expect(page.getByTestId('target-line')).toBeVisible()
    await expect(page.getByTestId('word-ipa')).toBeVisible()
    await expect(page.getByTestId('word-speed')).toBeVisible()
    await expect(page.locator('[data-testid="practice-word"] button.play-row')).toHaveText(/Noch einmal hören/)
    await expect(page.locator('.choices button').first()).toBeVisible()
    await page.locator('.choices button').first().click()
    await page.getByTestId('word-actions').waitFor()
    expect(await overlapProblems(page)).toEqual([])
  }
})
