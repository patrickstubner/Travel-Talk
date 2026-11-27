// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { de } from '../i18n/dictionary'
import { publicUrl } from '../public-url'
import { SPEECH_MODELS, deleteSpeechModel } from './vosk'
import { SpeechModelStore } from './SpeechModelStore'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('stored speech models', () => {
  it('shows each stored model with its size and deletes that one', () => {
    const onDelete = vi.fn()
    const { rerender } = render(
      <SpeechModelStore
        copy={de}
        uiLang="de"
        models={[
          { lang: 'de', bytes: SPEECH_MODELS.de.bytes },
          { lang: 'vi', bytes: SPEECH_MODELS.vi.bytes },
        ]}
        onDelete={onDelete}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Deutsch löschen, 47 MB' }))
    expect(onDelete).toHaveBeenCalledWith('de')
    expect(screen.getByRole('button', { name: 'Vietnamesisch löschen, 34 MB' })).toBeTruthy()
    rerender(<SpeechModelStore copy={de} uiLang="de" models={[]} onDelete={onDelete} />)
    expect(screen.queryByTestId('speech-models')).toBeNull()
  })

  it('removes the archive from the recogniser cache', async () => {
    // happy-dom starts at about:blank, which cannot be the base of a path URL.
    ;(window as unknown as { happyDOM: { setURL: (url: string) => void } }).happyDOM.setURL('http://127.0.0.1:4173/Travel-Talk/')
    const store = new Map<string, Response>()
    vi.stubGlobal('caches', {
      open: async () => ({
        async match(url: string) {
          return store.get(url)
        },
        async put(url: string, response: Response) {
          store.set(url, response)
        },
        async delete(url: string) {
          return store.delete(url)
        },
      }),
    })
    const url = new URL(publicUrl('models/vosk-model-small-en-us-0.15.tar.gz'), window.location.href).href
    const cache = await caches.open('travel-talk-vosk')
    await cache.put(url, new Response(new Uint8Array([1, 2, 3])))
    await deleteSpeechModel('en')
    expect(await cache.match(url)).toBeUndefined()
  })
})
