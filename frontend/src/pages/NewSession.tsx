import { useEffect, useMemo, useState, type WheelEvent } from 'react'
import { api } from '../hooks/api'
import type { Page } from '../App'

interface SeriesEntry { weight_kg: string; reps: string; comment: string }
interface ExerciseEntry { exercise_id: number | null; series: SeriesEntry[] }
interface TriSet { exercises: ExerciseEntry[] }
interface SessionPayload {
  date: string
  notes?: string
  trisets: Array<{
    exercises: Array<{ exercise_id: number; series: Array<{ weight_kg?: number; reps?: number; comment?: string }> }>
  }>
}

const emptySeries = (): SeriesEntry => ({ weight_kg: '', reps: '', comment: '' })
const emptyEx = (): ExerciseEntry => ({ exercise_id: null, series: [emptySeries(), emptySeries(), emptySeries()] })
const emptyTriset = (): TriSet => ({ exercises: [emptyEx(), emptyEx(), emptyEx()] })

interface Props {
  setPage: (p: Page) => void
  sessionId?: number
}

interface ValidationState {
  date?: string
  general?: string
}

export function NewSession({ setPage, sessionId }: Props) {
  const [allExercises, setAllExercises] = useState<any[]>([])
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [trisets, setTrisets] = useState<TriSet[]>([emptyTriset()])
  const [loading, setLoading] = useState(Boolean(sessionId))
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<ValidationState>({})
  const [saveNotice, setSaveNotice] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    Promise.all([
      api.getExercises(),
      sessionId ? api.getSession(sessionId) : Promise.resolve(null),
    ]).then(([exercises, session]) => {
      if (cancelled) return
      setAllExercises(exercises)

      if (session) {
        setDate(session.date)
        setNotes(session.notes ?? '')
        setTrisets(mapSessionToTrisets(session))
      }
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [sessionId])

  useEffect(() => {
    if (saveNotice) setSaveNotice(null)
  }, [date, notes, trisets])

  const updateEx = (ti: number, ei: number, field: keyof ExerciseEntry, value: any) => {
    setErrors(current => ({ ...current, general: undefined }))
    setTrisets(ts => ts.map((t, i) =>
      i !== ti ? t : {
        ...t,
        exercises: t.exercises.map((e, j) => j !== ei ? e : { ...e, [field]: value })
      }
    ))
  }

  const handleExerciseChange = async (ti: number, ei: number, exerciseIdStr: string) => {
    const exerciseId = exerciseIdStr ? parseInt(exerciseIdStr) : null
    
    // Update exercise_id first
    updateEx(ti, ei, 'exercise_id', exerciseId)
    
    // If exercise selected, try to load last stats
    if (exerciseId) {
      try {
        const lastStats = await api.getLastExerciseStats(exerciseId)
        if (lastStats && Array.isArray(lastStats.series) && lastStats.series.length > 0) {
          // Fill all series with suggestions from last workout
          setTrisets(ts => ts.map((t, i) =>
            i !== ti ? t : {
              ...t,
              exercises: t.exercises.map((e, j) => j !== ei ? e : {
                ...e,
                series: e.series.map((_, seriesIdx) => {
                  const lastSeries = lastStats.series[seriesIdx]
                  return {
                    weight_kg: lastSeries?.weight_kg !== undefined ? String(lastSeries.weight_kg) : '',
                    reps: lastSeries?.reps !== undefined ? String(lastSeries.reps) : '',
                    comment: typeof lastSeries?.comment === 'string' ? lastSeries.comment : '',
                  }
                })
              })
            }
          ))
        } else {
          // No history for exercise: clear suggestion
          setTrisets(ts => ts.map((t, i) =>
            i !== ti ? t : {
              ...t,
              exercises: t.exercises.map((e, j) => j !== ei ? e : {
                ...e,
                series: e.series.map(() => emptySeries())
              })
            }
          ))
        }
      } catch (error) {
        // Silently fail - user can enter values manually
        console.debug('Could not fetch last exercise stats', error)
      }
    }
  }

  const updateSeries = (
    ti: number,
    ei: number,
    si: number,
    field: keyof SeriesEntry,
    value: string
  ) => {
    setErrors(current => ({ ...current, general: undefined }))
    setTrisets(ts => ts.map((t, i) =>
      i !== ti ? t : {
        ...t,
        exercises: t.exercises.map((e, j) => j !== ei ? e : {
          ...e,
          series: e.series.map((s, k) => k !== si ? s : { ...s, [field]: value })
        })
      }
    ))
  }

  const preventNumberScrollChange = (event: WheelEvent<HTMLInputElement>) => {
    event.currentTarget.blur()
  }

  const addSeries = (ti: number, ei: number) => {
    setTrisets(ts => ts.map((t, i) =>
      i !== ti ? t : {
        ...t,
        exercises: t.exercises.map((e, j) => j !== ei ? e : { ...e, series: [...e.series, emptySeries()] })
      }
    ))
  }

  const removeSeries = (ti: number, ei: number, si: number) => {
    setTrisets(ts => ts.map((t, i) =>
      i !== ti ? t : {
        ...t,
        exercises: t.exercises.map((e, j) => {
          if (j !== ei) return e
          if (e.series.length <= 1) return e
          return { ...e, series: e.series.filter((_, k) => k !== si) }
        })
      }
    ))
  }

  const addExerciseToTriset = (ti: number) => {
    setTrisets(ts => ts.map((triset, index) => (
      index !== ti ? triset : { ...triset, exercises: [...triset.exercises, emptyEx()] }
    )))
  }

  const removeExerciseFromTriset = (ti: number, ei: number) => {
    setTrisets(ts => ts.map((triset, index) => {
      if (index !== ti) return triset
      if (triset.exercises.length <= 1) return triset

      return {
        ...triset,
        exercises: triset.exercises.filter((_, exIndex) => exIndex !== ei),
      }
    }))
  }

  const addTriset = () => setTrisets(ts => [...ts, emptyTriset()])
  const removeTriset = (i: number) => setTrisets(ts => ts.filter((_, j) => j !== i))
  const getExName = (id: number | null) =>
    id ? (allExercises.find(e => e.id === id)?.name ?? null) : null

  const groupedExercises = useMemo(() => {
    const groups = new Map<string, any[]>()

    for (const exercise of allExercises) {
      const primaryGroup = getPrimaryMuscleGroup(exercise)
      const list = groups.get(primaryGroup) ?? []
      list.push(exercise)
      groups.set(primaryGroup, list)
    }

    return Array.from(groups.entries())
      .map(([group, exercises]) => ({
        group,
        exercises: exercises.sort((a, b) => a.name.localeCompare(b.name, 'pl')),
      }))
      .sort((a, b) => {
        if (a.group === 'inne') return 1
        if (b.group === 'inne') return -1
        return a.group.localeCompare(b.group, 'pl')
      })
  }, [allExercises])

  const exerciseById = useMemo(() => {
    return new Map(allExercises.map(ex => [Number(ex.id), ex]))
  }, [allExercises])

  const seriesByMuscleGroup = useMemo(() => {
    const totals: Record<string, number> = {}

    for (const triset of trisets) {
      for (const exercise of triset.exercises) {
        if (!exercise.exercise_id) continue

        const exerciseMeta = exerciseById.get(exercise.exercise_id)
        if (!exerciseMeta) continue

        const groups = parseMuscleGroups(exerciseMeta.muscle_groups)
        if (!groups.length) continue

        const seriesCount = exercise.series.filter(hasSeriesData).length
        if (seriesCount < 1) continue

        for (const group of groups) {
          totals[group] = (totals[group] ?? 0) + seriesCount
        }
      }
    }

    return Object.entries(totals).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1]
      return a[0].localeCompare(b[0], 'pl')
    })
  }, [trisets, exerciseById])

  const validate = () => {
    const nextErrors: ValidationState = {}
    const hasAtLeastOneExercise = trisets.some(ts =>
      ts.exercises.some(ex => ex.exercise_id !== null)
    )

    if (!date) nextErrors.date = 'Wybierz datę treningu.'
    if (!hasAtLeastOneExercise) nextErrors.general = 'Dodaj przynajmniej jedno ćwiczenie, żeby zapisać trening.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const buildPayload = (): SessionPayload => ({
    date,
    notes: notes || undefined,
    trisets: trisets.map(ts => ({
      exercises: ts.exercises
        .filter(e => e.exercise_id !== null)
        .map(e => ({
          exercise_id: e.exercise_id!,
          series: (() => {
            const mapped = e.series
              .map(s => ({
                weight_kg: s.weight_kg ? parseFloat(s.weight_kg) : undefined,
                reps: s.reps ? parseInt(s.reps) : undefined,
                comment: s.comment.trim() ? s.comment.trim() : undefined,
              }))
              .filter(s => s.weight_kg !== undefined || s.reps !== undefined || s.comment !== undefined)
            return mapped.length ? mapped : [{}]
          })(),
        }))
    })).filter(ts => ts.exercises.length > 0)
  })

  const save = async () => {
    if (!validate()) return

    setSaving(true)
    try {
      const payload = buildPayload()
      if (sessionId) {
        await api.updateSession(sessionId, payload)
        setPage({ name: 'session', id: sessionId })
      } else {
        const created = await api.createSession(payload)
        setPage({ name: 'session', id: created.id })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nie udało się zapisać treningu.'
      setErrors(current => ({ ...current, general: message }))
    } finally {
      setSaving(false)
    }
  }

  const saveEdit = async (mode: 'stay' | 'exit') => {
    if (!validate() || !sessionId) return

    setSaving(true)
    try {
      const payload = buildPayload()
      await api.updateSession(sessionId, payload)

      if (mode === 'exit') {
        setPage({ name: 'session', id: sessionId })
      } else {
        setSaveNotice('Zapisano zmiany.')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nie udało się zapisać treningu.'
      setErrors(current => ({ ...current, general: message }))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>

  return (
    <div className={sessionId ? 'page page-edit-session' : 'page'}>
      <div className="page-header">
        <div>
          <button
            className="btn-ghost btn-back"
            onClick={() => setPage(sessionId ? { name: 'session', id: sessionId } : { name: 'dashboard' })}
          >
            ← Powrót
          </button>
          <h2 className="page-title">{sessionId ? 'Edytuj trening' : 'Nowy trening'}</h2>
          <p className="page-sub">{sessionId ? 'Zmień dane zapisanej sesji' : 'Dodaj tri-sety'}</p>
        </div>
        {sessionId ? (
          <div className="page-actions">
            <button className="btn-ghost" onClick={() => saveEdit('exit')} disabled={saving}>
              {saving ? 'Zapisuję...' : 'Zapisz i wyjdź'}
            </button>
            <button className="btn-primary" onClick={() => saveEdit('stay')} disabled={saving}>
              {saving ? 'Zapisuję...' : 'Zapisz'}
            </button>
          </div>
        ) : (
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Zapisuję...' : 'Zapisz trening'}
          </button>
        )}
      </div>

      <div className="session-meta">
        <div className="field-group">
          <label className="field-label">Data</label>
          <input className={`field-input ${errors.date ? 'field-input-error' : ''}`} type="date" value={date}
            onChange={e => setDate(e.target.value)} />
          {errors.date && <p className="field-error">{errors.date}</p>}
        </div>
        <div className="field-group">
          <label className="field-label">Notatki (opcjonalnie)</label>
          <input className="field-input" value={notes} placeholder="np. dzień nóg"
            onChange={e => setNotes(e.target.value)} />
        </div>
      </div>

      {errors.general && <div className="form-error-banner">{errors.general}</div>}
      {saveNotice && <div className="form-success-banner">{saveNotice}</div>}

      <div className="trisets-container">
        {trisets.map((ts, ti) => {
          const preview = ts.exercises
            .map((ex, ei) => ({ ex, ei, name: getExName(ex.exercise_id) }))
            .filter(({ name }) => name !== null)

          return (
            <div key={ti} className="triset-card">
              <div className="triset-header">
                <span className="triset-label">Tri-set {ti + 1}</span>
                {trisets.length > 1 && (
                  <button className="btn-ghost btn-danger btn-sm" onClick={() => removeTriset(ti)}>✕</button>
                )}
              </div>

              {/* ── LIVE PREVIEW ── */}
              {preview.length > 0 && (
                <div className="triset-preview">
                  {preview.map(({ ex, ei, name }) => (
                    <div key={ei} className="preview-row">
                      <span className="preview-num">{ei + 1}</span>
                      <span className="preview-name">{name}</span>
                      <div className="preview-chips">
                        {ex.series
                          .filter(s => hasSeriesData(s))
                          .map((s, si) => (
                            <span key={si} className="preview-chip accent">
                              <span className="chip-val">S{si + 1}</span>
                              <span className="chip-unit"> {s.weight_kg || '0'}kg x {s.reps || '0'}</span>
                            </span>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── EXERCISE ROWS ── */}
              <div className="triset-exercises">
                {ts.exercises.map((ex, ei) => (
                  <div key={ei} className="ex-block">
                    {/* select row */}
                    <div className="ex-top-row">
                      <span className="ex-num">{ei + 1}</span>
                      <select
                        className="field-select"
                        value={ex.exercise_id ?? ''}
                        onChange={e => handleExerciseChange(ti, ei, e.target.value)}
                      >
                        <option value="">— wybierz ćwiczenie —</option>
                        {groupedExercises.map(section => (
                          <optgroup key={section.group} label={section.group}>
                            {section.exercises.map(e => (
                              <option key={e.id} value={e.id}>{e.name}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      {ts.exercises.length > 1 && (
                        <button
                          className="btn-ghost btn-danger btn-sm"
                          type="button"
                          onClick={() => removeExerciseFromTriset(ti, ei)}
                        >
                          Usuń ćwiczenie
                        </button>
                      )}
                    </div>
                    <div className="series-list">
                      {ex.series.map((series, si) => (
                        <div key={si} className="series-row">
                          <span className="series-badge">S{si + 1}</span>
                          <div className="series-inputs">
                            <div className="ex-input-cell">
                              <label className="ex-input-label">KG</label>
                              <input className="field-input ex-input"
                                type="number" inputMode="decimal" min="0" step="0.5" placeholder="0"
                                value={series.weight_kg}
                                onWheel={preventNumberScrollChange}
                                onChange={e => updateSeries(ti, ei, si, 'weight_kg', e.target.value)} />
                            </div>
                            <div className="ex-input-cell">
                              <label className="ex-input-label">POWT.</label>
                              <input className="field-input ex-input"
                                type="number" inputMode="numeric" min="1" placeholder="0"
                                value={series.reps}
                                onWheel={preventNumberScrollChange}
                                onChange={e => updateSeries(ti, ei, si, 'reps', e.target.value)} />
                            </div>
                            <div className="ex-input-cell ex-input-cell-wide">
                              <label className="ex-input-label">KOMENTARZ</label>
                              <textarea
                                className="field-input ex-input ex-input-comment"
                                rows={1}
                                placeholder="np. wolne tempo / zapas 2 powt."
                                value={series.comment}
                                onChange={e => updateSeries(ti, ei, si, 'comment', e.target.value)}
                              />
                            </div>
                          </div>
                          {ex.series.length > 1 && (
                            <button
                              className="btn-ghost btn-sm"
                              type="button"
                              onClick={() => removeSeries(ti, ei, si)}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      <button className="btn-ghost btn-sm" type="button" onClick={() => addSeries(ti, ei)}>
                        + Dodaj serię
                      </button>
                    </div>
                  </div>
                ))}
                <button className="btn-ghost btn-sm" type="button" onClick={() => addExerciseToTriset(ti)}>
                  + Dodaj ćwiczenie do tri-setu
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="session-summary-card">
        <div className="session-summary-header">
          <h3 className="section-title session-summary-title">Serie na partie ciała</h3>
          <span className="session-summary-total">
            Łącznie: {seriesByMuscleGroup.reduce((sum, [, count]) => sum + count, 0)}
          </span>
        </div>
        {seriesByMuscleGroup.length === 0 ? (
          <p className="empty-text">Brak danych. Wybierz ćwiczenia i uzupełnij przynajmniej jedną serię.</p>
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

      <button className="btn-outline btn-add-triset" onClick={addTriset}>
        + Dodaj nowy tri-set
      </button>

      {sessionId && (
        <div className="edit-save-bar">
          <button className="btn-ghost" onClick={() => saveEdit('exit')} disabled={saving}>
            {saving ? 'Zapisuję...' : 'Zapisz i wyjdź'}
          </button>
          <button className="btn-primary" onClick={() => saveEdit('stay')} disabled={saving}>
            {saving ? 'Zapisuję...' : 'Zapisz'}
          </button>
        </div>
      )}
    </div>
  )
}

function mapSessionToTrisets(session: any): TriSet[] {
  const trisets = session.trisets?.map((ts: any) => ({
    exercises: (() => {
      const sorted = [...(ts.exercises ?? [])].sort((a, b) => Number(a.position) - Number(b.position))
      const mapped = sorted.map((exercise: any) => ({
        exercise_id: exercise.exercise_id ?? null,
        series: parseSeriesFromApi(exercise),
      }))

      while (mapped.length < 3) {
        mapped.push(emptyEx())
      }

      return mapped
    })()
  }))

  return trisets?.length ? trisets : [emptyTriset()]
}

function getPrimaryMuscleGroup(exercise: any): string {
  const fallback = 'inne'
  try {
    const groups = JSON.parse(exercise.muscle_groups ?? '[]')
    if (Array.isArray(groups) && groups.length > 0 && typeof groups[0] === 'string') {
      return groups[0]
    }
    return fallback
  } catch {
    return fallback
  }
}

function parseSeriesFromApi(exercise: any): SeriesEntry[] {
  const parsedWeights = parseNumberArray(exercise.weight_kg)
  const parsedReps = parseNumberArray(exercise.reps)
  const parsedComments = parseStringArray(exercise.comments)
  const fromArrays = Math.max(parsedWeights.length, parsedReps.length, parsedComments.length)
  const fromCount = Number.isFinite(Number(exercise.sets)) ? Number(exercise.sets) : 0
  const count = Math.max(fromArrays, fromCount, 1)

  return Array.from({ length: count }, (_, index) => ({
    weight_kg: parsedWeights[index] !== undefined && parsedWeights[index] !== null
      ? String(parsedWeights[index])
      : '',
    reps: parsedReps[index] !== undefined && parsedReps[index] !== null
      ? String(parsedReps[index])
      : '',
    comment: parsedComments[index] ?? '',
  }))
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

function parseMuscleGroups(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []

    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      }
    } catch {
      return []
    }
  }

  return []
}

function hasSeriesData(series: SeriesEntry): boolean {
  return Boolean(series.weight_kg || series.reps || series.comment.trim())
}

function parseNumberArray(value: unknown): Array<number | null> {
  if (Array.isArray(value)) {
    return value.map(v => toNullableNumber(v))
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []

    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) return parsed.map(v => toNullableNumber(v))
    } catch {
      const asNumber = Number(trimmed)
      return Number.isFinite(asNumber) ? [asNumber] : []
    }
  }

  if (typeof value === 'number') return [value]
  return []
}

function toNullableNumber(value: unknown): number | null {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}
