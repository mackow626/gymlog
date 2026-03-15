import { useEffect, useState } from 'react'
import { api } from '../hooks/api'
import type { Page } from '../App'

interface ExerciseEntry { exercise_id: number | null; weight_kg: string; reps: string; sets: string }
interface TriSet { exercises: ExerciseEntry[] }

const emptyEx = (): ExerciseEntry => ({ exercise_id: null, weight_kg: '', reps: '', sets: '3' })
const emptyTriset = (): TriSet => ({ exercises: [emptyEx(), emptyEx(), emptyEx()] })

interface Props { setPage: (p: Page) => void }

export function NewSession({ setPage }: Props) {
  const [allExercises, setAllExercises] = useState<any[]>([])
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [trisets, setTrisets] = useState<TriSet[]>([emptyTriset()])
  const [saving, setSaving] = useState(false)

  useEffect(() => { api.getExercises().then(setAllExercises) }, [])

  const updateEx = (ti: number, ei: number, field: keyof ExerciseEntry, value: any) => {
    setTrisets(ts => ts.map((t, i) =>
      i !== ti ? t : {
        ...t,
        exercises: t.exercises.map((e, j) => j !== ei ? e : { ...e, [field]: value })
      }
    ))
  }

  const addTriset = () => setTrisets(ts => [...ts, emptyTriset()])
  const removeTriset = (i: number) => setTrisets(ts => ts.filter((_, j) => j !== i))
  const getExName = (id: number | null) =>
    id ? (allExercises.find(e => e.id === id)?.name ?? null) : null

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        date,
        notes: notes || undefined,
        trisets: trisets.map(ts => ({
          exercises: ts.exercises
            .filter(e => e.exercise_id !== null)
            .map(e => ({
              exercise_id: e.exercise_id!,
              weight_kg: e.weight_kg ? parseFloat(e.weight_kg) : undefined,
              reps: e.reps ? parseInt(e.reps) : undefined,
              sets: e.sets ? parseInt(e.sets) : 1,
            }))
        })).filter(ts => ts.exercises.length > 0)
      }
      await api.createSession(payload)
      setPage({ name: 'dashboard' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Nowy trening</h2>
          <p className="page-sub">Dodaj tri-sety</p>
        </div>
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Zapisuję...' : 'Zapisz trening'}
        </button>
      </div>

      <div className="session-meta">
        <div className="field-group">
          <label className="field-label">Data</label>
          <input className="field-input" type="date" value={date}
            onChange={e => setDate(e.target.value)} />
        </div>
        <div className="field-group">
          <label className="field-label">Notatki (opcjonalnie)</label>
          <input className="field-input" value={notes} placeholder="np. dzień nóg"
            onChange={e => setNotes(e.target.value)} />
        </div>
      </div>

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
                        {ex.sets      && <span className="preview-chip"><span className="chip-val">{ex.sets}</span><span className="chip-unit"> ser</span></span>}
                        {ex.reps      && <span className="preview-chip"><span className="chip-val">{ex.reps}</span><span className="chip-unit"> pow</span></span>}
                        {ex.weight_kg && <span className="preview-chip accent"><span className="chip-val">{ex.weight_kg}</span><span className="chip-unit"> kg</span></span>}
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
                        {allExercises.map(e => (
                          <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                      </select>
                    </div>
                    {/* 3 inputs row */}
                    <div className="ex-inputs-row">
                      <div className="ex-input-cell">
                        <label className="ex-input-label">KG</label>
                        <input className="field-input ex-input"
                          type="number" inputMode="decimal" min="0" step="0.5" placeholder="0"
                          value={ex.weight_kg}
                          onChange={e => updateEx(ti, ei, 'weight_kg', e.target.value)} />
                      </div>
                      <div className="ex-input-cell">
                        <label className="ex-input-label">POWT.</label>
                        <input className="field-input ex-input"
                          type="number" inputMode="numeric" min="1" placeholder="0"
                          value={ex.reps}
                          onChange={e => updateEx(ti, ei, 'reps', e.target.value)} />
                      </div>
                      <div className="ex-input-cell">
                        <label className="ex-input-label">SERIE</label>
                        <input className="field-input ex-input"
                          type="number" inputMode="numeric" min="1" placeholder="0"
                          value={ex.sets}
                          onChange={e => updateEx(ti, ei, 'sets', e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <button className="btn-outline btn-add-triset" onClick={addTriset}>
        + Dodaj tri-set
      </button>
    </div>
  )
}
