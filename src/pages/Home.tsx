import { Link } from 'react-router-dom'
import type { Lang } from '../../content/phrase'
import { conceptsForSituation } from '../content/resolve'
import { PAIRS, pairById } from '../domain/pairs'
import { dueConcepts } from '../srs/session'
import { LANG_LABEL } from '../app/labels'
import { useApp } from '../app/state'
import { useCopy, useSettings } from '../app/use-copy'

export function HomePage() {
  const { catalog, snapshot, saveSettings } = useApp()
  const settings = useSettings()
  const copy = useCopy()
  if (!catalog || !snapshot) return null
  const ui = settings.uiLang === 'source' && settings.pairId ? (pairById(settings.pairId)?.source ?? 'de') : 'de'
  const pair = pairById(settings.pairId)
  const due = pair ? dueConcepts(catalog.concepts, snapshot.cards, pair.id, new Date()).length : 0

  return (
    <div className="stack">
      <p className="banner">{copy.uncheckedBanner}</p>
      <section>
        <h1>{copy.pairTitle}</h1>
        <p>{copy.pairLead}</p>
        <div className="pair-list" data-testid="pair-list">
          {PAIRS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="pair-button"
              data-testid={`pair-${item.id}`}
              aria-pressed={settings.pairId === item.id}
              onClick={() => void saveSettings({ ...settings, pairId: item.id })}
            >
              {LANG_LABEL[item.source][ui]} → {LANG_LABEL[item.target][ui]}
            </button>
          ))}
        </div>
      </section>
      {pair ? (
        <section className="stack">
          <p>{copy.due(due)}</p>
          <div className="row">
            <Link className="button" to="/practice">
              {copy.practiceNow}
            </Link>
            <Link className="button clay" to="/show">
              {copy.showEmergency}
            </Link>
          </div>
          <h2>{copy.situations}</h2>
          <ul className="cards">
            {catalog.situations
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((situation) => {
                const count = conceptsForSituation(catalog, situation.id).length
                return (
                  <li key={situation.id} className={situation.id === 'emergency' ? 'card emergency' : 'card'}>
                    <Link to={`/situation/${situation.id}`} data-testid={situation.id === 'emergency' ? 'situation-emergency' : undefined}>
                      <span className="depth">{copy.depth[situation.depth]}</span>
                      <strong>{situation.title[ui as Lang]}</strong>
                      <span>{situation.summary[ui as Lang]}</span>
                      <span className="count">{copy.phrases(count)}</span>
                    </Link>
                  </li>
                )
              })}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
