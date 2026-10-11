import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import { AppProvider } from './app/state'
import { dropReplacedClips } from './audio/offline'
import { startServiceWorker } from './register-sw'
import './styles.css'

startServiceWorker()
void dropReplacedClips()

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <AppProvider>
        <RouterProvider router={router} />
      </AppProvider>
    </StrictMode>,
  )
}
