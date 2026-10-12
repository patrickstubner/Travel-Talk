// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import { freshIndexedDb } from '../test-idb'
import { useEffect, type ReactNode } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProvider, useApp } from '../app/state'
import { PhrasePage } from './Phrase'

vi.mock('../audio/player', () => ({
  playClip: vi.fn(async () => 'file'),
  stopClip: vi.fn(),
  decodeContourFile: vi.fn(async () => null),
}))

function ReadyPhrase({ children }: { children: ReactNode }) {
  const { snapshot, saveSettings } = useApp()
  useEffect(() => {
    if (snapshot && (snapshot.settings.appLang !== 'de' || snapshot.settings.targetLang !== 'en')) {
      void saveSettings({ ...snapshot.settings, appLang: 'de', targetLang: 'en' })
    }
  }, [snapshot, saveSettings])
  if (snapshot?.settings.appLang !== 'de' || snapshot?.settings.targetLang !== 'en') return null
  return children
}

function follows(earlier: HTMLElement, later: HTMLElement): void {
  expect(earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
}

beforeEach(() => {
  freshIndexedDb()
})

afterEach(() => {
  cleanup()
})

describe('phrase layout', () => {
  it('puts the line, the tempo and the recording above the notes', async () => {
    render(
      <AppProvider>
        <ReadyPhrase>
          <MemoryRouter initialEntries={['/phrase/emergency.write']}>
            <Routes>
              <Route path="/phrase/:conceptId" element={<PhrasePage />} />
            </Routes>
          </MemoryRouter>
        </ReadyPhrase>
      </AppProvider>,
    )
    const head = await screen.findByTestId('learn-head')
    const actions = screen.getByTestId('learn-actions')
    const record = screen.getByTestId('learn-record')
    const info = screen.getByRole('button', { name: 'Erklärungen zum Satz' })
    expect(head.querySelector('[data-testid="target-line"]')?.textContent).toMatch(/Could/)
    expect(head.querySelector('.gloss, .word-gloss')?.textContent).toMatch(/aufschreiben/)
    follows(head, actions)
    follows(actions, record)
    expect(screen.queryByTestId('learn-notes')).toBeNull()
    expect(actions.textContent).not.toMatch(/Wozu der Satz/)
    expect(head.textContent).not.toMatch(/Beispielsatz/)
    fireEvent.click(info)
    const notes = screen.getByTestId('learn-notes')
    expect(notes.getAttribute('role')).toBe('dialog')
    expect(notes.textContent).toMatch(/Beispielsatz/)
    expect(notes.textContent).toMatch(/Wozu der Satz/)
    expect(screen.getByTestId('read-aloud').textContent).toMatch(/Vorlesen/)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByTestId('learn-notes')).toBeNull()
  })
})
