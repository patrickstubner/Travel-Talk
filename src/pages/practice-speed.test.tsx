// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import { freshIndexedDb } from '../test-idb'
import { useEffect, type ReactNode } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
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
    if (snapshot && (snapshot.settings.appLang !== 'de' || snapshot.settings.targetLang !== 'vi')) {
      void saveSettings({ ...snapshot.settings, appLang: 'de', targetLang: 'vi', speed: 'auto' })
    }
  }, [snapshot, saveSettings])
  if (snapshot?.settings.appLang !== 'de' || snapshot?.settings.targetLang !== 'vi' || snapshot.settings.speed !== 'auto') return null
  return children
}

beforeEach(() => {
  freshIndexedDb()
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
    expect(await screen.findByTestId('target-line')).toBeTruthy()
    expect(vi.mocked(playClip).mock.calls[0]?.[0]).toMatch(/\.r70\.m4a$/)
    expect(vi.mocked(playClip).mock.calls[0]?.[3]).toBe(0.7)
  })
})
