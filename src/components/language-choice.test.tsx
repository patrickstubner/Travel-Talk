// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { playClip } from '../audio/player'
import { dictionaries } from '../i18n/dictionary'
import { defaultSettings } from '../storage/types'
import { LanguageChoice } from './LanguageChoice'

vi.mock('../audio/player', () => ({
  playClip: vi.fn(async () => 'file'),
  stopClip: vi.fn(),
}))

afterEach(() => {
  cleanup()
})

const copy = dictionaries.de

describe('language choice voices', () => {
  it('starts a new user on a male voice and plays a short preview', () => {
    render(
      <LanguageChoice
        settings={{ ...defaultSettings, appLang: 'de', targetLang: 'vi' }}
        copy={copy}
        ui="de"
        mode="onboarding"
        onChange={() => undefined}
      />,
    )
    expect(screen.getByRole('button', { name: 'Mann 1' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Frau (Norden)' }).getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(screen.getByRole('button', { name: 'Hörprobe: Mann 1' }))
    expect(playClip).toHaveBeenCalledWith('vi/vivos-22/voice.sample__any__base.m4a', 'Mann 1', 'vi', 1)
  })

  it('offers two male Portuguese voices and does not call faber a woman', () => {
    render(
      <LanguageChoice
        settings={{ ...defaultSettings, appLang: 'de', targetLang: 'pt-BR', voices: { 'pt-BR': 'cadu' } }}
        copy={copy}
        ui="de"
        mode="settings"
        onChange={() => undefined}
      />,
    )
    expect(screen.getByRole('button', { name: (value) => value === 'Mann' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: (value) => value === 'Mann 2' }).getAttribute('aria-pressed')).toBe('false')
    expect(screen.queryByRole('button', { name: (value) => value === 'Frau' })).toBeNull()
    for (const name of ['Frau (Daisy)', 'Frau (Gracie)', 'Frau (Tammie)', 'Frau (Claribel)']) {
      expect(screen.getByRole('button', { name: (value) => value === name }).getAttribute('aria-pressed')).toBe('false')
    }
    expect(screen.getByText(/Zwei Männerstimmen/)).toBeTruthy()
    expect(screen.getByText(/Vier Frauen von XTTS-v2/)).toBeTruthy()
  })

  it('offers the German woman beside the men and does not make her the default', () => {
    render(
      <LanguageChoice
        settings={{ ...defaultSettings, appLang: 'en', targetLang: 'de' }}
        copy={copy}
        ui="de"
        mode="onboarding"
        onChange={() => undefined}
      />,
    )
    expect(screen.getByRole('button', { name: 'Mann (hoch)' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Frau' }).getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByText(/oder eine Frau/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Hörprobe: Frau' }))
    expect(playClip).toHaveBeenCalledWith('de/mls-4576/voice.sample__any__base.m4a', 'Frau', 'de', 1)
  })

  it('keeps the previous voice selected for someone who already has settings', () => {
    render(
      <LanguageChoice
        settings={{ ...defaultSettings, appLang: 'de', targetLang: 'vi' }}
        copy={copy}
        ui="de"
        mode="settings"
        onChange={() => undefined}
      />,
    )
    expect(screen.getByRole('button', { name: 'Frau (Norden)' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Mann 1' }).getAttribute('aria-pressed')).toBe('false')
  })
})
