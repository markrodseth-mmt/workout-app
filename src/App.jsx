import { useEffect, useState } from 'react'
import { isSupabaseConfigured } from './lib/supabase.js'
import { useAuth } from './hooks/useAuth.js'
import { useWorkoutData } from './hooks/useWorkoutData.js'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import Auth from './components/Auth.jsx'
import Session from './components/Session.jsx'
import History from './components/History.jsx'
import WorkoutEditor from './components/WorkoutEditor.jsx'

function todayISO() {
  const d = new Date()
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d - tz).toISOString().slice(0, 10)
}

// Build a fresh, editable session from a day's template.
function newSession(day) {
  return {
    dayId: day.id,
    dayLabel: day.label,
    date: todayISO(),
    exercises: day.exercises.map((e) => ({
      name: e.name, sets: e.sets, reps: e.reps,
      weight: e.weight, step: e.step, unit: e.unit, done: false,
    })),
  }
}

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth()

  if (!isSupabaseConfigured) return <SetupNotice />
  if (authLoading) return <Centered>Loading…</Centered>
  if (!user) return <Auth />
  return <AppShell user={user} signOut={signOut} />
}

function AppShell({ user, signOut }) {
  const data = useWorkoutData(user.id)
  const { days, sessions, loading, error, saveSession, removeSession } = data

  const [view, setView] = useState('home') // 'home' | 'session' | 'history' | 'editor'
  const [activeDayId, setActiveDayId] = useState(null)
  // Live session persists locally so a refresh mid-workout doesn't lose progress.
  const [session, setSession] = useLocalStorage('gymSession', null)

  // Default the picker to the first day once data loads.
  useEffect(() => {
    if (!activeDayId && days.length) setActiveDayId(days[0].id)
  }, [days, activeDayId])

  const activeDay = days.find((d) => d.id === activeDayId) || days[0]

  const startWorkout = () => {
    if (!activeDay) return
    setSession(newSession(activeDay))
    setView('session')
  }

  const setWeight = (index, weight) =>
    setSession((s) => ({ ...s, exercises: s.exercises.map((e, i) => (i === index ? { ...e, weight } : e)) }))

  const toggleDone = (index) =>
    setSession((s) => ({ ...s, exercises: s.exercises.map((e, i) => (i === index ? { ...e, done: !e.done } : e)) }))

  const finishWorkout = async () => {
    try {
      await saveSession(session)
      setSession(null)
      setView('history')
    } catch (e) {
      alert('Could not save workout: ' + (e.message || e))
    }
  }

  const cancelWorkout = () => {
    if (confirm('Discard this workout? Progress will be lost.')) {
      setSession(null)
      setView('home')
    }
  }

  const handleSignOut = () => {
    setSession(null) // don't leak an in-progress workout to the next account
    signOut()
  }

  const exportCSV = () => {
    let csv = 'date,day,exercise,sets,reps,weight,unit,completed\n'
    sessions.forEach((h) =>
      h.exercises.forEach((e) => {
        const row = [h.performed_on, h.day_label, e.name, e.sets, e.reps, e.weight ?? '', e.unit, e.done ? 'yes' : 'no']
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
        <div className="header-top">
          <h1>Strength Tracker</h1>
          <button className="link" onClick={handleSignOut}>Sign out</button>
        </div>
        <div className="tabs">
          <button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}>Workout</button>
          <button className={view === 'history' ? 'active' : ''} onClick={() => setView('history')}>History</button>
          <button className={view === 'editor' ? 'active' : ''} onClick={() => setView('editor')}>Edit</button>
        </div>
      </header>

      <main>
        {error && <section className="card auth-msg error">{error}</section>}
        {loading && <Centered>Loading your workouts…</Centered>}

        {!loading && view === 'home' && (
          <>
            {session && (
              <section className="card resume">
                <div>Workout in progress — <strong>{session.dayLabel}</strong></div>
                <button className="primary" onClick={() => setView('session')}>Resume</button>
              </section>
            )}

            {days.length === 0 ? (
              <section className="card">No workouts yet. Use <strong>Edit</strong> to add some.</section>
            ) : (
              <>
                <div className="day-picker">
                  {days.map((d) => (
                    <button
                      key={d.id}
                      className={activeDay?.id === d.id ? 'day active' : 'day'}
                      onClick={() => setActiveDayId(d.id)}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                {activeDay && (
                  <section className="card">
                    <h2>{activeDay.label}</h2>
                    <ul className="preview">
                      {activeDay.exercises.map((x) => (
                        <li key={x.id}>
                          <span>{x.name}</span>
                          <span className="small">{x.sets} × {x.reps}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <button className="primary big start" onClick={startWorkout}>▶ Start workout</button>
              </>
            )}
          </>
        )}

        {!loading && view === 'session' && session && (
          <Session
            session={session}
            dayLabel={session.dayLabel}
            onSetWeight={setWeight}
            onToggleDone={toggleDone}
            onFinish={finishWorkout}
            onCancel={cancelWorkout}
          />
        )}
        {!loading && view === 'session' && !session && (
          <section className="card">No active workout. Go to Workout to start one.</section>
        )}

        {!loading && view === 'history' && (
          <History history={sessions} onDelete={removeSession} onExport={exportCSV} />
        )}

        {!loading && view === 'editor' && (
          <WorkoutEditor data={data} onDone={() => setView('home')} />
        )}
      </main>
    </>
  )
}

function Centered({ children }) {
  return <main><section className="card center">{children}</section></main>
}

function SetupNotice() {
  return (
    <main>
      <section className="card">
        <h2>Supabase not configured</h2>
        <p className="small">
          Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> (see
          <code> .env.example</code> and the README), then restart the dev server.
        </p>
      </section>
    </main>
  )
}
