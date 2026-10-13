import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { deMicWav, enMicWav, fakeMicDir } from './fake-mic'

/** Chromium's fake microphone reads a PCM wav. The file is the sentence the page scores. */
function render(input: string, output: string): void {
  execFileSync(
    'ffmpeg',
    ['-y', '-loglevel', 'error', '-i', input, '-ac', '2', '-ar', '44100', '-c:a', 'pcm_s16le', output],
    { stdio: 'inherit' },
  )
}

export default function globalSetup(): void {
  mkdirSync(fakeMicDir, { recursive: true })
  render('public/audio/de/thorsten-high/day.numbers__any__base.r70.m4a', deMicWav)
  render('public/audio/en/joe/day.numbers__any__base.r70.m4a', enMicWav)
}
