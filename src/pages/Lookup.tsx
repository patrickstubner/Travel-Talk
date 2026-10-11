import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { resolvePlayback } from '../content/resolve'
import { interfaceLang } from '../app/labels'
import { useApp } from '../app/state'
import { useCopy, useSettings } from '../app/use-copy'
import { currentDirection } from '../srs/session'
import { prefsFromSettings } from '../storage/types'
import { RichText } from '../components/RichText'

export function LookupPage() {
  const { catalog } = useApp()
  const settings = useSettings()
  const copy = useCopy()
  const ui = interfaceLang(settings)
  const [query, setQuery] = useState('')
  const direction = currentDirection(settings.appLang, settings.targetLang)
  const hits = useMemo(() => {
    if (!catalog || !settings.appLang || !settings.targetLang || !query.trim()) return []
    const needle = query.trim().toLocaleLowerCase()
    return catalog.concepts.filter((concept) => {
      const source = resolvePlayback(concept, settings.appLang ?? 'de', settings.viRegion, prefsFromSettings(settings.appLang ?? 'de', settings))
      const target = resolvePlayback(concept, settings.targetLang ?? 'vi', settings.viRegion, prefsFromSettings(settings.targetLang ?? 'vi', settings))
      const blob = `${source?.text ?? ''} ${target?.text ?? ''} ${concept.context[ui]}`.toLocaleLowerCase()
      return blob.includes(needle)
    })
  }, [catalog, query, settings, ui])
  if (!catalog) return null
  if (!direction || !settings.appLang || !settings.targetLang) return <p>{copy.needPair}</p>
  const app = settings.appLang
  const targetLang = settings.targetLang

  return (
    <div className="stack" data-testid="lookup">
      <h1>{copy.lookupTitle}</h1>
      <p>{copy.lookupHint}</p>
      <label>
        {copy.search}
        <input value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {query.trim() && hits.length === 0 ? <p>{copy.noResults}</p> : null}
      {hits.length > 0 ? (
        <ul className="phrase-list">
          {hits.map((concept) => {
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
      ) : null}
      <ul className="cards">
        {catalog.situations.map((situation) => (
          <li key={situation.id} className="card">
            <Link to={`/situation/${situation.id}`}>
              <strong>{situation.title[ui]}</strong>
              <span>{situation.summary[ui]}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p>
        <Link to="/culture">{copy.cultureTitle}</Link>
      </p>
      <p className="hint">{copy.uncheckedCalm}</p>
    </div>
  )
}
