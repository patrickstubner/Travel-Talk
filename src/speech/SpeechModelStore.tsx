import type { Lang } from '../../content/phrase'
import { LANG_LABEL } from '../app/labels'
import type { Dictionary } from '../i18n/dictionary'
import { speechMegabytes } from './vosk'

/** Stored recognisers, each with its size, and a way to drop that archive. */
export function SpeechModelStore({
  copy,
  uiLang,
  models,
  onDelete,
}: {
  copy: Dictionary
  uiLang: Lang
  models: ReadonlyArray<{ lang: Lang; bytes: number }>
  onDelete: (lang: Lang) => void
}) {
  if (models.length === 0) return null
  return (
    <section className="card stack" data-testid="speech-models" aria-labelledby="speech-models-title">
      <h2 id="speech-models-title">{copy.speechStoredTitle}</h2>
      <ul className="stack">
        {models.map((model) => (
          <li key={model.lang}>
            <button type="button" onClick={() => onDelete(model.lang)}>
              {copy.speechForget(LANG_LABEL[model.lang][uiLang], speechMegabytes(model.bytes))}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
