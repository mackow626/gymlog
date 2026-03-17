import { useEffect, useState } from 'react'
import { api } from '../hooks/api'

export function Stats() {
  const [period, setPeriod] = useState<'week' | 'month'>('week')
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.getStats(period).then(setStats).finally(() => setLoading(false))
  }, [period])

  const muscleEntries = stats
    ? Object.entries(stats.muscleGroups as Record<string, number>)
        .sort(([, a], [, b]) => (b as number) - (a as number))
    : []

  const maxVal = muscleEntries[0]?.[1] as number ?? 1

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Statystyki</h2>
          <p className="page-sub">Analiza treningów</p>
        </div>
        <div className="period-toggle">
          <button className={`toggle-btn ${period === 'week' ? 'active' : ''}`}
            onClick={() => setPeriod('week')}>7 dni</button>
          <button className={`toggle-btn ${period === 'month' ? 'active' : ''}`}
            onClick={() => setPeriod('month')}>30 dni</button>
        </div>
      </div>

      {loading && <div className="loading"><div className="spinner" /></div>}

      {!loading && stats && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-big">{stats.sessions}</span>
              <span className="stat-label">Treningów</span>
            </div>
            <div className="stat-card">
              <span className="stat-big">{muscleEntries.length}</span>
              <span className="stat-label">Partii mięśni</span>
            </div>
            <div className="stat-card">
              <span className="stat-big">
                {stats.totalSeries ?? 0}
              </span>
              <span className="stat-label">Łącznie serii</span>
            </div>
          </div>

          <div className="section-title">Partie mięśni</div>
          <div className="muscle-bars">
            {muscleEntries.length === 0 && (
              <p className="empty-text">Brak danych dla tego okresu</p>
            )}
            {muscleEntries.map(([muscle, count]) => (
              <div key={muscle} className="muscle-bar-row">
                <span className="muscle-bar-label">{muscle}</span>
                <div className="muscle-bar-track">
                  <div
                    className="muscle-bar-fill"
                    style={{ width: `${((count as number) / maxVal) * 100}%` }}
                  />
                </div>
                <span className="muscle-bar-count">{count as number}</span>
              </div>
            ))}
          </div>

          {stats.perDay?.length > 0 && (
            <>
              <div className="section-title">Aktywność</div>
              <div className="activity-list">
                {stats.perDay.map((d: any) => (
                  <div key={d.date} className="activity-row">
                    <span className="activity-date">
                      {new Date(d.date).toLocaleDateString('pl-PL', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <div className="activity-dots">
                      {Array.from({ length: Math.min(d.exercises, 12) }).map((_, i) => (
                        <span key={i} className="activity-dot" />
                      ))}
                    </div>
                    <span className="activity-count">{d.exercises}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
