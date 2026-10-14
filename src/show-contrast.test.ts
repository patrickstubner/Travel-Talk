// @vitest-environment happy-dom
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { curveColors } from './components/RepeatFeedback'

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'styles.css'), 'utf8')

const fixture = `
<div class="app show-mode">
  <a class="skip" href="#inhalt">Zum Inhalt</a>
  <header class="top">
    <p class="brand">Travel Talk</p>
    <p class="version">Version 0.9.8</p>
  </header>
  <div class="top-switch">
    <button type="button" class="top-trigger">Vietnamesisch</button>
    <div class="top-menu">
      <div class="choice-grid">
        <button type="button">Deutsch</button>
        <button type="button" aria-pressed="true">Vietnamesisch</button>
      </div>
      <form>
        <label>Umbenennen<input value="Ana" /></label>
      </form>
      <p role="alert">Der Name braucht ein sichtbares Zeichen.</p>
      <p class="hint">Eine von zehn.</p>
      <p class="hint person-shared">Gemeinsam, nicht pro Person kopiert.</p>
      <button type="button" class="button clay">Person löschen</button>
    </div>
  </div>
  <div class="layout">
    <nav class="nav">
      <a href="#/">Heute</a>
      <a href="#/lookup">Nachschlagen</a>
      <a href="#/show" aria-current="page">Zeigen</a>
      <a href="#/settings">Einstellungen</a>
    </nav>
    <main id="inhalt">
      <section class="stack show">
        <div class="for-other-row">
          <p class="for-other">Für die andere Person</p>
          <button type="button" class="info-button" aria-label="Erklärungen">i</button>
        </div>
        <p class="show-purpose">Zeigen stellt einen Satz gross auf den Bildschirm.</p>
        <p class="warn" role="status">Stimme offline nicht geladen</p>
        <p class="badge">Notfall</p>
        <article class="card"><a href="#card">Karte</a></article>
        <div class="karaoke-block">
          <h1>
            <span class="karaoke">
              <button type="button">Xin</button>
              <button type="button" class="now">chào</button>
              <button type="button" aria-pressed="true">bạn</button>
            </span>
          </h1>
          <p class="placeholder-line"><mark class="slot">[tên]</mark></p>
          <p class="gloss word-gloss">
            <span class="karaoke"><button type="button">Hello</button></span>
          </p>
          <p class="hint">Die Wortzuordnung ist nicht geprüft.</p>
        </div>
        <p class="note">Erdnüsse</p>
        <div class="row">
          <button type="button">Zurück</button>
          <button type="button" class="play-row" aria-pressed="true"><span class="play-mark"></span>Läuft</button>
          <p class="speed-now">Tempo 100 %</p>
          <button type="button" aria-pressed="true">Bedeutung ausblenden</button>
        </div>
        <label>Situationen<select><option>Apotheke</option></select></label>
        <p><a href="#phrase">Zurück zum Satz</a></p>
        <details open>
          <summary>Details</summary>
          <p>Mehr zum Satz.</p>
        </details>
        <section class="pitch">
          <h2 class="repeat-word">nhà</h2>
          <div class="repeat-words">
            <button type="button" class="word-chip plain">nhà<span class="word-marks"><span class="mark plain">Melodie</span><span class="mark plain">Rhythmus</span></span></button>
            <button type="button" class="word-chip green">thuốc<span class="word-marks"><span class="mark green">Melodie</span></span></button>
            <button type="button" class="word-chip yellow">ở</button>
            <button type="button" class="word-chip red">đâu</button>
          </div>
          <p role="status">Zu leise. Geh näher ans Mikrofon und sprich noch einmal.</p>
          <p class="score-bar">
            <span>Melodie</span>
            <span class="score-track passt" aria-hidden="true"><span class="score-fill"></span></span>
            <span>passt</span>
          </p>
          <p class="score-bar">
            <span>Rhythmus</span>
            <span class="score-track daneben" aria-hidden="true"><span class="score-fill"></span></span>
            <span>daneben</span>
          </p>
          <div class="tone-grid">
            <p class="tone-tile"><strong>ngang</strong><span>eben</span></p>
            <p class="tone-tile on"><strong>sắc</strong><span>steigend</span></p>
          </div>
          <article class="card pad tone-you"><p>Du</p></article>
        </section>
      </section>
    </main>
  </div>
</div>`

type RGB = [number, number, number]

function channel(value: string): number {
  const number = Number(value)
  if (value.endsWith('%')) return (number / 100) * 255
  return number
}

