import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

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
  base: '/Travel-Talk/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'audio/NOTICE.txt'],
      manifest: {
        name: 'Travel Talk',
        short_name: 'Travel Talk',
        description: 'Reise-Sprachhilfe für eine Familie. Offline, ohne Konto.',
        lang: 'de-CH',
        start_url: '/Travel-Talk/',
        scope: '/Travel-Talk/',
        display: 'standalone',
        background_color: '#f3ecdf',
        theme_color: '#0e6b66',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,json,m4a,txt}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/Travel-Talk\/audio\//],
      },
    }),
    {
      name: 'csp-meta',
      transformIndexHtml(html, ctx) {
        if (ctx.server || html.includes('Content-Security-Policy')) return html
        return html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`)
      },
    },
    {
      name: 'gh-pages-404',
      apply: 'build',
      closeBundle() {
        const index = resolve('dist/index.html')
        if (existsSync(index)) copyFileSync(index, resolve('dist/404.html'))
      },
    },
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'content/**/*.test.ts'],
  },
})
