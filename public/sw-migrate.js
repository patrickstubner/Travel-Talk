/**
 * Runs during install, before Workbox activate deletes precache URLs that are
 * no longer in the manifest. Old builds stored the voice in that precache.
 * The copy lands in the runtime cache, which activate does not clean.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(copyOldAudio())
})

async function copyOldAudio() {
  const destName = 'travel-talk-audio'
  const dest = await caches.open(destName)
  const names = await caches.keys()
  for (const name of names) {
    if (name === destName) continue
    const source = await caches.open(name)
    for (const request of await source.keys()) {
      const url = typeof request === 'string' ? request : request.url
      if (!String(url).includes('.m4a')) continue
      if (await dest.match(request)) continue
      const response = await source.match(request)
      if (!response) continue
      await dest.put(request, response.clone())
    }
  }
}