function parseColor(value: string): { rgb: RGB; alpha: number } | null {
  const text = value.trim().toLowerCase()
  if (text === 'transparent') return { rgb: [0, 0, 0], alpha: 0 }
  const hex = text.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/)
  if (hex) {
    const raw = hex[1].length === 3 ? hex[1].split('').map((part) => part + part).join('') : hex[1]
    const bits = Number.parseInt(raw, 16)
    return { rgb: [(bits >> 16) & 255, (bits >> 8) & 255, bits & 255], alpha: 1 }
  }
  const rgb = text.match(/^rgba?\(\s*([-\d.]+%?)[,\s]+([-\d.]+%?)[,\s]+([-\d.]+%?)(?:[,\s/]+([-\d.]+%?))?\s*\)$/)
  if (!rgb) return null
  const alpha = rgb[4] == null ? 1 : rgb[4].endsWith('%') ? channel(rgb[4]) / 255 : Number(rgb[4])
  return { rgb: [channel(rgb[1]), channel(rgb[2]), channel(rgb[3])], alpha }
}

function linear(channelValue: number): number {
  const unit = channelValue / 255
  return unit <= 0.04045 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4
}

function luminance(rgb: RGB): number {
  return 0.2126 * linear(rgb[0]) + 0.7152 * linear(rgb[1]) + 0.0722 * linear(rgb[2])
}

function contrast(foreground: RGB, background: RGB): number {
  const lighter = Math.max(luminance(foreground), luminance(background))
  const darker = Math.min(luminance(foreground), luminance(background))
  return (lighter + 0.05) / (darker + 0.05)
}

function blend(foreground: RGB, background: RGB, alpha: number): RGB {
  return [
    foreground[0] * alpha + background[0] * (1 - alpha),
    foreground[1] * alpha + background[1] * (1 - alpha),
    foreground[2] * alpha + background[2] * (1 - alpha),
  ]
}

function effectiveBackground(element: Element): RGB {
  let node: Element | null = element
  let composed: RGB = [20, 24, 28]
  const layers: { rgb: RGB; alpha: number }[] = []
  while (node) {
    const parsed = parseColor(getComputedStyle(node).backgroundColor)
    if (parsed && parsed.alpha > 0) layers.push(parsed)
    if (parsed && parsed.alpha >= 1) break
    node = node.parentElement
  }
  for (const layer of layers.reverse()) composed = blend(layer.rgb, composed, layer.alpha)
  return composed
}

function minimumRatio(element: Element): number {
  const style = getComputedStyle(element)
  const size = Number.parseFloat(style.fontSize)
  const weight = Number.parseInt(style.fontWeight, 10)
  const bold = style.fontWeight === 'bold' || weight >= 700
  const large = size >= 24 || (bold && size >= 18.67)
  return large ? 3 : 4.5
}

function mount(width: number): void {
  document.head.querySelectorAll('style').forEach((node) => node.remove())
  document.body.replaceChildren()
  const style = document.createElement('style')
  style.textContent = css
  document.head.appendChild(style)
  const parsed = new DOMParser().parseFromString(fixture, 'text/html')
  document.body.replaceChildren(...parsed.body.childNodes)
  const browser = window as unknown as { happyDOM: { setViewport: (viewport: { width: number; height: number }) => void } }
  browser.happyDOM.setViewport({ width, height: 900 })
}

