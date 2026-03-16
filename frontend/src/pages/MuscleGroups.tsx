import { useEffect, useState } from 'react'
import { api } from '../hooks/api'

export function MuscleGroups() {
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [name, setName] = useState('')

  const load = () => api.getMuscleGroups().then(setGroups).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditing(null)
    setName('')
    setShowForm(true)
  }

  const openEdit = (group: any) => {
    setEditing(group)
    setName(group.name)
    setShowForm(true)
  }

  const save = async () => {
    if (!name.trim()) return
    if (editing) {
      await api.updateMuscleGroup(editing.id, { name: name.trim() })
    } else {
      await api.createMuscleGroup({ name: name.trim() })
    }
    setShowForm(false)
    load()
  }

  const deleteGroup = async (id: number) => {
    if (confirm('Na pewno usunąć tę partię ciała?')) {
      await api.deleteMuscleGroup(id)
      load()
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Partie ciała</h2>
          <p className="page-sub">Zarządzaj grupami mięśni</p>
        </div>
        <button className="btn-primary" onClick={openNew}>
          + Dodaj
        </button>
      </div>

      {loading && <div className="loading"><div className="spinner" /></div>}

      {!loading && (
        <>
          {groups.length === 0 ? (
            <div className="empty-state">
              <p>Brak partii ciała</p>
              <button className="btn-ghost" onClick={openNew}>Dodaj pierwszą</button>
            </div>
          ) : (
            <div className="muscle-groups-list">
              {groups.map(group => (
                <div key={group.id} className="muscle-group-row">
                  <span className="muscle-group-name">{group.name}</span>
                  <div className="muscle-group-actions">
                    <button className="btn-icon" onClick={() => openEdit(group)}>✎</button>
                    <button className="btn-icon btn-danger" onClick={() => deleteGroup(group.id)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">{editing ? 'Edytuj partię' : 'Nowa partia'}</h3>
            <div className="field-group">
              <label className="field-label">Nazwa</label>
              <input
                className="field-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="np. klatka piersiowa"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && save()}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setShowForm(false)}>Anuluj</button>
              <button className="btn-primary" onClick={save}>Zapisz</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
