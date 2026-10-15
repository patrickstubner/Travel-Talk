import { copyFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, type RsbuildPluginAPI } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { generateSW } from 'workbox-build'
import { HELP_CACHE, HELP_CACHE_LIMIT, PRECACHE_BYTE_BUDGET, PRECACHE_ENTRY_BUDGET, PRECACHE_GLOBS, PRECACHE_IGNORES } from './src/pwa/cache-policy'

const BASE = '/Travel-Talk/'

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval' 'unsafe-eval'",
  "style-src 'self'",
  "style-src-attr 'none'",
  "img-src 'self' data:",
  "media-src 'self' blob:",
  "connect-src 'self'",
  "font-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-src 'none'",
].join('; ')

export default defineConfig({
  plugins: [
    pluginReact(),
    {
      name: 'travel-talk-offline',
      apply: 'build',
      setup(api: RsbuildPluginAPI) {
        api.modifyHTML((html) => {
          if (html.includes('Content-Security-Policy')) return html
          return html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`)
        })
        api.onAfterBuild(async ({ environments }) => {
          const dist = Object.values(environments)[0]?.distPath
          if (!dist) throw new Error('DIST_MISSING')
          copyFileSync(join(dist, 'index.html'), join(dist, '404.html'))
          // workbox-build globs the finished dist, including the copied audio.
          // An Rspack plugin would only see compilation assets, not those files.
          const result = await generateSW({
            globDirectory: dist,
            globPatterns: [...PRECACHE_GLOBS],
            globIgnores: [...PRECACHE_IGNORES],
            swDest: join(dist, 'sw.js'),
            modifyURLPrefix: { '': BASE },
            maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
            navigateFallback: `${BASE}index.html`,
            navigateFallbackDenylist: [/^\/Travel-Talk\/audio\//],
            directoryIndex: 'index.html',
            cacheId: 'travel-talk',
            skipWaiting: true,
            clientsClaim: true,
            // Sentence audio and help clips are not part of install. A full disk must not block the update.
            // Activate still drops precache URLs that left the manifest, including old audio.
            // The start page asks for one reload of the voice after that.
            cleanupOutdatedCaches: false,
            disableDevLogs: true,
            sourcemap: false,
            mode: 'production',
            // Help clips are cached on demand, one app language, in their own cache.
            // Sentence audio and timing files use the voice cache. «Für offline laden» fills both.
            runtimeCaching: [
              {
                urlPattern: /\/Travel-Talk\/audio\/[^/]+\/help\/.+\.m4a$/,
                handler: 'CacheFirst',
                options: {
                  cacheName: HELP_CACHE,
                  cacheableResponse: { statuses: [200] },
                  expiration: { maxEntries: HELP_CACHE_LIMIT, maxAgeSeconds: 60 * 60 * 24 * 365 },
                },
              },
              {
                urlPattern: /\/Travel-Talk\/audio\/.+\.(?:m4a|align\.json)$/,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'travel-talk-audio',
                  cacheableResponse: { statuses: [200] },
                  expiration: { maxEntries: 12000, maxAgeSeconds: 60 * 60 * 24 * 365 },
                },
              },
              {
                urlPattern: /\/Travel-Talk\/models\/vosk-model-small-pt-.*\.tar\.gz$/,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'travel-talk-vosk',
                  cacheableResponse: { statuses: [200] },
                  expiration: { maxEntries: 2, maxAgeSeconds: 60 * 60 * 24 * 365 },
                },
              },
              {
                urlPattern: /\/Travel-Talk\/static\/js\/.*vosk.*\.js$/,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'travel-talk-vosk-script',
                  cacheableResponse: { statuses: [200] },
                  expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 * 365 },
                },
              },
            ],
          })
          if (result.warnings.length > 0) throw new Error(result.warnings.join('\n'))
          if (result.count > PRECACHE_ENTRY_BUDGET || result.size > PRECACHE_BYTE_BUDGET) {
            throw new Error(`PRECACHE_TOO_BIG count=${result.count} size=${result.size}`)
          }
          const sw = readFileSync(join(dist, 'sw.js'), 'utf8')
          if (/\/help\/[a-z0-9][^"'\\\s]*\.m4a/.test(sw)) throw new Error('HELP_IN_PRECACHE')
        })
      },
    },
  ],
  source: {
    entry: { index: './src/main.tsx' },
  },
  server: {
    base: BASE,
    port: 5173,
    host: '127.0.0.1',
  },
  html: {
    template: './index.html',
  },
  output: {
    distPath: { root: 'dist' },
    assetPrefix: BASE,
    inlineScripts: false,
    inlineStyles: false,
    sourceMap: false,
    legalComments: 'none',
  },
})
