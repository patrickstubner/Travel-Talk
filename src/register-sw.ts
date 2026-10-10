import { publicUrl } from './public-url'

export function startServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  void navigator.serviceWorker.register(publicUrl('sw.js'), { scope: publicUrl('') }).catch((error: unknown) => {
    console.error(error)
  })
}
