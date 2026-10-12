import type { ReactNode } from 'react'
import type { Lang } from '../../content/phrase'
import type { ExplainPart } from '../audio/explain'
import { useCopy, useSettings } from '../app/use-copy'
import { InfoButton } from './InfoButton'

/** The line and its translation, with the explanation behind the info button. */
export function LearnCard({ children, parts }: { children: ReactNode; parts?: ExplainPart[] }) {
  const lang = useSettings().appLang
  return (
    <div className="learn-card">
      <div className="learn-head" data-testid="learn-head">
        {children}
      </div>
      {parts && parts.length > 0 && lang ? <Notes lang={lang} parts={parts} /> : null}
    </div>
  )
}

function Notes({ lang, parts }: { lang: Lang; parts: ExplainPart[] }) {
  const copy = useCopy()
  return (
    <InfoButton
      label={copy.infoOpen}
      title={copy.aboutLine}
      closeLabel={copy.infoClose}
      readLabel={copy.readAloud}
      stopLabel={copy.readAloudStop}
      lang={lang}
      parts={parts}
    />
  )
}
