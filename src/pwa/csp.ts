/**
 * The document policy. Eval and WASM stay out of it. The recogniser is a
 * same-origin worker, so worker-src does not need blob:.
 * media-src keeps blob: for the recording the page plays back.
 */
export const PAGE_CSP = [
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

/**
 * Policy the service worker attaches to vosk-worker.js only.
 * GitHub Pages cannot set a header on that file. Until the service worker
 * controls the page, the worker response has no policy of its own, and the
 * document meta policy does not apply to a same-origin worker.
 */
export const VOSK_WORKER_CSP = [
  "default-src 'none'",
  "script-src 'unsafe-eval' 'wasm-unsafe-eval'",
  "worker-src 'none'",
  "connect-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
].join('; ')

/** Cache left by the blob build. Activate deletes it. */
export const VOSK_SCRIPT_CACHE = 'travel-talk-vosk-script'

/** One current worker file. Older names in this cache are deleted on activate. */
export const VOSK_WORKER_CACHE = 'travel-talk-vosk-worker'

/** True when the document policy still allows eval, WASM eval, or a blob worker. */
export function pageCspIsLoose(policy: string): boolean {
  if (policy.includes('unsafe-inline') || policy.includes('unsafe-eval')) return true
  const worker = /worker-src[^;]*/.exec(policy)?.[0] ?? ''
  return worker.includes('blob')
}

/**
 * Runs before Workbox. The worker script gets its own policy. Old hashed
 * Vosk scripts leave the previous cache. The page never sees this policy.
 */
export function voskServiceWorkerPrelude(): string {
  return `self.addEventListener('fetch', (event) => {
  var path = new URL(event.request.url).pathname
  if (!path.endsWith('/vosk-worker.js')) return
  event.respondWith(serveVoskWorker(event.request))
})
self.addEventListener('activate', (event) => {
  event.waitUntil(dropOldVoskScripts())
})
function serveVoskWorker(request) {
  return caches.open('${VOSK_WORKER_CACHE}').then(function (cache) {
    return fetch(request).then(function (response) {
      if (response && response.ok) {
        cache.put(request, response.clone()).catch(function () {})
      }
      return withVoskWorkerPolicy(response)
    }).catch(function () {
      return cache.match(request).then(function (cached) {
        return cached ? withVoskWorkerPolicy(cached) : Response.error()
      })
    })
  })
}
function withVoskWorkerPolicy(response) {
  var headers = new Headers(response.headers)
  headers.set('Content-Security-Policy', ${JSON.stringify(VOSK_WORKER_CSP)})
  return response.arrayBuffer().then(function (body) {
    return new Response(body, { status: response.status, statusText: response.statusText, headers: headers })
  })
}
function dropOldVoskScripts() {
  return caches.delete('${VOSK_SCRIPT_CACHE}').then(function () {
    return caches.open('${VOSK_WORKER_CACHE}').then(function (cache) {
      return cache.keys().then(function (keys) {
        return Promise.all(keys.map(function (request) {
          var path = new URL(request.url).pathname
          if (path.endsWith('/vosk-worker.js')) return false
          return cache.delete(request)
        }))
      })
    })
  })
}
`
}
