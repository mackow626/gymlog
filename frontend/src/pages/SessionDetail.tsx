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
        <div className="page-actions">
          <button className="btn-ghost" onClick={() => setPage({ name: 'edit-session', id })}>
            Edytuj trening
          </button>
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
                const series = parseSeriesFromApi(ex)
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
                      {series.map((s, index) => (
                        <span key={index} className="stat-chip accent">
                          S{index + 1}: {s.weight_kg ?? '-'} kg x {s.reps ?? '-'}
                        </span>
                      ))}
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

function parseSeriesFromApi(exercise: any): Array<{ weight_kg: number | null; reps: number | null }> {
  const weights = parseNumberArray(exercise.weight_kg)
  const reps = parseNumberArray(exercise.reps)
  const count = Math.max(weights.length, reps.length, Number(exercise.sets) || 1)

  return Array.from({ length: count }, (_, index) => ({
    weight_kg: weights[index] ?? null,
    reps: reps[index] ?? null,
  }))
}

function parseNumberArray(value: unknown): Array<number | null> {
  if (Array.isArray(value)) return value.map(v => toNullableNumber(v))
  if (typeof value === 'number') return [value]
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []

    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) return parsed.map(v => toNullableNumber(v))
    } catch {
      const num = Number(trimmed)
      return Number.isFinite(num) ? [num] : []
    }
  }
  return []
}

function toNullableNumber(value: unknown): number | null {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}
