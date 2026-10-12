/**
 * What the service worker installs up front.
 * Sentence audio and explanation clips stay out: a full disk must not block an update.
 */
export const PRECACHE_GLOBS = ['**/*.{js,css,html,svg,png,webmanifest,json,txt}'] as const

export const PRECACHE_IGNORES = ['**/sw.js', '**/workbox-*.js', '**/*.align.json'] as const

/** Shell only. The old help-clip precache was 623 entries and 24.5 MB. */
export const PRECACHE_ENTRY_BUDGET = 40
export const PRECACHE_BYTE_BUDGET = 2 * 1024 * 1024

/**
 * Explanation clips fetched while reading, or by «Für offline laden» for the app language.
 * 200 holds one language (152 today) and not two.
 */
export const HELP_CACHE = 'travel-talk-help'
export const HELP_CACHE_LIMIT = 200

const PRECACHE_EXTENSIONS = new Set(['js', 'css', 'html', 'svg', 'png', 'webmanifest', 'json', 'txt'])

/** True when a dist-relative path would enter the install precache. */
export function precacheMatches(relativePath: string): boolean {
  const normalized = relativePath.replaceAll('\\', '/')
  if (normalized === 'sw.js' || normalized.endsWith('/sw.js')) return false
  if (normalized.endsWith('.align.json')) return false
  const base = normalized.slice(normalized.lastIndexOf('/') + 1)
  if (base.startsWith('workbox-') && base.endsWith('.js')) return false
  const dot = normalized.lastIndexOf('.')
  if (dot < 0) return false
  return PRECACHE_EXTENSIONS.has(normalized.slice(dot + 1))
}
