import { useState } from 'react'

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const CATEGORY_ICON = { gym: '🏋️', tennis: '🎾', yoga: '🧘', other: '⭐' }

export default function Plan({ data, liveSession, onStart, onResume }) {
  const { schedule, workouts, db, userId, reload } = data
  const [adding, setAdding] = useState('')
  const [busy, setBusy] = useState(false)

  const fail = (e) => alert('Failed: ' + (e.message || e))
  const workoutById = Object.fromEntries(workouts.map((w) => [w.id, w]))

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

  const addToPlan = () => {
    if (!adding) return
    const workoutId = adding
    setAdding('')
    run(() => db.addScheduleEntry(userId, workoutId, schedule.length))
  }

  const exerciseCount = (workoutId) => workoutById[workoutId]?.exercises?.length ?? 0

  return (
    <>
      {liveSession && (
        <section className="card resume">
          <div>
            In progress — <strong>{liveSession.workoutName}</strong>
          </div>
          <button className="primary" onClick={onResume}>Resume</button>
        </section>
      )}

      <section className="card">
        <h2>This week</h2>
        <p className="small">Your plan — aim for ~3 a week. Tap a workout to start it.</p>
      </section>

      {schedule.length === 0 && (
        <section className="card center small">
          Nothing planned yet. Add a workout below.
        </section>
      )}

      {schedule.map((entry) => {
        const w = entry.workout
        if (!w) return null
        const count = exerciseCount(w.id)
        return (
          <section className="card plan-row" key={entry.id}>
            <div className="plan-main">
              <div className="plan-title">
                <span className="cat-icon">{CATEGORY_ICON[w.category] || '⭐'}</span>
                <span className="plan-name">{w.name}</span>
              </div>
              <div className="small">
                {w.category === 'gym' ? `${count} exercise${count === 1 ? '' : 's'}` : w.category}
              </div>
            </div>

            <div className="plan-controls">
              <select
                className="dow"
                value={entry.day_of_week ?? ''}
                disabled={busy}
                onChange={(e) =>
                  run(() =>
                    db.updateScheduleEntry(entry.id, {
                      day_of_week: e.target.value === '' ? null : Number(e.target.value),
                    }),
                  )
                }
              >
                <option value="">Any day</option>
                {DOW.map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
              <button className="primary start-sm" onClick={() => onStart(w)}>▶ Start</button>
              <button
                className="delete"
                disabled={busy}
                onClick={() => run(() => db.deleteScheduleEntry(entry.id))}
                aria-label="Remove from plan"
              >
                ✕
              </button>
            </div>
          </section>
        )
      })}

      <section className="card add-plan">
        <select value={adding} onChange={(e) => setAdding(e.target.value)} disabled={busy}>
          <option value="">Add a workout to the plan…</option>
          {workouts.map((w) => (
            <option key={w.id} value={w.id}>
              {(CATEGORY_ICON[w.category] || '⭐') + ' ' + w.name}
            </option>
          ))}
        </select>
        <button onClick={addToPlan} disabled={busy || !adding}>+ Add</button>
      </section>
    </>
  )
}
