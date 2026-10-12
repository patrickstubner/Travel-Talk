// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import { freshIndexedDb } from '../test-idb'
import { useEffect, type ReactNode } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProvider, useApp } from '../app/state'
import { dictionaries } from '../i18n/dictionary'
import { ShowPage } from './Show'

vi.mock('../audio/player', () => ({
  playClip: vi.fn(async () => 'file'),
  stopClip: vi.fn(),
  decodeContourFile: vi.fn(async () => null),
  loadManifest: vi.fn(async () => new Set()),
  clearManifestCache: vi.fn(),
}))

function Ready({ children }: { children: ReactNode }) {
  const { snapshot, saveSettings } = useApp()
  useEffect(() => {
    if (snapshot && (snapshot.settings.appLang !== 'de' || snapshot.settings.targetLang !== 'vi')) {
      void saveSettings({ ...snapshot.settings, appLang: 'de', targetLang: 'vi' })
    }
  }, [snapshot, saveSettings])
  if (snapshot?.settings.appLang !== 'de' || snapshot?.settings.targetLang !== 'vi') return null
  return children
}

beforeEach(() => {
  freshIndexedDb()
})

afterEach(() => {
  cleanup()
})

describe('show purpose', () => {
  it('explains the large phrase in every app language', () => {
    expect(dictionaries.de.showPurpose).toMatch(/Apotheke/)
    expect(dictionaries.en.showPurpose).toMatch(/pharmacy/)
    expect(dictionaries['pt-BR'].showPurpose).toMatch(/farmácia/)
    expect(dictionaries.vi.showPurpose).toMatch(/nhà thuốc/i)
    expect(new Set(Object.values(dictionaries).map((copy) => copy.showPurpose)).size).toBe(4)
  })

  it('places the purpose under the line for the other person', async () => {
    render(
      <AppProvider>
        <Ready>
          <MemoryRouter initialEntries={['/show/emergency.pharmacy']}>
            <Routes>
              <Route path="/show/:conceptId" element={<ShowPage />} />
            </Routes>
          </MemoryRouter>
        </Ready>
      </AppProvider>,
    )
    const section = await screen.findByTestId('show')
    const text = section.textContent ?? ''
    const kicker = text.indexOf('Für die andere Person')
    const purpose = text.indexOf(dictionaries.de.showPurpose)
    expect(kicker).toBeGreaterThanOrEqual(0)
    expect(purpose).toBeGreaterThan(kicker)
  })
})
