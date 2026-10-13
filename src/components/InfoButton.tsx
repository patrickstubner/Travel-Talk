import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Lang } from '../../content/phrase'
import { speakExplanation, stopExplanation, type ExplainPart } from '../audio/explain'

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Opens the explanation in a dialog. The page itself stays the line, the translation and the controls.
 * Escape, the backdrop and the close button dismiss it. Tab stays inside.
 */
export function InfoButton({
  label,
  title,
  closeLabel,
  readLabel,
  stopLabel,
  lang,
  parts,
}: {
  label: string
  title: string
  closeLabel: string
  readLabel: string
  stopLabel: string
  lang: Lang
  parts: ExplainPart[]
}) {
  const [open, setOpen] = useState(false)
  const [reading, setReading] = useState(false)
  const token = useRef(0)
  const opener = useRef<HTMLButtonElement>(null)
  const sheet = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const dialogId = useId()

  const close = useCallback(() => {
    token.current += 1
    stopExplanation()
    setReading(false)
    setOpen(false)
    opener.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    const dialog = sheet.current
    dialog?.querySelector<HTMLElement>('[data-info-close]')?.focus()
    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        return
      }
      if (event.key !== 'Tab' || !dialog) return
      const items = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((item) => !item.hasAttribute('disabled'))
      const first = items[0]
      const last = items[items.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [close, open])

  useEffect(() => () => stopExplanation(), [])

  async function read(): Promise<void> {
    if (reading) {
      token.current += 1
      stopExplanation()
      setReading(false)
      return
    }
    const mine = token.current + 1
    token.current = mine
    setReading(true)
    await speakExplanation(lang, parts, token, mine)
    if (token.current === mine) setReading(false)
  }

  return (
    <>
      <button
        ref={opener}
        type="button"
        className="info-button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={dialogId}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <span aria-hidden="true">i</span>
      </button>
      {open
        ? createPortal(
            <div
              className="info-backdrop"
              data-testid="info-backdrop"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) close()
              }}
            >
              <div
                ref={sheet}
                className="info-sheet"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                id={dialogId}
                data-testid="learn-notes"
                onMouseDown={(event) => event.stopPropagation()}
              >
                <div className="info-sheet-bar">
                  <h2 id={titleId}>{title}</h2>
                  <button type="button" data-info-close onClick={close}>
                    {closeLabel}
                  </button>
                </div>
                <div className="info-sheet-body">
              {parts.map((part, index) => (
                <p key={`${part.clip ?? 'text'}-${index}`}>{part.text}</p>
              ))}
                </div>
                <button type="button" className="button" data-testid="read-aloud" onClick={() => void read()}>
                  {reading ? stopLabel : readLabel}
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
