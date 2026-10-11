import { createHashRouter } from 'react-router-dom'
import { CulturePage } from '../pages/Culture'
import { HomePage } from '../pages/Home'
import { LookupPage } from '../pages/Lookup'
import { PhrasePage } from '../pages/Phrase'
import { PracticePage } from '../pages/Practice'
import { SettingsPage } from '../pages/Settings'
import { ShowPage } from '../pages/Show'
import { SituationPage } from '../pages/Situation'
import { Shell } from './shell'

export const router = createHashRouter([
  {
    path: '/',
    element: <Shell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'lookup', element: <LookupPage /> },
      { path: 'situation/:situationId', element: <SituationPage /> },
      { path: 'phrase/:conceptId', element: <PhrasePage /> },
      { path: 'practice', element: <PracticePage /> },
      { path: 'show', element: <ShowPage /> },
      { path: 'show/:conceptId', element: <ShowPage /> },
      { path: 'culture', element: <CulturePage /> },
      { path: 'culture/:noteId', element: <CulturePage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])
