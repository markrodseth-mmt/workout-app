import { useEffect, useState } from 'react'

// Edits the user's workout templates (days + exercises). Field edits persist on
// blur; structural changes (add/delete) persist immediately. data.days is only
// re-read on load, so local edits aren't clobbered until we reload() on Done.
export default function WorkoutEditor({ data, onDone }) {
  const { db, userId } = data
  const [draft, setDraft] = useState([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setDraft(data.days.map((d) => ({ ...d, exercises: d.exercises.map((e) => ({ ...e })) })))
  }, [data.days])

  const fail = (e) => alert('Save failed: ' + (e.message || e))

  const patchExercise = (dayId, exId, patch) =>
    setDraft((ds) =>
      ds.map((d) =>
        d.id !== dayId
          ? d
          : { ...d, exercises: d.exercises.map((e) => (e.id === exId ? { ...e, ...patch } : e)) },
      ),
    )

  const persistExercise = (exId, patch) => db.updateExercise(exId, patch).catch(fail)

  const addExercise = async (dayId) => {
    try {
      const day = draft.find((d) => d.id === dayId)
      const row = await db.addExercise(userId, dayId, day.exercises.length)
      setDraft((ds) => ds.map((d) => (d.id === dayId ? { ...d, exercises: [...d.exercises, row] } : d)))
    } catch (e) {
      fail(e)
    }
  }

  const removeExercise = async (dayId, exId) => {
    try {
      await db.deleteExercise(exId)
      setDraft((ds) =>
        ds.map((d) => (d.id === dayId ? { ...d, exercises: d.exercises.filter((e) => e.id !== exId) } : d)),
      )
    } catch (e) {
      fail(e)
    }
  }

  const addDay = async () => {
    try {
      const row = await db.addDay(userId, `Day ${draft.length + 1}`, draft.length)
      setDraft((ds) => [...ds, row])
    } catch (e) {
      fail(e)
    }
  }

  const removeDay = async (dayId) => {
    if (!confirm('Delete this entire day and all its exercises?')) return
    try {
      await db.deleteDay(dayId)
      setDraft((ds) => ds.filter((d) => d.id !== dayId))
    } catch (e) {
      fail(e)
    }
  }

  const done = async () => {
    setBusy(true)
    await data.reload()
    setBusy(false)
    onDone()
  }

  const numOrNull = (v) => (v === '' || v == null ? null : Number(v))

  return (
    <>
      <section className="card editor-head">
        <h2>Edit workouts</h2>
        <button className="primary" onClick={done} disabled={busy}>
          {busy ? 'Saving…' : 'Done'}
        </button>
      </section>

      {draft.map((day) => (
        <section className="card" key={day.id}>
          <div className="editor-day-head">
            <input
              className="day-label-input"
              value={day.label}
              onChange={(e) => setDraft((ds) => ds.map((d) => (d.id === day.id ? { ...d, label: e.target.value } : d)))}
              onBlur={(e) => db.updateDay(day.id, { label: e.target.value }).catch(fail)}
            />
            <button className="delete" onClick={() => removeDay(day.id)}>Delete day</button>
          </div>

          {day.exercises.map((ex) => {
            const bodyweight = ex.weight == null
            return (
              <div className="editor-ex" key={ex.id}>
                <input
                  className="ex-name"
                  value={ex.name}
                  onChange={(e) => patchExercise(day.id, ex.id, { name: e.target.value })}
                  onBlur={(e) => persistExercise(ex.id, { name: e.target.value })}
                />
                <div className="ex-fields">
                  <label>
                    Sets
                    <input
                      type="number" min="1" inputMode="numeric"
                      value={ex.sets ?? ''}
                      onChange={(e) => patchExercise(day.id, ex.id, { sets: e.target.value })}
                      onBlur={(e) => persistExercise(ex.id, { sets: numOrNull(e.target.value) ?? 1 })}
                    />
                  </label>
                  <label>
                    Reps
                    <input
                      value={ex.reps ?? ''}
                      onChange={(e) => patchExercise(day.id, ex.id, { reps: e.target.value })}
                      onBlur={(e) => persistExercise(ex.id, { reps: e.target.value })}
                    />
                  </label>
                  <label>
                    Weight
                    <input
                      type="number" step="any" inputMode="decimal"
                      disabled={bodyweight}
                      value={bodyweight ? '' : ex.weight}
                      onChange={(e) => patchExercise(day.id, ex.id, { weight: e.target.value })}
                      onBlur={(e) => persistExercise(ex.id, { weight: numOrNull(e.target.value) })}
                    />
                  </label>
                  <label>
                    Step
                    <input
                      type="number" step="any" inputMode="decimal"
                      disabled={bodyweight}
                      value={ex.step ?? ''}
                      onChange={(e) => patchExercise(day.id, ex.id, { step: e.target.value })}
                      onBlur={(e) => persistExercise(ex.id, { step: numOrNull(e.target.value) })}
                    />
                  </label>
                  <label>
                    Unit
                    <input
                      value={ex.unit ?? ''}
                      onChange={(e) => patchExercise(day.id, ex.id, { unit: e.target.value })}
                      onBlur={(e) => persistExercise(ex.id, { unit: e.target.value })}
                    />
                  </label>
                  <label className="bw-toggle">
                    <input
                      type="checkbox"
                      checked={bodyweight}
                      onChange={(e) => {
                        const patch = e.target.checked ? { weight: null, step: null } : { weight: 20, step: 2.5 }
                        patchExercise(day.id, ex.id, patch)
                        persistExercise(ex.id, patch)
                      }}
                    />
                    Bodyweight
                  </label>
                </div>
                <button className="delete ex-del" onClick={() => removeExercise(day.id, ex.id)}>
                  Remove exercise
                </button>
              </div>
            )
          })}

          <button onClick={() => addExercise(day.id)}>+ Add exercise</button>
        </section>
      ))}

      <button className="big" onClick={addDay}>+ Add day</button>
    </>
  )
}
