import { useEffect, useState } from 'react'

const numOrNull = (v) => (v === '' || v == null ? null : Number(v))

// Manage the reusable gym exercise library and the curated alternate swaps
// between exercises. Field edits persist on blur; alternates persist on toggle.
export default function Library({ data }) {
  const { library, alternates, db, userId, reload } = data
  const [draft, setDraft] = useState([])
  const [openAlts, setOpenAlts] = useState(null) // exercise id whose alternates panel is open
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setDraft(library.map((e) => ({ ...e })))
  }, [library])

  const fail = (e) => alert('Save failed: ' + (e.message || e))

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

  const patch = (id, p) => setDraft((ds) => ds.map((e) => (e.id === id ? { ...e, ...p } : e)))
  const persist = (id, p) => db.updateLibraryExercise(id, p).catch(fail)

  const addExercise = () => run(() => db.addLibraryExercise(userId))

  const toggleAlternate = (aId, bId, isAlt) =>
    run(() => (isAlt ? db.removeAlternate(aId, bId) : db.addAlternate(userId, aId, bId)))

  // Group by muscle for display.
  const groups = draft.reduce((acc, e) => {
    ;(acc[e.muscle_group || 'Other'] ||= []).push(e)
    return acc
  }, {})

  return (
    <>
      <section className="card create-row">
        <h2>Exercise library</h2>
        <button className="primary" onClick={addExercise} disabled={busy}>+ Add exercise</button>
      </section>

      {Object.entries(groups).map(([group, items]) => (
        <section className="card" key={group}>
          <h3 className="muscle-head">{group}</h3>
          {items.map((ex) => {
            const bodyweight = ex.default_weight == null
            const myAlts = alternates[ex.id] || []
            return (
              <div className="lib-ex" key={ex.id}>
                <div className="lib-ex-top">
                  <input
                    className="ex-name"
                    value={ex.name}
                    onChange={(e) => patch(ex.id, { name: e.target.value })}
                    onBlur={(e) => persist(ex.id, { name: e.target.value })}
                  />
                  <button
                    className="delete ex-del-sm"
                    disabled={busy}
                    onClick={() => { if (confirm('Delete this exercise?')) run(() => db.deleteLibraryExercise(ex.id)) }}
                    aria-label="Delete exercise"
                  >✕</button>
                </div>

                <div className="ex-fields">
                  <label>
                    Muscle
                    <input
                      value={ex.muscle_group ?? ''}
                      onChange={(e) => patch(ex.id, { muscle_group: e.target.value })}
                      onBlur={(e) => persist(ex.id, { muscle_group: e.target.value })}
                    />
                  </label>
                  <label>
                    Sets
                    <input
                      type="number" min="1" inputMode="numeric"
                      value={ex.default_sets ?? ''}
                      onChange={(e) => patch(ex.id, { default_sets: e.target.value })}
                      onBlur={(e) => persist(ex.id, { default_sets: numOrNull(e.target.value) ?? 1 })}
                    />
                  </label>
                  <label>
                    Reps
                    <input
                      value={ex.default_reps ?? ''}
                      onChange={(e) => patch(ex.id, { default_reps: e.target.value })}
                      onBlur={(e) => persist(ex.id, { default_reps: e.target.value })}
                    />
                  </label>
                  <label>
                    Weight
                    <input
                      type="number" step="any" inputMode="decimal"
                      disabled={bodyweight}
                      value={bodyweight ? '' : ex.default_weight}
                      onChange={(e) => patch(ex.id, { default_weight: e.target.value })}
                      onBlur={(e) => persist(ex.id, { default_weight: numOrNull(e.target.value) })}
                    />
                  </label>
                  <label>
                    Step
                    <input
                      type="number" step="any" inputMode="decimal"
                      disabled={bodyweight}
                      value={ex.step ?? ''}
                      onChange={(e) => patch(ex.id, { step: e.target.value })}
                      onBlur={(e) => persist(ex.id, { step: numOrNull(e.target.value) ?? 2.5 })}
                    />
                  </label>
                  <label>
                    Unit
                    <input
                      value={ex.unit ?? ''}
                      onChange={(e) => patch(ex.id, { unit: e.target.value })}
                      onBlur={(e) => persist(ex.id, { unit: e.target.value })}
                    />
                  </label>
                  <label className="bw-toggle">
                    <input
                      type="checkbox"
                      checked={bodyweight}
                      onChange={(e) => {
                        const p = e.target.checked ? { default_weight: null } : { default_weight: 20 }
                        patch(ex.id, p)
                        persist(ex.id, p)
                      }}
                    />
                    Bodyweight
                  </label>
                </div>

                <button
                  className="alt-toggle"
                  onClick={() => setOpenAlts((o) => (o === ex.id ? null : ex.id))}
                >
                  ⇄ Alternates{myAlts.length ? ` (${myAlts.length})` : ''}
                </button>

                {openAlts === ex.id && (
                  <div className="alt-checklist">
                    {draft.filter((o) => o.id !== ex.id).map((o) => {
                      const isAlt = myAlts.includes(o.id)
                      return (
                        <label key={o.id} className={isAlt ? 'alt-check on' : 'alt-check'}>
                          <input
                            type="checkbox"
                            checked={isAlt}
                            disabled={busy}
                            onChange={() => toggleAlternate(ex.id, o.id, isAlt)}
                          />
                          {o.name}
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </section>
      ))}
    </>
  )
}
