import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Concept } from '../../content/phrase'
import { resolvePlayback } from '../content/resolve'
import { pairById } from '../domain/pairs'
import { playClip } from '../audio/player'
import { useApp } from '../app/state'
import { useCopy, useSettings } from '../app/use-copy'
import { RichText } from '../components/RichText'
import { Rating, emptyCard, fromStored, reviewCard, toStored, type Grade } from '../srs/scheduler'
import { buildSession, cardIdFor, distractorConcepts } from '../srs/session'
import { prefsFromSettings } from '../storage/types'

type Mode = 'listen' | 'recall'

export function PracticePage() {
  const { catalog, snapshot, saveCard } = useApp()
  const settings = useSettings()
  const copy = useCopy()
  const pair = pairById(settings.pairId)
  const [mode, setMode] = useState<Mode>('listen')
  const [queue, setQueue] = useState<Concept[]>([])
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [scratch, setScratch] = useState('')
  const [choices, setChoices] = useState<Concept[]>([])
  const [sessionFor, setSessionFor] = useState<string | null>(null)

  useEffect(() => {
    if (!catalog || !snapshot || !pair) return
    if (sessionFor === pair.id) return
    setSessionFor(pair.id)
    setQueue(buildSession(catalog.concepts, snapshot.cards, pair.id, new Date()))
    setIndex(0)
    setPicked(null)
    setRevealed(false)
    setScratch('')
  }, [catalog, pair, sessionFor, snapshot])

  const concept = queue[index]
  useEffect(() => {
    if (!catalog || !concept) return
    const distractors = distractorConcepts(concept, catalog.concepts, 3)
    const mixed = [concept, ...distractors]
    for (let i = mixed.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      const left = mixed[i]
      const right = mixed[j]
      if (left && right) {
        mixed[i] = right
        mixed[j] = left
      }
    }
    setChoices(mixed)
    setPicked(null)
    setRevealed(false)
    setScratch('')
  }, [catalog, concept])

  if (!catalog || !snapshot) return null
  if (!pair) return <p>{copy.needPair}</p>
  if (!concept) {
    return (
      <section data-testid="practice">
        <h1>{copy.nav.practice}</h1>
        <p>{copy.sessionEmpty}</p>
        <Link to="/">{copy.back}</Link>
      </section>
    )
  }

  const source = resolvePlayback(concept, pair.source, settings.viRegion, prefsFromSettings(pair.source, settings))
  const target = resolvePlayback(concept, pair.target, settings.viRegion, prefsFromSettings(pair.target, settings))

  async function rate(grade: Grade): Promise<void> {
    if (!snapshot || !pair || !concept) return
    const cardId = cardIdFor(pair.id, concept.id)
    const stored = snapshot.cards.find((card) => card.cardId === cardId)
    const now = new Date()
    const card = stored ? fromStored(stored) : emptyCard(now)
    const next = reviewCard(card, grade, now, snapshot.settings.retention, true)
    await saveCard(toStored(cardId, next))
  }

  function nextItem(): void {
    setIndex((value) => value + 1)
  }

  return (
    <section className="stack" data-testid="practice">
      <h1>{copy.nav.practice}</h1>
      <p>{copy.progress(index + 1, queue.length)}</p>
      <div className="row" role="tablist">
        <button type="button" aria-pressed={mode === 'listen'} onClick={() => setMode('listen')}>
          {copy.listen}
        </button>
        <button type="button" aria-pressed={mode === 'recall'} onClick={() => setMode('recall')}>
          {copy.recall}
        </button>
      </div>
      {mode === 'listen' && target ? (
        <div className="stack">
          <p>{copy.listenPrompt}</p>
          <button type="button" className="button" onClick={() => void playClip(target.file, target.speech, pair.target)}>
            {copy.play}
          </button>
          <ul className="choices">
            {choices.map((choice) => {
              const line = resolvePlayback(choice, pair.source, settings.viRegion, prefsFromSettings(pair.source, settings))
              const correct = choice.id === concept.id
              return (
                <li key={choice.id}>
                  <button
                    type="button"
                    disabled={picked != null}
                    onClick={() => {
                      setPicked(choice.id)
                      void rate(correct ? Rating.Good : Rating.Again)
                    }}
                  >
                    <RichText text={line?.text ?? choice.id} />
                  </button>
                </li>
              )
            })}
          </ul>
          {picked != null ? (
            <p>{picked === concept.id ? copy.correct : copy.wrong}</p>
          ) : null}
          {picked != null && picked !== concept.id && source ? (
            <p>
              <RichText text={source.text} />
            </p>
          ) : null}
          {picked != null ? (
            <button type="button" className="button" onClick={nextItem}>
              {copy.next}
            </button>
          ) : null}
        </div>
      ) : null}
      {mode === 'recall' && source && target ? (
        <div className="stack">
          <p>{copy.recallPrompt}</p>
          <p className="prompt">
            <RichText text={source.text} />
          </p>
          <label>
            {copy.scratch}
            <textarea value={scratch} onChange={(event) => setScratch(event.target.value)} maxLength={400} />
          </label>
          {revealed ? (
            <div className="stack">
              <p className="prompt">
                <RichText text={target.text} />
              </p>
              <button type="button" onClick={() => void playClip(target.file, target.speech, pair.target)}>
                {copy.play}
              </button>
              <div className="row">
                {(
                  [
                    [Rating.Again, copy.again],
                    [Rating.Hard, copy.hard],
                    [Rating.Good, copy.good],
                    [Rating.Easy, copy.easy],
                  ] as const
                ).map(([grade, label]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      void rate(grade).then(nextItem)
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button type="button" className="button" onClick={() => setRevealed(true)}>
              {copy.reveal}
            </button>
          )}
        </div>
      ) : null}
    </section>
  )
}
