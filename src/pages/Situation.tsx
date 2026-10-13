import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { conceptsForSituation, isStale, resolvePlayback } from '../content/resolve'
import { interfaceLang } from '../app/labels'
import { useApp } from '../app/state'
import { useCopy, useSettings } from '../app/use-copy'
import { prefsFromSettings } from '../storage/types'
import { infoCardParts } from '../audio/notes'
import { InfoButton } from '../components/InfoButton'
import { RichText } from '../components/RichText'

export function SituationPage() {
  const { situationId = '' } = useParams()
  const { catalog } = useApp()
  const settings = useSettings()
  const copy = useCopy()
  const [query, setQuery] = useState('')
  const ui = interfaceLang(settings)
  const app = settings.appLang
  const targetLang = settings.targetLang
  const situation = catalog?.situations.find((item) => item.id === situationId)
  const concepts = useMemo(() => (catalog ? conceptsForSituation(catalog, situationId) : []), [catalog, situationId])
  if (!catalog || !situation) return <p>{copy.noResults}</p>
  if (!app || !targetLang) return <p>{copy.needPair}</p>

  const needle = query.trim().toLocaleLowerCase()
  const visible = concepts.filter((concept) => {
    if (!needle) return true
    const source = resolvePlayback(concept, app, settings.viRegion, prefsFromSettings(app, settings))
    const target = resolvePlayback(concept, targetLang, settings.viRegion, prefsFromSettings(targetLang, settings))
    const blob = `${source?.text ?? ''} ${target?.text ?? ''} ${concept.context[ui]}`.toLocaleLowerCase()
    return blob.includes(needle)
  })
  const notes = catalog.cultureNotes.filter((note) => note.situationIds.includes(situationId))
  const cards = catalog.infoCards.filter((card) => card.situationId === situationId)

  return (
    <div className="stack" data-testid={situationId === 'emergency' ? 'situation-emergency' : 'situation-page'}>
      <p>
        <Link to="/lookup">{copy.back}</Link>
      </p>
      <h1>{situation.title[ui]}</h1>
      <p>{situation.summary[ui]}</p>
      <label>
        {copy.search}
        <input value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {visible.length === 0 ? <p>{copy.noResults}</p> : null}
      <ul className="phrase-list">
        {visible.map((concept) => {
          const target = resolvePlayback(concept, targetLang, settings.viRegion, prefsFromSettings(targetLang, settings))
          const source = resolvePlayback(concept, app, settings.viRegion, prefsFromSettings(app, settings))
          return (
            <li key={concept.id}>
              <Link to={`/phrase/${concept.id}`}>
                <strong>
                  <RichText text={target?.text ?? concept.id} />
                </strong>
                <span>
                  <RichText text={source?.text ?? ''} />
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
      {notes.length > 0 ? (
        <section>
          <h2>{copy.cultureForSituation}</h2>
          <ul>
            {notes.map((note) => (
              <li key={note.id}>
                <Link to={`/culture/${note.id}`}>{note.title[ui]}</Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {cards.map((card) => (
        <article key={card.id} className="card info-card">
          <div className="info-card-head">
            <h2>{card.title[ui]}</h2>
            <InfoButton
              label={copy.infoOpen}
              title={card.title[ui]}
              closeLabel={copy.infoClose}
              readLabel={copy.readAloud}
              stopLabel={copy.readAloudStop}
              lang={ui}
              parts={infoCardParts(copy, ui, card)}
            />
          </div>
          {isStale(card.checkedAt, new Date()) ? <p className="warn">{copy.infoStale}</p> : null}
        </article>
      ))}
    </div>
  )
}
