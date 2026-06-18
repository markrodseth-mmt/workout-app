export default function History({ history, onDelete }) {
  if (!history.length) {
    return <section className="card">No saved workouts yet.</section>
  }
  // newest first
  const ordered = history.map((h, i) => ({ h, i })).reverse()
  return (
    <section className="card">
      <h2>History</h2>
      {ordered.map(({ h, i }) => (
        <div className="history-item" key={i}>
          <button className="delete" onClick={() => onDelete(i)}>Delete</button>
          <span className="done">{h.date}</span> — Day {h.day}
          <br />
          {h.entries.map((e, j) => (
            <span key={j}>
              {e.exercise}: {e.actualWeight || e.planned}; {e.repsNotes || 'no notes'}
              <br />
            </span>
          ))}
        </div>
      ))}
    </section>
  )
}
