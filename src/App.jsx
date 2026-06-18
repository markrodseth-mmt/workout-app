import { useState } from 'react'
import { workouts, dayLabels } from './data/workouts.js'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import Session from './components/Session.jsx'
import History from './components/History.jsx'

function todayISO() {
  const d = new Date()
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d - tz).toISOString().slice(0, 10)
}

// Build a fresh, editable session from a day's defaults.
function newSession(day) {
  return {
    day,
    date: todayISO(),
    exercises: workouts[day].map((x) => ({ ...x, done: false })),
  }
}

export default function App() {
  const [view, setView] = useState('home') // 'home' | 'session' | 'history'
  const [activeDay, setActiveDay] = useState(1)
  // Live session persists too, so a refresh mid-workout doesn't lose progress.
  const [session, setSession] = useLocalStorage('gymSession', null)
  const [history, setHistory] = useLocalStorage('gymHistory', [])

  const startWorkout = () => {
    setSession(newSession(activeDay))
    setView('session')
  }

  const resumeWorkout = () => setView('session')

  const setWeight = (index, weight) => {
    setSession((s) => ({
      ...s,
      exercises: s.exercises.map((e, i) => (i === index ? { ...e, weight } : e)),
    }))
  }

  const toggleDone = (index) => {
    setSession((s) => ({
      ...s,
      exercises: s.exercises.map((e, i) => (i === index ? { ...e, done: !e.done } : e)),
    }))
  }

  const finishWorkout = () => {
    setHistory((prev) => [...prev, { ...session, savedAt: Date.now() }])
    setSession(null)
    setView('history')
  }

  const cancelWorkout = () => {
    if (confirm('Discard this workout? Progress will be lost.')) {
      setSession(null)
      setView('home')
    }
  }

  const deleteEntry = (savedAt) => {
    setHistory((prev) => prev.filter((h) => h.savedAt !== savedAt))
  }

  const exportCSV = () => {
    let csv = 'date,day,exercise,sets,reps,weight,unit,completed\n'
    history.forEach((h) =>
      h.exercises.forEach((e) => {
        const row = [h.date, h.day, e.name, e.sets, e.reps, e.weight ?? '', e.unit, e.done ? 'yes' : 'no']
          .map((v) => `"${String(v ?? '').replaceAll('"', '""')}"`)
          .join(',')
        csv += row + '\n'
      }),
    )
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'gym-tracker.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <>
      <header>
        <h1>3-Day Strength Tracker</h1>
        <div className="tabs">
          <button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}>
            Workout
          </button>
          <button className={view === 'history' ? 'active' : ''} onClick={() => setView('history')}>
            History
          </button>
        </div>
      </header>

      <main>
        {view === 'home' && (
          <>
            {session && (
              <section className="card resume">
                <div>
                  Workout in progress — <strong>{dayLabels[session.day]}</strong>
                </div>
                <button className="primary" onClick={resumeWorkout}>Resume</button>
              </section>
            )}

            <div className="day-picker">
              {[1, 2, 3].map((d) => (
                <button
                  key={d}
                  className={activeDay === d ? 'day active' : 'day'}
                  onClick={() => setActiveDay(d)}
                >
                  {dayLabels[d]}
                </button>
              ))}
            </div>

            <section className="card">
              <h2>{dayLabels[activeDay]}</h2>
              <ul className="preview">
                {workouts[activeDay].map((x, i) => (
                  <li key={i}>
                    <span>{x.name}</span>
                    <span className="small">{x.sets} × {x.reps}</span>
                  </li>
                ))}
              </ul>
            </section>

            <button className="primary big start" onClick={startWorkout}>
              ▶ Start workout
            </button>
          </>
        )}

        {view === 'session' && session && (
          <Session
            session={session}
            dayLabel={dayLabels[session.day]}
            onSetWeight={setWeight}
            onToggleDone={toggleDone}
            onFinish={finishWorkout}
            onCancel={cancelWorkout}
          />
        )}

        {view === 'session' && !session && (
          <section className="card">No active workout. Go to Workout to start one.</section>
        )}

        {view === 'history' && (
          <History history={history} onDelete={deleteEntry} onExport={exportCSV} />
        )}
      </main>
    </>
  )
}
