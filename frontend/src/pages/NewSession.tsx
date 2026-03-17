import { useEffect, useMemo, useState } from 'react'
import { api } from '../hooks/api'
import type { Page } from '../App'

interface SeriesEntry { weight_kg: string; reps: string }
interface ExerciseEntry { exercise_id: number | null; series: SeriesEntry[] }
interface TriSet { exercises: ExerciseEntry[] }
interface SessionPayload {
  date: string
  notes?: string
  trisets: Array<{
    exercises: Array<{ exercise_id: number; series: Array<{ weight_kg?: number; reps?: number }> }>
  }>
}

const emptySeries = (): SeriesEntry => ({ weight_kg: '', reps: '' })
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

  const updateEx = (ti: number, ei: number, field: keyof ExerciseEntry, value: any) => {
    setErrors(current => ({ ...current, general: undefined }))
    setTrisets(ts => ts.map((t, i) =>
      i !== ti ? t : {
        ...t,
        exercises: t.exercises.map((e, j) => j !== ei ? e : { ...e, [field]: value })
      }
    ))
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
              }))
              .filter(s => s.weight_kg !== undefined || s.reps !== undefined)
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

  if (loading) return <div className="loading"><div className="spinner" /></div>

  return (
    <div className="page">
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
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Zapisuję...' : sessionId ? 'Zapisz zmiany' : 'Zapisz trening'}
        </button>
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
                          .filter(s => s.weight_kg || s.reps)
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
                        onChange={e => updateEx(ti, ei, 'exercise_id', e.target.value ? parseInt(e.target.value) : null)}
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
                                onChange={e => updateSeries(ti, ei, si, 'weight_kg', e.target.value)} />
                            </div>
                            <div className="ex-input-cell">
                              <label className="ex-input-label">POWT.</label>
                              <input className="field-input ex-input"
                                type="number" inputMode="numeric" min="1" placeholder="0"
                                value={series.reps}
                                onChange={e => updateSeries(ti, ei, si, 'reps', e.target.value)} />
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
              </div>
            </div>
          )
        })}
      </div>

      <button className="btn-outline btn-add-triset" onClick={addTriset}>
        + Dodaj nowy tri-set
      </button>
    </div>
  )
}

function mapSessionToTrisets(session: any): TriSet[] {
  const trisets = session.trisets?.map((ts: any) => ({
    exercises: Array.from({ length: 3 }, (_, index) => {
      const exercise = ts.exercises?.find((ex: any) => ex.position === index + 1)
      if (!exercise) return emptyEx()

      return {
        exercise_id: exercise.exercise_id ?? null,
        series: parseSeriesFromApi(exercise),
      }
    })
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
  const fromArrays = Math.max(parsedWeights.length, parsedReps.length)
  const fromCount = Number.isFinite(Number(exercise.sets)) ? Number(exercise.sets) : 0
  const count = Math.max(fromArrays, fromCount, 1)

  return Array.from({ length: count }, (_, index) => ({
    weight_kg: parsedWeights[index] !== undefined && parsedWeights[index] !== null
      ? String(parsedWeights[index])
      : '',
    reps: parsedReps[index] !== undefined && parsedReps[index] !== null
      ? String(parsedReps[index])
      : '',
  }))
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
