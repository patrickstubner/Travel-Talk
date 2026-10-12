import { copyFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, type RsbuildPluginAPI } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { generateSW } from 'workbox-build'

const BASE = '/Travel-Talk/'

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "style-src-attr 'none'",
  "img-src 'self' data:",
  "media-src 'self' blob:",
  "connect-src 'self'",
  "font-src 'self'",
  "worker-src 'self'",
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
            globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,json,txt}', 'audio/*/help/*.m4a'],
            globIgnores: ['**/sw.js', '**/workbox-*.js', '**/*.align.json'],
            swDest: join(dist, 'sw.js'),
            modifyURLPrefix: { '': BASE },
            maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
            navigateFallback: `${BASE}index.html`,
            navigateFallbackDenylist: [/^\/Travel-Talk\/audio\//],
            directoryIndex: 'index.html',
            cacheId: 'travel-talk',
            skipWaiting: true,
            clientsClaim: true,
            // Sentence audio is not part of install. A full disk must not block the update.
            // Help clips are short and are precached so Vorlesen works after install.
            // Activate still drops precache URLs that left the manifest, including old audio.
            // The start page asks for one reload of the voice after that.
            cleanupOutdatedCaches: false,
            disableDevLogs: true,
            sourcemap: false,
            mode: 'production',
            // Sentence audio and timing files are not precached. The selected voice is fetched into this cache.
            runtimeCaching: [
              {
                urlPattern: /\/Travel-Talk\/audio\/.+\.(?:m4a|align\.json)$/,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'travel-talk-audio',
                  cacheableResponse: { statuses: [200] },
                  expiration: { maxEntries: 8000, maxAgeSeconds: 60 * 60 * 24 * 365 },
                },
              },
            ],
          })
          if (result.warnings.length > 0) throw new Error(result.warnings.join('\n'))
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
