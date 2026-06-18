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

// Avoid floating-point drift from repeated 2.5 steps.
function round(n) {
  return Math.round(n * 100) / 100
}

export default function Session({ session, dayLabel, onSetWeight, onToggleDone, onFinish, onCancel }) {
  const doneCount = session.exercises.filter((e) => e.done).length
  const total = session.exercises.length

  return (
    <>
      <section className="card session-head">
        <div>
          <h2>{dayLabel}</h2>
          <div className="small">{session.date}</div>
        </div>
        <div className="progress">{doneCount}/{total} done</div>
      </section>

      {session.exercises.map((e, i) => (
        <section className={e.done ? 'card exercise-card done' : 'card exercise-card'} key={i}>
          <div className="exercise-top">
            <div className="exercise-name">{e.name}</div>
            <div className="small">{e.sets} sets × {e.reps}</div>
          </div>

          <WeightStepper exercise={e} onSetWeight={(w) => onSetWeight(i, w)} />

          <button
            className={e.done ? 'complete done' : 'complete'}
            onClick={() => onToggleDone(i)}
          >
            {e.done ? '✓ Completed' : 'Mark complete'}
          </button>
        </section>
      ))}

      <div className="actions">
        <button className="primary big" onClick={onFinish}>Finish & save</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </>
  )
}
