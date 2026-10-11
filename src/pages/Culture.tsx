import { Link, useParams } from 'react-router-dom'
import type { Lang } from '../../content/phrase'
import { interfaceLang } from '../app/labels'
import { useApp } from '../app/state'
import { useCopy, useSettings } from '../app/use-copy'

export function CulturePage() {
  const { noteId } = useParams()
  const { catalog } = useApp()
  const settings = useSettings()
  const copy = useCopy()
  const ui = interfaceLang(settings)
  if (!catalog) return null
  const note = catalog.cultureNotes.find((item) => item.id === noteId)
  if (!noteId || !note) {
    return (
      <section className="stack" data-testid="culture">
        <h1>{copy.cultureTitle}</h1>
        <p>{copy.cultureLead}</p>
        <ul className="cards">
          {catalog.cultureNotes.map((item) => (
            <li key={item.id} className="card">
              <Link to={`/culture/${item.id}`}>
                <strong>{item.title[ui]}</strong>
                <span>{item.regions.join(', ')}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    )
  }
  return (
    <article className="stack culture" data-testid="culture">
      <p>
        <Link to="/culture">{copy.back}</Link>
      </p>
      <h1>{note.title[ui]}</h1>
      <p className="hint">{note.regions.join(' · ')}</p>
      <p className="prose">{note.body[ui as Lang]}</p>
      <p className="hint">{copy.uncheckedCalm}</p>
      <h2>{copy.sources}</h2>
      <ul>
        {note.sources.map((source) => (
          <li key={source.url}>
            <a href={source.url} rel="noreferrer noopener">
              {source.title}
            </a>
            <span>
              {' '}
              · {copy.accessed} {source.accessed}
            </span>
          </li>
        ))}
      </ul>
    </article>
  )
}
