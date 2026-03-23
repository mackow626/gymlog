import { useEffect, useMemo, useState } from 'react'
import { api } from '../hooks/api'
import type { Page } from '../App'

interface Props { id: number; setPage: (p: Page) => void }

export function SessionDetail({ id, setPage }: Props) {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getSession(id).then(setSession).finally(() => setLoading(false))
  }, [id])

  const seriesByMuscleGroup = useMemo(() => {
    if (!session?.trisets) return [] as Array<[string, number]>

    const totals: Record<string, number> = {}

    for (const triset of session.trisets) {
      for (const exercise of triset.exercises ?? []) {
        const muscles = parseStringArray(exercise.muscle_groups)
        if (!muscles.length) continue

        const seriesCount = parseSeriesFromApi(exercise).filter(s => hasSeriesData(s)).length
        if (seriesCount < 1) continue

        for (const muscle of muscles) {
          totals[muscle] = (totals[muscle] ?? 0) + seriesCount
        }
      }
    }

    return Object.entries(totals).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1]
      return a[0].localeCompare(b[0], 'pl')
    })
  }, [session])

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
                const muscles = parseStringArray(ex.muscle_groups)
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
                        <span key={index} className="stat-chip accent stat-chip-series">
                          <span className="stat-chip-copy">
                            S{index + 1}: {s.weight_kg ?? '-'} kg x {s.reps ?? '-'}
                          </span>
                          {s.comment && (
                            <span className="stat-chip-comment">{s.comment}</span>
                          )}
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

      <div className="session-summary-card">
        <div className="session-summary-header">
          <h3 className="section-title session-summary-title">Serie na partie ciała</h3>
          <span className="session-summary-total">
            Łącznie: {seriesByMuscleGroup.reduce((sum, [, count]) => sum + count, 0)}
          </span>
        </div>
        {seriesByMuscleGroup.length === 0 ? (
          <p className="empty-text">Brak zliczonych serii dla tej sesji.</p>
        ) : (
          <div className="session-summary-list">
            {seriesByMuscleGroup.map(([group, count]) => (
              <div key={group} className="session-summary-row">
                <span className="session-summary-group">{group}</span>
                <span className="session-summary-count">{count} serii</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pl-PL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
}

function parseSeriesFromApi(exercise: any): Array<{ weight_kg: number | null; reps: number | null; comment: string | null }> {
  const weights = parseNumberArray(exercise.weight_kg)
  const reps = parseNumberArray(exercise.reps)
  const comments = parseStringArray(exercise.comments)
  const count = Math.max(weights.length, reps.length, comments.length, Number(exercise.sets) || 1)

  return Array.from({ length: count }, (_, index) => ({
    weight_kg: weights[index] ?? null,
    reps: reps[index] ?? null,
    comment: comments[index] ?? null,
  }))
}

function hasSeriesData(series: { weight_kg: number | null; reps: number | null; comment: string | null }): boolean {
  return series.weight_kg !== null || series.reps !== null || Boolean(series.comment?.trim())
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(v => (v == null ? '' : String(v))).map(v => v.trim())
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []

    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed.map(v => (v == null ? '' : String(v))).map(v => v.trim())
      }
    } catch {
      return [trimmed]
    }
  }

  return []
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
