import { useEffect, useRef } from 'react'
import { SPEED_STEPS, type SpeedStep } from '../audio/speed'

const KEYS = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End']

/** Slow, 85 % and normal, as one choice. Arrow keys move it. */
export function TempoSwitch({
  value,
  onChange,
  label,
  slow,
  mid,
  normal,
}: {
  value: SpeedStep
  onChange: (next: SpeedStep) => void
  label: string
  slow: string
  mid: string
  normal: string
}) {
  const groupRef = useRef<HTMLDivElement>(null)
  const labels: Record<SpeedStep, string> = { 0.7: slow, 0.85: mid, 1: normal }

  useEffect(() => {
    const group = groupRef.current
    const active = document.activeElement
    if (!group || !active || !group.contains(active)) return
    group.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus()
  }, [value])

  function move(key: string): void {
    const index = SPEED_STEPS.indexOf(value)
    if (key === 'Home') onChange(SPEED_STEPS[0])
    else if (key === 'End') onChange(SPEED_STEPS[SPEED_STEPS.length - 1] ?? 1)
    else if (key === 'ArrowRight' || key === 'ArrowDown') onChange(SPEED_STEPS[(index + 1) % SPEED_STEPS.length] ?? value)
    else if (key === 'ArrowLeft' || key === 'ArrowUp') onChange(SPEED_STEPS[(index - 1 + SPEED_STEPS.length) % SPEED_STEPS.length] ?? value)
  }

  return (
    <div
      ref={groupRef}
      className="tempo-switch"
      role="radiogroup"
      aria-label={label}
      data-testid="learn-tempo"
      onKeyDown={(event) => {
        if (!KEYS.includes(event.key)) return
        event.preventDefault()
        move(event.key)
      }}
    >
      {SPEED_STEPS.map((step) => {
        const on = value === step
        return (
          <button key={step} type="button" role="radio" aria-checked={on} aria-pressed={on} tabIndex={on ? 0 : -1} onClick={() => onChange(step)}>
            {labels[step]}
          </button>
        )
      })}
    </div>
  )
}
