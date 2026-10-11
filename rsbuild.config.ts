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
            globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,json,txt}'],
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
            cleanupOutdatedCaches: true,
            disableDevLogs: true,
            sourcemap: false,
            mode: 'production',
            // Audio is not precached. The selected voice is fetched into this cache.
            runtimeCaching: [
              {
                urlPattern: /\/Travel-Talk\/audio\/.+\.m4a$/,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'travel-talk-audio',
                  cacheableResponse: { statuses: [0, 200] },
                  expiration: { maxEntries: 2000, maxAgeSeconds: 60 * 60 * 24 * 365 },
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
