import { useState } from 'react'
import { workouts, dayLabels } from './data/workouts.js'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import WorkoutTable from './components/WorkoutTable.jsx'
import History from './components/History.jsx'

function todayISO() {
  const d = new Date()
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d - tz).toISOString().slice(0, 10)
}

export default function App() {
  const [view, setView] = useState(1) // 1 | 2 | 3 | 'history'
  const [date, setDate] = useState(todayISO)
  const [inputs, setInputs] = useState({})
  const [history, setHistory] = useLocalStorage('gymHistory', [])

  const showDay = (day) => {
    setView(day)
    setInputs({}) // fresh inputs per day, matching original reset behaviour
  }

  const onInputChange = (key, value) => {
    setInputs((prev) => ({ ...prev, [key]: value }))
  }

  const saveWorkout = () => {
    const day = view
    const entries = workouts[day].map((x, i) => ({
      exercise: x[0],
      target: `${x[1]} x ${x[2]}`,
      planned: x[3],
      actualWeight: inputs[`w-${i}`] || '',
      repsNotes: inputs[`r-${i}`] || '',
    }))
    setHistory((prev) => [...prev, { date, day, entries }])
    alert('Workout saved.')
  }

  const resetToday = () => setInputs({})

  const deleteEntry = (index) => {
    setHistory((prev) => prev.filter((_, i) => i !== index))
  }

  const exportCSV = () => {
    let csv = 'date,day,exercise,target,planned,actual_weight,reps_notes\n'
    history.forEach((h) =>
      h.entries.forEach((e) => {
        const row = [h.date, h.day, e.exercise, e.target, e.planned, e.actualWeight, e.repsNotes]
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
        <h1>3-Day Muscle & Strength Tracker</h1>
        <p>Track weights, reps, notes and progression. Data saves on this device.</p>
      </header>

      <main>
        <div className="tabs">
          {[1, 2, 3].map((d) => (
            <button
              key={d}
              className={view === d ? 'active' : ''}
              onClick={() => showDay(d)}
            >
              {dayLabels[d]}
            </button>
          ))}
          <button
            className={view === 'history' ? 'active' : ''}
            onClick={() => setView('history')}
          >
            History
          </button>
        </div>

        {view !== 'history' && (
          <>
            <section className="card">
              <label>
                Date:{' '}
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </label>
            </section>

            <WorkoutTable
              exercises={workouts[view]}
              inputs={inputs}
              onChange={onInputChange}
            />

            <div className="actions">
              <button className="primary" onClick={saveWorkout}>Save workout</button>
              <button onClick={exportCSV}>Export CSV</button>
              <button onClick={resetToday}>Reset today</button>
            </div>

            <section className="card">
              <h2>Progression rule</h2>
              <p>
                When you complete all prescribed reps with clean form, increase upper body
                dumbbells by the next available jump, barbell/cable by 2.5–5kg, and lower body by
                5kg. Assisted pull-up: reduce assistance over time.
              </p>
            </section>
          </>
        )}

        {view === 'history' && <History history={history} onDelete={deleteEntry} />}
      </main>
    </>
  )
}
