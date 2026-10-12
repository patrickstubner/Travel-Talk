import { useState } from 'react'
import type { WordLink } from '../../content/gloss'
import { splitWords } from '../../content/gloss'
import { currentWordIndex, type WordTime } from '../audio/align'
import { hasPlaceholder, RichText } from './RichText'

function indexesFor(links: readonly WordLink[], side: 'target' | 'gloss', index: number): number | null {
  const found = links.findIndex((link) => link[side].includes(index))
  return found >= 0 ? found : null
}

function WordRow({
  words,
  side,
  links,
  active,
  now,
  onPick,
}: {
  words: string[]
  side: 'target' | 'gloss'
  links: readonly WordLink[]
  active: number | null
  now: number | null
  onPick: (side: 'target' | 'gloss', index: number) => void
}) {
  return (
    <span className="karaoke">
      {words.map((word, index) => {
        const link = indexesFor(links, side, index)
        const pressed = active != null && link === active
        const current = side === 'target' && now === index
        return (
          <button
            key={`${word}-${index}`}
            type="button"
            className={current ? 'now' : undefined}
            aria-pressed={pressed}
            data-testid={current ? 'word-now' : undefined}
            onClick={() => onPick(side, index)}
          >
            {word}
          </button>
        )
      })}
    </span>
  )
}

/**
 * Target words, then the other language underneath.
 * The moving mark follows the audio. A tap marks every linked word on both lines.
 */
export function KaraokeLine({
  speech,
  gloss,
  links,
  times,
  seconds,
  note,
  lang,
  heading = false,
  template,
}: {
  speech: string
  gloss: string | null
  links: readonly WordLink[]
  times: readonly WordTime[] | null
  seconds: number | null
  note?: string
  lang?: string
  heading?: boolean
  /** Written line with a slot such as [tên]. The spoken line stays above it. */
  template?: string
}) {
  const [active, setActive] = useState<number | null>(null)
  const words = splitWords(speech)
  const glossWords = gloss ? splitWords(gloss) : []
  const now = currentWordIndex(times, seconds)
  const row = (
    <WordRow
      words={words}
      side="target"
      links={links}
      active={active}
      now={now}
      onPick={(side, index) => setActive(indexesFor(links, side, index))}
    />
  )
  return (
    <div className="karaoke-block" data-testid="karaoke">
      {heading ? (
        <h1 aria-label={speech} lang={lang} data-testid="target-line">
          {row}
        </h1>
      ) : (
        <p className="target-line" lang={lang} data-testid={heading ? undefined : 'target-line'}>
          {row}
        </p>
      )}
      {template && hasPlaceholder(template) ? (
        <p className="placeholder-line" data-testid="placeholder-line" lang={lang}>
          <RichText text={template} />
        </p>
      ) : null}
      {glossWords.length > 0 ? (
        <p className="gloss word-gloss">
          <WordRow
            words={glossWords}
            side="gloss"
            links={links}
            active={active}
            now={null}
            onPick={(side, index) => setActive(indexesFor(links, side, index))}
          />
        </p>
      ) : null}
      {note ? <p className="hint">{note}</p> : null}
    </div>
  )
}
