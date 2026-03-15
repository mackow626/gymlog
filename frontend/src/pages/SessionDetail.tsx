import { useEffect, useState } from 'react'
import { api } from '../hooks/api'
import type { Page } from '../App'

interface Props { id: number; setPage: (p: Page) => void }

export function SessionDetail({ id, setPage }: Props) {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getSession(id).then(setSession).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="loading"><div className="spinner" /></div>
  if (!session) return <div className="page"><p>Nie znaleziono treningu.</p></div>

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <button className="btn-ghost btn-back" onClick={() => setPage({ name: 'dashboard' })}>
            ← Powrót
          </button>
          <h2 className="page-title">{formatDate(session.date)}</h2>
          {session.notes && <p className="page-sub">{session.notes}</p>}
        </div>
      </div>

      <div className="trisets-container">
        {session.trisets?.map((ts: any) => (
          <div key={ts.id} className="triset-card">
            <div className="triset-header">
              <span className="triset-label">Tri-set {ts.position}</span>
            </div>
            <div className="triset-exercises">
              {ts.exercises?.map((ex: any) => {
                const muscles: string[] = JSON.parse(ex.muscle_groups ?? '[]')
                return (
                  <div key={ex.id} className="detail-exercise-row">
                    <span className="ex-num">{ex.position}</span>
                    <div className="detail-ex-info">
                      <span className="exercise-name">{ex.name}</span>
                      <div className="exercise-muscles">
                        {muscles.map(m => <span key={m} className="muscle-badge">{m}</span>)}
                      </div>
                    </div>
                    <div className="detail-ex-stats">
                      {ex.sets && <span className="stat-chip">{ex.sets} serie</span>}
                      {ex.reps && <span className="stat-chip">{ex.reps} powt.</span>}
                      {ex.weight_kg && <span className="stat-chip accent">{ex.weight_kg} kg</span>}
                    </div>
                  </div>
                )
              })}
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
