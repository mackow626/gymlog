import { useState, useEffect } from 'react'
import { LockScreen } from './pages/LockScreen'
import { Dashboard } from './pages/Dashboard'
import { Exercises } from './pages/Exercises'
import { NewSession } from './pages/NewSession'
import { SessionDetail } from './pages/SessionDetail'
import { Stats } from './pages/Stats'
import { Nav } from './components/Nav'

export type Page =
  | { name: 'dashboard' }
  | { name: 'exercises' }
  | { name: 'new-session' }
  | { name: 'session'; id: number }
  | { name: 'stats' }

const AUTH_KEY = 'gymlog_auth'
const PASSWORD = 'mackow626'

export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === '1')
  const [page, setPage] = useState<Page>({ name: 'dashboard' })

  const handleAuth = (pw: string) => {
    if (pw === PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, '1')
      setAuthed(true)
    } else {
      return false
    }
    return true
  }

  if (!authed) return <LockScreen onAuth={handleAuth} />

  return (
    <div className="app">
      <Nav page={page} setPage={setPage} />
      <main className="main-content">
        {page.name === 'dashboard'    && <Dashboard setPage={setPage} />}
        {page.name === 'exercises'    && <Exercises />}
        {page.name === 'new-session'  && <NewSession setPage={setPage} />}
        {page.name === 'session'      && <SessionDetail id={page.id} setPage={setPage} />}
        {page.name === 'stats'        && <Stats />}
      </main>
    </div>
  )
}
