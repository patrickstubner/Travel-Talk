import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { htmlLang, interfaceLang } from './labels'
import { useApp } from './state'
import { useCopy, useSettings } from './use-copy'

export function Shell() {
  const { catalogOk, snapshot, storageError } = useApp()
  const settings = useSettings()
  const copy = useCopy()
  const location = useLocation()
  const showMode = location.pathname.startsWith('/show')
  const active = snapshot?.people?.find((person) => person.id === snapshot.activePersonId)
  const needsName = Boolean(active && active.name === '')

  useEffect(() => {
    document.documentElement.lang = htmlLang(interfaceLang(settings))
  }, [settings])

  if (!catalogOk) {
    return (
      <p className="banner" role="alert">
        Katalog
      </p>
    )
  }
  if (storageError) {
    return (
      <p className="banner" role="alert">
        {copy.storageError}
      </p>
    )
  }
  if (!snapshot || !active) return <p className="banner">{copy.loading}</p>

  return (
    <div className={showMode ? 'app show-mode' : 'app'}>
      <a className="skip" href="#inhalt">
        {copy.skip}
      </a>
      <header className="top">
        <p className="brand">{copy.appName}</p>
        <p className="version">{copy.version}</p>
      </header>
      <TopBar askName={needsName} hidePerson={showMode && !needsName} />
      <div className="layout">
        <nav className="nav" aria-label={copy.appName}>
          <NavLink to="/" end>
            {copy.nav.today}
          </NavLink>
          <NavLink to="/lookup">{copy.nav.lookup}</NavLink>
          <NavLink to="/show">{copy.nav.show}</NavLink>
          <NavLink to="/settings">{copy.nav.settings}</NavLink>
        </nav>
        <main id="inhalt">
          {needsName ? (
            <p className="hint" data-testid="name-ask">
              {copy.personNameHint}
            </p>
          ) : (
            <Outlet key={snapshot.activePersonId} />
          )}
        </main>
      </div>
    </div>
  )
}
