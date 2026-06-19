import { useEffect, useState } from 'react'
import { CATEGORIES } from '../data/seed.js'

const numOrNull = (v) => (v === '' || v == null ? null : Number(v))

// Build and edit workout templates: name, category, and (for gym) the ordered
// list of exercises drawn from the library with their sets/reps/target weight.
export default function Workouts({ data }) {
  const { workouts, library, db, userId, reload } = data
  const [draft, setDraft] = useState([])
  const [newName, setNewName] = useState('')
  const [newCat, setNewCat] = useState('gym')
  const [picker, setPicker] = useState({}) // workoutId -> selected library id
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setDraft(workouts.map((w) => ({ ...w, exercises: w.exercises.map((e) => ({ ...e })) })))
  }, [workouts])

  const fail = (e) => alert('Save failed: ' + (e.message || e))

  // Structural changes reload so Plan/Session stay in sync.
  const run = async (fn) => {
    setBusy(true)
    try {
      await fn()
      await reload()
    } catch (e) {
      fail(e)
    } finally {
      setBusy(false)
    }
  }

  const createWorkout = () => {
    const name = newName.trim() || 'New workout'
    setNewName('')
    run(() => db.addWorkout(userId, name, newCat))
  }

  const patchWex = (wid, exId, patch) =>
    setDraft((ds) =>
      ds.map((w) =>
        w.id !== wid ? w : { ...w, exercises: w.exercises.map((e) => (e.id === exId ? { ...e, ...patch } : e)) },
      ),
    )

  const persistWex = (exId, patch) => db.updateWorkoutExercise(exId, patch).catch(fail)

  const addExercise = (wid) => {
    const libId = picker[wid]
    if (!libId) return
    const lib = library.find((l) => l.id === libId)
    const w = draft.find((d) => d.id === wid)
    setPicker((p) => ({ ...p, [wid]: '' }))
    run(() => db.addWorkoutExercise(userId, wid, lib, w.exercises.length))
  }

  const byMuscle = library.reduce((acc, l) => {
    ;(acc[l.muscle_group || 'Other'] ||= []).push(l)
    return acc
  }, {})

  return (
    <>
      <section className="card create-row">
        <h2>Workouts</h2>
        <div className="create-fields">
          <input
            placeholder="New workout name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <select value={newCat} onChange={(e) => setNewCat(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button className="primary" onClick={createWorkout} disabled={busy}>+ Create</button>
        </div>
      </section>

      {draft.map((w) => (
        <section className="card" key={w.id}>
          <div className="editor-day-head">
            <input
              className="day-label-input"
              value={w.name}
              onChange={(e) => setDraft((ds) => ds.map((d) => (d.id === w.id ? { ...d, name: e.target.value } : d)))}
              onBlur={(e) => db.updateWorkout(w.id, { name: e.target.value }).catch(fail)}
            />
            <select
              className="cat-select"
              value={w.category}
              onChange={(e) => {
                const category = e.target.value
                setDraft((ds) => ds.map((d) => (d.id === w.id ? { ...d, category } : d)))
                db.updateWorkout(w.id, { category }).catch(fail)
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button className="delete" disabled={busy} onClick={() => {
              if (confirm('Delete this workout?')) run(() => db.deleteWorkout(w.id))
            }}>Delete</button>
          </div>

          {w.category !== 'gym' ? (
            <p className="small">Logged as completion + duration & notes — no exercises.</p>
          ) : (
            <>
              {w.exercises.length === 0 && <p className="small">No exercises yet. Add some below.</p>}
              {w.exercises.map((ex) => {
                const bodyweight = ex.target_weight == null
                return (
                  <div className="editor-ex" key={ex.id}>
                    <div className="wex-name">
                      <span>{ex.exercise?.name ?? 'Exercise'}</span>
                      <button
                        className="delete ex-del-sm"
                        disabled={busy}
                        onClick={() => run(() => db.deleteWorkoutExercise(ex.id))}
                        aria-label="Remove exercise"
                      >✕</button>
                    </div>
                    <div className="ex-fields">
                      <label>
                        Sets
                        <input
                          type="number" min="1" inputMode="numeric"
                          value={ex.sets ?? ''}
                          onChange={(e) => patchWex(w.id, ex.id, { sets: e.target.value })}
                          onBlur={(e) => persistWex(ex.id, { sets: numOrNull(e.target.value) ?? 1 })}
                        />
                      </label>
                      <label>
                        Reps
                        <input
                          value={ex.reps ?? ''}
                          onChange={(e) => patchWex(w.id, ex.id, { reps: e.target.value })}
                          onBlur={(e) => persistWex(ex.id, { reps: e.target.value })}
                        />
                      </label>
                      <label>
                        Weight
                        <input
                          type="number" step="any" inputMode="decimal"
                          disabled={bodyweight}
                          value={bodyweight ? '' : ex.target_weight}
                          onChange={(e) => patchWex(w.id, ex.id, { target_weight: e.target.value })}
                          onBlur={(e) => persistWex(ex.id, { target_weight: numOrNull(e.target.value) })}
                        />
                      </label>
                      <label className="bw-toggle">
                        <input
                          type="checkbox"
                          checked={bodyweight}
                          onChange={(e) => {
                            const patch = e.target.checked
                              ? { target_weight: null }
                              : { target_weight: ex.exercise?.default_weight ?? 20 }
                            patchWex(w.id, ex.id, patch)
                            persistWex(ex.id, patch)
                          }}
                        />
                        Bodyweight
                      </label>
                    </div>
                  </div>
                )
              })}

              <div className="add-ex-row">
                <select
                  value={picker[w.id] || ''}
                  onChange={(e) => setPicker((p) => ({ ...p, [w.id]: e.target.value }))}
                >
                  <option value="">Add exercise from library…</option>
                  {Object.entries(byMuscle).map(([group, items]) => (
                    <optgroup key={group} label={group}>
                      {items.map((l) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <button onClick={() => addExercise(w.id)} disabled={busy || !picker[w.id]}>+ Add</button>
              </div>
            </>
          )}
        </section>
      ))}
    </>
  )
}
