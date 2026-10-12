import type { ReactNode } from 'react'

/** Culture, voice and method notes. Closed, so the sentence and the recording stay up top. */
export function LearnNotes({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="learn-notes" data-testid="learn-notes">
      <summary>{title}</summary>
      <div className="learn-notes-body">{children}</div>
    </details>
  )
}
