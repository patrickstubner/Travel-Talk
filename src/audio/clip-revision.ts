/**
 * Three transport lines were spoken again in 0.8.0 under the old file name.
 * A CacheFirst entry lives for a year, so the new recording uses `.v2`.
 * The names without `.v2` are the ones already stored on a 0.7.0 device.
 */
export const CLIP_REVISION = 'v2'

export const RESPOKEN_STEMS = [
  'de/transport.20.seasick__any__base',
  'vi/transport.01.taxi__any__base',
  'vi/transport.19.ferry__any__base',
] as const

const VOICE_FOLDERS: Record<string, readonly string[]> = {
  de: ['', 'thorsten-high'],
  vi: ['', 'vivos-22', 'vivos-32'],
}

export function reviseClip(file: string): string {
  if (!file.endsWith('.m4a')) return file
  const stem = file.slice(0, -'.m4a'.length)
  if (!(RESPOKEN_STEMS as readonly string[]).includes(stem)) return file
  return `${stem}.${CLIP_REVISION}.m4a`
}

/** Audio and timing files a 0.7.0 cache may still hold for the respoken lines. */
export function replacedClipPaths(): string[] {
  const paths: string[] = []
  for (const stem of RESPOKEN_STEMS) {
    const slash = stem.indexOf('/')
    const lang = stem.slice(0, slash)
    const rest = stem.slice(slash + 1)
    for (const voice of VOICE_FOLDERS[lang] ?? ['']) {
      const base = voice ? `${lang}/${voice}/${rest}` : stem
      paths.push(`${base}.m4a`, `${base}.r70.m4a`, `${base}.r85.m4a`, `${base}.align.json`)
    }
  }
  return paths
}
