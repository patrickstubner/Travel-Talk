// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import { freshIndexedDb } from '../test-idb'
import { useEffect, type ReactNode } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearManifestCache } from '../audio/player'
import { AppProvider, useApp } from '../app/state'
import { PhrasePage } from './Phrase'

function ReadyPhrase({ children }: { children: ReactNode }) {
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
  clearManifestCache()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  clearManifestCache()
})

describe('phrase playback refusal', () => {
  it('returns Anhören when a cached play() is refused', async () => {
    const created: string[] = []
    vi.stubGlobal(
      'Audio',
      class {
        playbackRate = 1
        constructor(public src: string) {
          created.push(src)
        }
        pause(): void {}
        play(): Promise<void> {
          return Promise.reject(new DOMException('not allowed', 'NotAllowedError'))
        }
      },
    )
    vi.stubGlobal('caches', {
      keys: async () => ['travel-talk-audio'],
      open: async () => ({ match: async () => new Response('audio') }),
    })
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (String(url).includes('manifest.json')) {
          return {
            ok: true,
            json: async () => ['vi/vivos-22/emergency.help__any__base.r70.m4a'],
          }
        }
        return { ok: false, json: async () => null }
      }),
    )
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
    fireEvent.click(await screen.findByRole('button', { name: 'Anhören' }))
    await waitFor(() => expect(created.length).toBe(1))
    const button = await screen.findByRole('button', { name: 'Anhören' })
    expect(button.getAttribute('aria-pressed')).not.toBe('true')
  })
})
