import { SPEED_STEPS, type SpeedStep } from '../audio/speed'

export function WordTempoControl({
  chosen,
  title,
  hint,
  slow,
  mid,
  full,
  onPick,
}: {
  chosen: SpeedStep
  title: string
  hint: string
  slow: string
  mid: string
  full: string
  onPick: (step: SpeedStep) => void
}) {
  const label = (option: SpeedStep) => (option === 0.7 ? slow : option === 0.85 ? mid : full)
  return (
    <fieldset className="speed" data-testid="word-speed">
      <legend>{title}</legend>
      <div className="row" role="group" aria-label={title}>
        {SPEED_STEPS.map((option) => (
          <button key={option} type="button" aria-pressed={chosen === option} onClick={() => onPick(option)}>
            {label(option)}
          </button>
        ))}
      </div>
      <p className="hint">{hint}</p>
    </fieldset>
  )
}