function checkText(selector: string): void {
  const element = document.querySelector(selector)
  expect(element, selector).toBeTruthy()
  if (!element) return
  const parsed = parseColor(getComputedStyle(element).color)
  expect(parsed, `${selector} color`).toBeTruthy()
  if (!parsed) return
  const background = effectiveBackground(element)
  const ratio = contrast(parsed.rgb, background)
  const minimum = minimumRatio(element)
  expect(luminance(background), `${selector} background`).toBeLessThanOrEqual(0.18)
  expect(luminance(parsed.rgb), `${selector} foreground`).toBeGreaterThanOrEqual(0.45)
  expect(ratio, `${selector} contrast ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(minimum)
}

describe('show mode contrast', () => {
  it('keeps show-page, top bar, and nav text at WCAG AA on a dark surface', () => {
    mount(1280)
    const selectors = [
      '.skip',
      '.brand',
      '.version',
      '.top-trigger',
      '.choice-grid button',
      '.choice-grid button[aria-pressed="true"]',
      '.top-menu input',
      '.top-menu [role="alert"]',
      '.top-menu .hint',
      '.person-shared',
      '.button.clay',
      '.nav a:not([aria-current="page"])',
      '.nav a[aria-current="page"]',
      '.for-other',
      '.info-button',
      '.show-purpose',
      '.warn',
      '.badge',
      '.card a',
      '.show h1 .karaoke button',
      '.show h1 .karaoke button.now',
      '.show h1 .karaoke button[aria-pressed="true"]',
      '.slot',
      '.word-gloss .karaoke button',
      '.karaoke-block .hint',
      '.note',
      '.row > button',
      '.play-row',
      '.speed-now',
      '.row > button[aria-pressed="true"]',
      'select',
      '.show > p a',
      'summary',
      'details > p',
      '.repeat-word',
      '.pitch [role="status"]',
      '.word-chip.plain',
      '.word-chip.plain .mark.plain',
      '.word-chip.green .mark.green',
      '.word-chip',
      '.word-chip.green',
      '.word-chip.yellow',
      '.word-chip.red',
      '.score-bar > span:first-child',
      '.score-bar > span:last-child',
      '.tone-tile strong',
      '.tone-tile span',
      '.tone-tile.on strong',
      '.tone-tile.on span',
      '.tone-you p',
    ]
    for (const selector of selectors) checkText(selector)
    const gold = parseColor(getComputedStyle(document.querySelector('.show-mode') as Element).getPropertyValue('--gold').trim() || '')
    expect(gold, 'focus gold').toBeTruthy()
    if (!gold) return
    for (const surface of ['#14181c', '#24303a', '#0e6b66'] as const) {
      const background = parseColor(surface)
      if (!background) continue
      const ratio = contrast(gold.rgb, background.rgb)
      expect(ratio, `focus on ${surface}`).toBeGreaterThanOrEqual(3)
    }
  })

  it('uses a dark navigation bar at 360px', () => {
    mount(360)
    const nav = document.querySelector('.nav')
    expect(nav).toBeTruthy()
    if (!nav) return
    const background = parseColor(getComputedStyle(nav).backgroundColor)
    expect(background?.alpha).toBe(1)
    if (!background) return
    expect(luminance(background.rgb)).toBeLessThanOrEqual(0.18)
    checkText('.nav a[aria-current="page"]')
    checkText('.nav a:not([aria-current="page"])')
  })

  it('keeps the pitch curve readable on a dark wash and unchanged on a light page', () => {
    for (const band of [null, 'green', 'yellow', 'red'] as const) {
      const colors = curveColors(true, band)
      const wash = parseColor(colors.wash)
      expect(wash, band ?? 'plain').toBeTruthy()
      if (!wash) continue
      expect(luminance(wash.rgb), colors.wash).toBeLessThanOrEqual(0.18)
      for (const line of [colors.model, colors.you, colors.guide]) {
        const stroke = parseColor(line)
        expect(stroke, line).toBeTruthy()
        if (!stroke) continue
        const ratio = contrast(stroke.rgb, wash.rgb)
        expect(ratio, `${line} on ${colors.wash}`).toBeGreaterThanOrEqual(3)
      }
    }
    const light = curveColors(false, null)
    expect(light).toEqual({ wash: '#fffaf3', model: '#0e6b66', you: '#9c3b2e', guide: '#e2d5c3' })
    expect(curveColors(false, 'red').wash).toBe('#f8e4df')
    expect(curveColors(false, 'yellow').wash).toBe('#f8efd8')
    expect(curveColors(false, 'green').wash).toBe('#e7f4ee')
  })

  it('keeps the info button, the sheet and the record button at WCAG AA on a light page', () => {
    document.head.querySelectorAll('style').forEach((node) => node.remove())
    document.body.replaceChildren()
    const style = document.createElement('style')
    style.textContent = css
    document.head.appendChild(style)
    const parsed = new DOMParser().parseFromString(
      `<main>
        <div class="learn-card">
          <h1>Could you write that down, please?</h1>
          <p class="gloss">Kannst du das aufschreiben?</p>
          <button type="button" class="info-button">i</button>
        </div>
        <button type="button" class="button accent">Aufnehmen</button>
        <div class="info-sheet">
          <h2>Zum Satz</h2>
          <p>Das Mikrofon bleibt auf diesem Gerät.</p>
          <button type="button" class="button">Vorlesen</button>
        </div>
      </main>`,
      'text/html',
    )
    document.body.replaceChildren(...parsed.body.childNodes)
    for (const selector of ['.learn-card h1', '.learn-card .gloss', '.info-button', '.button.accent', '.info-sheet h2', '.info-sheet p', '.info-sheet .button']) {
      const element = document.querySelector(selector)
      expect(element, selector).toBeTruthy()
      if (!element) continue
      const parsed = parseColor(getComputedStyle(element).color)
      expect(parsed, selector).toBeTruthy()
      if (!parsed) continue
      const ratio = contrast(parsed.rgb, effectiveBackground(element))
      expect(ratio, `${selector} ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(minimumRatio(element))
    }
  })
})
