import type { Lang } from '../../content/phrase'
import type { Dictionary } from '../i18n/dictionary'
import { keptShare, studyCounts } from '../srs/progress'
import type { StoredCard } from '../storage/types'
import { InfoButton } from './InfoButton'

/**
 * Local counts for the active person. The page draws bars. The sentences sit behind the info button.
 */
export function StudyProgress({
  cards,
  copy,
  variant,
  lang,
  now = new Date(),
}: {
  cards: readonly StoredCard[]
  copy: Dictionary
  variant: 'compact' | 'full'
  lang: Lang | null
  now?: Date
}) {
  const counts = studyCounts(cards, now)
  const learned = counts.learnedSentences + counts.learnedWords
  const sentenceWidth = learned === 0 ? '0%' : `${(counts.learnedSentences / learned) * 100}%`
  const wordWidth = learned === 0 ? '0%' : `${(counts.learnedWords / learned) * 100}%`
  const reviewedWidth = learned === 0 ? '0%' : `${Math.min(100, (counts.reviewedToday / learned) * 100)}%`
  const kept = keptShare(counts)
  const study = copy.study
  return (
    <div className={`study-progress ${variant}`} data-testid="study-progress" data-variant={variant}>
      <div className="study-meters">
        <div
          className="study-meter"
          role="img"
          aria-label={study.learned(counts.learnedSentences, counts.learnedWords)}
          data-testid="study-learned"
          data-sentences={counts.learnedSentences}
          data-words={counts.learnedWords}
        >
          <span className="study-figure">
            <span className="study-label" aria-hidden="true">
              {study.learnedLabel}
            </span>
            <span className="study-count" aria-hidden="true">
              {learned}
            </span>
          </span>
          <span className="study-track" aria-hidden="true">
            <span className="study-split">
              <span className="sentences" style={{ width: sentenceWidth }} />
              <span className="words" style={{ width: wordWidth }} />
            </span>
          </span>
        </div>
        <div
          className="study-meter"
          role="img"
          aria-label={study.reviewed(counts.reviewedToday)}
          data-testid="study-reviewed"
          data-count={counts.reviewedToday}
        >
          <span className="study-figure">
            <span className="study-label" aria-hidden="true">
              {study.reviewedLabel}
            </span>
            <span className="study-count" aria-hidden="true">
              {counts.reviewedToday}
            </span>
          </span>
          <span className="study-track" aria-hidden="true">
            <span className="study-fill reviewed" style={{ width: reviewedWidth }} />
          </span>
        </div>
        <div className="study-meter" role="img" aria-label={study.kept(kept)} data-testid="study-kept" data-percent={kept}>
          <span className="study-figure">
            <span className="study-label" aria-hidden="true">
              {study.keptLabel}
            </span>
            <span className="study-count" aria-hidden="true">
              {kept}%
            </span>
          </span>
          <span className="study-track" aria-hidden="true">
            <span className="study-fill kept" style={{ width: `${kept}%` }} />
          </span>
        </div>
      </div>
      {lang ? (
        <InfoButton
          label={study.info}
          title={study.title}
          closeLabel={copy.infoClose}
          readLabel={copy.readAloud}
          stopLabel={copy.readAloudStop}
          lang={lang}
          parts={[
            { text: study.learnedHint, clip: null },
            { text: study.reviewedHint, clip: null },
            { text: study.keptHint, clip: null },
          ]}
        />
      ) : null}
    </div>
  )
}
