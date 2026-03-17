import { useEffect, useState } from 'react'
import { api } from '../hooks/api'
import type { Page } from '../App'

interface Props { setPage: (p: Page) => void }

export function Dashboard({ setPage }: Props) {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getSessions().then(setSessions).finally(() => setLoading(false))
  }, [])

  const deleteSession = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Usuń trening?')) return
    await api.deleteSession(id)
    setSessions(s => s.filter(x => x.id !== id))
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Treningi</h2>
          <p className="page-sub">Historia twoich sesji</p>
        </div>
        <button className="btn-primary" onClick={() => setPage({ name: 'new-session' })}>
          <span>+</span> Nowy trening
        </button>
      </div>

      {loading && <div className="loading"><div className="spinner" /></div>}

      {!loading && sessions.length === 0 && (
        <div className="empty">
          <p>Brak treningów. Zacznij pierwszy!</p>
          <button className="btn-primary" onClick={() => setPage({ name: 'new-session' })}>
            Dodaj trening
          </button>
        </div>
      )}

      <div className="session-list">
        {sessions.map(s => (
          <div key={s.id} className="session-card" onClick={() => setPage({ name: 'session', id: s.id })}>
            <div className="session-card-left">
              <span className="session-date">{formatDate(s.date)}</span>
              {s.notes && <span className="session-notes">{s.notes}</span>}
            </div>
            <div className="session-card-right">
              <button
                className="btn-ghost btn-edit"
                onClick={e => {
                  e.stopPropagation()
                  setPage({ name: 'edit-session', id: s.id })
                }}
              >
                Edytuj
              </button>
              <button className="btn-ghost btn-danger" onClick={e => deleteSession(s.id, e)}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pl-PL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
}
