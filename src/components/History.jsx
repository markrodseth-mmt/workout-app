export default function History({ history, onDelete, onExport }) {
  if (!history.length) {
    return <section className="card">No saved workouts yet.</section>
  }

  return (
    <>
      <div className="actions">
        <button onClick={onExport}>Export CSV</button>
      </div>
      {history.map((h) => {
        const done = h.exercises.filter((e) => e.done).length
        return (
          <section className="card history-item" key={h.id}>
            <div className="history-head">
              <div>
                <strong>{h.performed_on}</strong> — {h.day_label}
                <div className="small">{done}/{h.exercises.length} completed</div>
              </div>
              <button className="delete" onClick={() => onDelete(h.id)}>Delete</button>
            </div>
            <ul className="preview">
              {h.exercises.map((e, j) => (
                <li key={j}>
                  <span className={e.done ? 'done-mark' : 'skip-mark'}>{e.done ? '✓' : '–'} {e.name}</span>
                  <span className="small">{e.weight != null ? `${e.weight} ${e.unit}` : e.unit}</span>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </>
  )
}
