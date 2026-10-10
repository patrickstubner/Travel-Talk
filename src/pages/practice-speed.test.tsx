// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { useEffect, type ReactNode } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { playClip } from '../audio/player'
import { AppProvider, useApp } from '../app/state'
import { PracticePage } from './Practice'

vi.mock('../audio/player', () => ({
  playClip: vi.fn(async () => 'file'),
}))

function ReadyPractice({ children }: { children: ReactNode }) {
  const { snapshot, saveSettings } = useApp()
  useEffect(() => {
    if (snapshot && snapshot.settings.pairId !== 'de-vi') {
      void saveSettings({ ...snapshot.settings, pairId: 'de-vi', speed: 'auto' })
    }
  }, [snapshot, saveSettings])
  if (snapshot?.settings.pairId !== 'de-vi' || snapshot.settings.speed !== 'auto') return null
  return children
}

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
})

afterEach(() => {
  cleanup()
  vi.mocked(playClip).mockClear()
})

describe('listening practice speed', () => {
  it('plays the 70 % file for a new card while automatic is on', async () => {
    render(
      <AppProvider>
        <ReadyPractice>
          <MemoryRouter initialEntries={['/practice']}>
            <Routes>
              <Route path="/practice" element={<PracticePage />} />
            </Routes>
          </MemoryRouter>
        </ReadyPractice>
      </AppProvider>,
    )
    expect((await screen.findByTestId('speed-now')).textContent).toBe('Tempo 70 %')
    fireEvent.click(screen.getByRole('button', { name: 'Anhören' }))
    expect(vi.mocked(playClip).mock.calls[0]?.[0]).toMatch(/\.r70\.m4a$/)
    expect(vi.mocked(playClip).mock.calls[0]?.[3]).toBe(0.7)
  })
})
