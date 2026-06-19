import { useState } from 'react'

// Avoid floating-point drift from repeated 2.5 steps.
function round(n) {
  return Math.round(n * 100) / 100
}

function WeightStepper({ exercise, onSetWeight }) {
  if (exercise.weight == null) {
    return <div className="weight bodyweight">Bodyweight</div>
  }
  const step = exercise.step || 2.5
  const dec = () => onSetWeight(Math.max(0, round(exercise.weight - step)))
  const inc = () => onSetWeight(round(exercise.weight + step))
  return (
    <div className="weight">
      <button className="step" onClick={dec} aria-label="Decrease weight">−</button>
      <div className="weight-value">
        <span className="num">{exercise.weight}</span>
        <span className="unit">{exercise.unit}</span>
      </div>
      <button className="step" onClick={inc} aria-label="Increase weight">+</button>
    </div>
  )
}

function AlternatePicker({ exercise, onChoose }) {
  const [open, setOpen] = useState(false)
  if (!exercise.alternates || exercise.alternates.length === 0) return null
  return (
    <div className="alt">
      <button className="alt-toggle" onClick={() => setOpen((o) => !o)}>
        ⇄ Alternate{open ? '' : ` (${exercise.alternates.length})`}
      </button>
      {open && (
        <div className="alt-list">
          {exercise.alternates.map((alt) => (
            <button
              key={alt.id}
              className="alt-option"
              onClick={() => {
                onChoose(alt)
                setOpen(false)
              }}
            >
              {alt.name}
              <span className="small">{alt.muscle_group}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function GymSession({ session, onSetWeight, onToggleDone, onChooseAlternate, onFinish, onCancel }) {
  const doneCount = session.exercises.filter((e) => e.done).length
  const total = session.exercises.length

  return (
    <>
      <section className="card session-head">
        <div>
          <h2>{session.workoutName}</h2>
          <div className="small">{session.date}</div>
        </div>
        <div className="progress">{doneCount}/{total} done</div>
      </section>

      {session.exercises.map((e, i) => (
        <section className={e.done ? 'card exercise-card done' : 'card exercise-card'} key={i}>
          <div className="exercise-top">
            <div className="exercise-name">
              {e.name}
              {e.swappedFromId && <span className="swapped"> (swapped)</span>}
            </div>
            <div className="small">{e.sets} sets × {e.reps}{e.muscleGroup ? ` · ${e.muscleGroup}` : ''}</div>
          </div>

          <WeightStepper exercise={e} onSetWeight={(w) => onSetWeight(i, w)} />

          <div className="exercise-actions">
            <AlternatePicker exercise={e} onChoose={(alt) => onChooseAlternate(i, alt)} />
            <button
              className={e.done ? 'complete done' : 'complete'}
              onClick={() => onToggleDone(i)}
            >
              {e.done ? '✓ Completed' : 'Mark complete'}
            </button>
          </div>
        </section>
      ))}

      <div className="actions">
        <button className="primary big" onClick={onFinish}>✓ Complete day</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </>
  )
}

function SimpleSession({ session, onPatchSimple, onFinish, onCancel }) {
  return (
    <>
      <section className="card session-head">
        <div>
          <h2>{session.workoutName}</h2>
          <div className="small">{session.date} · {session.category}</div>
        </div>
      </section>

      <section className="card">
        <label className="field">
          Duration (minutes)
          <input
            type="number" min="0" inputMode="numeric"
            value={session.durationMin ?? ''}
            onChange={(e) => onPatchSimple({ durationMin: e.target.value === '' ? null : Number(e.target.value) })}
          />
        </label>
        <label className="field">
          Notes
          <textarea
            rows={3}
            value={session.notes ?? ''}
            placeholder="How did it go?"
            onChange={(e) => onPatchSimple({ notes: e.target.value })}
          />
        </label>
      </section>

      <div className="actions">
        <button className="primary big" onClick={onFinish}>✓ Complete</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </>
  )
}

export default function Session(props) {
  return props.session.category === 'gym' ? (
    <GymSession {...props} />
  ) : (
    <SimpleSession {...props} />
  )
}
