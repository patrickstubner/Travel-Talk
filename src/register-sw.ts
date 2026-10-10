import { registerSW } from 'virtual:pwa-register'

export function startServiceWorker(): void {
  if (!import.meta.env.PROD) return
  registerSW({ immediate: true })
}
