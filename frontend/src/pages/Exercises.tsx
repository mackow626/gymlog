import { useEffect, useState } from 'react'
import { api } from '../hooks/api'

const ALL_MUSCLES = [
  'klatka piersiowa','plecy','barki','biceps','triceps',
  'czworogłowe','dwugłowe uda','pośladki','łydki','core','przedramiona'
]

export function Exercises() {
  const [exercises, setExercises] = useState<any[]>([])
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ name: '', muscle_groups: [] as string[] })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const load = () => api.getExercises().then(setExercises).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const toggleMuscle = (m: string) => {
    setForm(f => ({
      ...f,
      muscle_groups: f.muscle_groups.includes(m)
        ? f.muscle_groups.filter(x => x !== m)
        : [...f.muscle_groups, m]
    }))
  }

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', muscle_groups: [] })
    setShowForm(true)
  }

  const openEdit = (ex: any) => {
    setEditing(ex)
    setForm({ name: ex.name, muscle_groups: JSON.parse(ex.muscle_groups) })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.name.trim() || !form.muscle_groups.length) return
    if (editing) {
      await api.updateExercise(editing.id, form)
    } else {
      await api.createExercise(form)
    }
    setShowForm(false)
    load()
  }

  const remove = async (id: number) => {
    if (!confirm('Usuń ćwiczenie?')) return
    await api.deleteExercise(id)
    setExercises(e => e.filter(x => x.id !== id))
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Biblioteka ćwiczeń</h2>
          <p className="page-sub">{exercises.length} ćwiczeń</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Dodaj</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">{editing ? 'Edytuj ćwiczenie' : 'Nowe ćwiczenie'}</h3>
            <label className="field-label">Nazwa</label>
            <input
              className="field-input"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="np. Wyciskanie sztangi"
              autoFocus
            />
            <label className="field-label">Partie mięśni</label>
            <div className="muscle-grid">
              {ALL_MUSCLES.map(m => (
                <button
                  key={m}
                  className={`muscle-tag ${form.muscle_groups.includes(m) ? 'active' : ''}`}
                  onClick={() => toggleMuscle(m)}
                >{m}</button>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setShowForm(false)}>Anuluj</button>
              <button className="btn-primary" onClick={save}>Zapisz</button>
            </div>
          </div>
        </div>
      )}

      {loading && <div className="loading"><div className="spinner" /></div>}

      <div className="exercise-list">
        {exercises.map(ex => {
          const muscles: string[] = JSON.parse(ex.muscle_groups)
          return (
            <div key={ex.id} className="exercise-row">
              <div className="exercise-info">
                <span className="exercise-name">{ex.name}</span>
                <div className="exercise-muscles">
                  {muscles.map(m => <span key={m} className="muscle-badge">{m}</span>)}
                </div>
              </div>
              <div className="exercise-actions">
                <button className="btn-ghost" onClick={() => openEdit(ex)}>✎</button>
                <button className="btn-ghost btn-danger" onClick={() => remove(ex.id)}>✕</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
