// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { useEffect, type ReactNode } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AppProvider, useApp } from '../app/state'
import { PhrasePage } from './Phrase'

function ReadyPhrase({ children }: { children: ReactNode }) {
  const { snapshot, saveSettings } = useApp()
  useEffect(() => {
    if (snapshot && snapshot.settings.pairId !== 'de-vi') {
      void saveSettings({ ...snapshot.settings, pairId: 'de-vi' })
    }
  }, [snapshot, saveSettings])
  if (snapshot?.settings.pairId !== 'de-vi') return null
  return children
}

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
})

afterEach(() => {
  cleanup()
})

describe('phrase speed', () => {
  it('shows one tempo control and keeps a fixed choice', async () => {
    render(
      <AppProvider>
        <ReadyPhrase>
          <MemoryRouter initialEntries={['/phrase/emergency.help']}>
            <Routes>
              <Route path="/phrase/:conceptId" element={<PhrasePage />} />
            </Routes>
          </MemoryRouter>
        </ReadyPhrase>
      </AppProvider>,
    )
    const control = await screen.findByTestId('speed-control')
    expect(control.querySelectorAll('button')).toHaveLength(4)
    expect(screen.getByRole('button', { name: 'Automatisch', pressed: true })).toBeTruthy()
    expect(screen.getByTestId('speed-now').textContent).toBe('Tempo 70 %')
    expect(screen.queryByRole('button', { name: 'Langsam anhören' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '100 %' }))
    expect(await screen.findByRole('button', { name: '100 %', pressed: true })).toBeTruthy()
    expect(screen.getByTestId('speed-now').textContent).toBe('Tempo 100 %')
    expect(screen.getByText(/Fest 100 %/)).toBeTruthy()
  })
})
