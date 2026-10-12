import path from 'node:path'

/** Written by global setup from the 70 % sentence files. Gitignored with test-results. */
export const fakeMicDir = path.join(process.cwd(), 'test-results/fake-mic')

export const deMicWav = path.join(fakeMicDir, 'day-numbers-de.wav')
export const enMicWav = path.join(fakeMicDir, 'day-numbers-en.wav')
