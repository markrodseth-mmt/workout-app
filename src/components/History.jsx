const CATEGORY_ICON = { gym: '🏋️', tennis: '🎾', yoga: '🧘', other: '⭐' }

function exportCSV(history) {
  let csv = 'date,workout,category,duration_min,exercise,sets,reps,weight,unit,completed\n'
  for (const h of history) {
    if (h.category === 'gym' && h.session_exercises.length) {
      for (const e of h.session_exercises) {
        csv += [h.performed_on, h.workout_name, h.category, h.duration_min ?? '', e.name, e.sets ?? '', e.reps ?? '', e.weight ?? '', e.unit, e.done ? 'yes' : 'no']
          .map((v) => `"${String(v ?? '').replaceAll('"', '""')}"`)
          .join(',') + '\n'
      }
    } else {
      csv += [h.performed_on, h.workout_name, h.category, h.duration_min ?? '', '', '', '', '', '', 'yes']
        .map((v) => `"${String(v ?? '').replaceAll('"', '""')}"`)
        .join(',') + '\n'
    }
  }
  const blob = new Blob([csv], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'workout-history.csv'
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function History({ history, onDelete }) {
  if (!history.length) {
    return <section className="card">No saved workouts yet.</section>
  }

  return (
    <>
      <div className="actions">
        <button onClick={() => exportCSV(history)}>Export CSV</button>
      </div>
      {history.map((h) => {
        const exs = h.session_exercises || []
        const done = exs.filter((e) => e.done).length
        return (
          <section className="card history-item" key={h.id}>
            <div className="history-head">
              <div>
                <strong>{h.performed_on}</strong> — {CATEGORY_ICON[h.category] || '⭐'} {h.workout_name}
                <div className="small">
                  {h.category === 'gym'
                    ? `${done}/${exs.length} completed`
                    : [h.duration_min ? `${h.duration_min} min` : null, 'completed'].filter(Boolean).join(' · ')}
                </div>
              </div>
              <button className="delete" onClick={() => onDelete(h.id)}>Delete</button>
            </div>

            {h.category === 'gym' && exs.length > 0 && (
              <ul className="preview">
                {exs.map((e) => (
                  <li key={e.id}>
                    <span className={e.done ? 'done-mark' : 'skip-mark'}>
                      {e.done ? '✓' : '–'} {e.name}{e.swapped_from_id ? ' (swapped)' : ''}
                    </span>
                    <span className="small">{e.weight != null ? `${e.weight} ${e.unit}` : e.unit}</span>
                  </li>
                ))}
              </ul>
            )}
            {h.notes && <p className="small notes">{h.notes}</p>}
          </section>
        )
      })}
    </>
  )
}
