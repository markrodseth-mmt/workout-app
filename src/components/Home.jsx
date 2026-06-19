const CATEGORY_ICON = { gym: '🏋️', tennis: '🎾', yoga: '🧘', other: '⭐' }

// Landing screen: resume an in-progress workout (front and centre), then a
// quick-start list of the week's planned workouts.
export default function Home({ data, liveSession, onStart, onResume, onGoToPlan }) {
  const { schedule, workouts } = data
  const byId = Object.fromEntries(workouts.map((w) => [w.id, w]))

  return (
    <>
      {liveSession ? (
        <section className="card resume">
          <div className="resume-info">
            <div className="small">Workout in progress</div>
            <div className="resume-name">{liveSession.workoutName}</div>
          </div>
          <button className="primary" onClick={onResume}>Resume</button>
        </section>
      ) : (
        <section className="card center small no-resume">No workout in progress.</section>
      )}

      <section className="card">
        <h2>{liveSession ? 'Start another' : 'Start a workout'}</h2>
        <p className="small">Your plan — aim for ~3 a week.</p>
      </section>

      {schedule.length === 0 ? (
        <section className="card center small">
          Nothing planned yet. Add workouts from the <button className="link inline" onClick={onGoToPlan}>Plan</button> tab.
        </section>
      ) : (
        schedule.map((entry) => {
          const w = entry.workout
          if (!w) return null
          const full = byId[w.id] || w
          const count = full.exercises?.length ?? 0
          return (
            <section className="card home-start" key={entry.id}>
              <div className="plan-title">
                <span className="cat-icon">{CATEGORY_ICON[w.category] || '⭐'}</span>
                <div className="plan-main">
                  <div className="plan-name">{w.name}</div>
                  <div className="small">
                    {w.category === 'gym' ? `${count} exercise${count === 1 ? '' : 's'}` : w.category}
                  </div>
                </div>
              </div>
              <button className="primary start-sm" onClick={() => onStart(full)}>▶ Start</button>
            </section>
          )
        })
      )}
    </>
  )
}
