import { useEffect, useRef } from 'react'
import type { Dictionary } from '../i18n/dictionary'
import { describeShape, dtwDistance, voicedValues, type Contour } from '../pitch/contour'

function draw(canvas: HTMLCanvasElement, model: Contour, user: Contour): void {
  const context = canvas.getContext('2d')
  if (!context) return
  const width = canvas.width
  const height = canvas.height
  context.clearRect(0, 0, width, height)
  context.fillStyle = '#fffaf3'
  context.fillRect(0, 0, width, height)
  context.strokeStyle = '#e2d5c3'
  context.lineWidth = 1
  context.beginPath()
  context.moveTo(0, height / 2)
  context.lineTo(width, height / 2)
  context.stroke()
  stroke(context, model, '#0e6b66', width, height)
  stroke(context, user, '#9c3b2e', width, height)
}

function stroke(context: CanvasRenderingContext2D, contour: Contour, color: string, width: number, height: number): void {
  const voiced = contour.some((value) => value != null)
  if (!voiced) return
  context.strokeStyle = color
  context.lineWidth = 3
  context.beginPath()
  let started = false
  contour.forEach((value, index) => {
    if (value == null) {
      started = false
      return
    }
    const x = (index / Math.max(1, contour.length - 1)) * (width - 16) + 8
    const y = height / 2 - (value / 8) * (height / 2 - 12)
    if (!started) {
      context.moveTo(x, y)
      started = true
    } else context.lineTo(x, y)
  })
  context.stroke()
}

export function PitchPanel({
  model,
  user,
  copy,
  modelMissing,
}: {
  model: Contour
  user: Contour
  copy: Dictionary
  modelMissing: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const modelShape = describeShape(model)
  const userShape = describeShape(user)
  const distance = dtwDistance(voicedValues(model), voicedValues(user))
  const modelReady = voicedValues(model).length > 0
  const userReady = voicedValues(user).length > 0

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    draw(canvas, model, user)
  }, [model, user])

  return (
    <section className="pitch" aria-label={copy.pitchTitle}>
      <h2>{copy.pitchTitle}</h2>
      <p className="warn">{copy.pitchCaveat}</p>
      <p className="legend">
        <span className="swatch model">{copy.pitchModel}</span>
        <span className="swatch you">{copy.pitchYou}</span>
      </p>
      <canvas ref={canvasRef} data-testid="pitch-canvas" width={640} height={220} className="pitch-canvas" />
      {modelMissing ? <p>{copy.pitchNoModel}</p> : null}
      {modelReady ? (
        <p data-testid="model-ready">
          {copy.pitchModel}: {copy.shape[modelShape]}
        </p>
      ) : null}
      {userReady ? (
        <p data-testid="user-ready">
          {copy.pitchYou}: {copy.shape[userShape]}
        </p>
      ) : null}
      {user.length > 0 && !userReady ? <p>{copy.pitchEmpty}</p> : null}
      {distance != null ? <p>{distance < 0.8 ? copy.shape.similar : copy.shape.apart}</p> : null}
    </section>
  )
}
