import { useState } from 'react'
import { isSupabaseConfigured } from './lib/supabase.js'
import { useAuth } from './hooks/useAuth.js'
import { useWorkoutData } from './hooks/useWorkoutData.js'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import Auth from './components/Auth.jsx'
import Plan from './components/Plan.jsx'
import Session from './components/Session.jsx'
import History from './components/History.jsx'
import Workouts from './components/Workouts.jsx'
import Library from './components/Library.jsx'

function todayISO() {
  const d = new Date()
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d - tz).toISOString().slice(0, 10)
}

// Build a fresh, editable live session from a workout template.
function newSession(workout, library, alternates) {
  if (workout.category !== 'gym') {
    return {
      workoutId: workout.id,
      workoutName: workout.name,
      category: workout.category,
      date: todayISO(),
      durationMin: 60,
      notes: '',
    }
  }
  const libById = Object.fromEntries(library.map((l) => [l.id, l]))
  const altsFor = (id) => (alternates[id] || []).map((aid) => libById[aid]).filter(Boolean)
  return {
    workoutId: workout.id,
    workoutName: workout.name,
    category: 'gym',
    date: todayISO(),
    exercises: workout.exercises.map((we) => ({
      exerciseId: we.exercise_id,
      swappedFromId: null,
      name: we.exercise?.name ?? 'Exercise',
      muscleGroup: we.exercise?.muscle_group ?? '',
      sets: we.sets,
      reps: we.reps,
      weight: we.target_weight,
      step: we.step ?? we.exercise?.step ?? 2.5,
      unit: we.exercise?.unit ?? 'kg',
      done: false,
      alternates: altsFor(we.exercise_id),
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
  const { library, alternates, workouts, schedule, sessions, loading, error, saveSession, removeSession } = data

  const [view, setView] = useState('plan') // plan | session | workouts | library | history
  // Live session persists locally so a refresh mid-workout doesn't lose progress.
  const [session, setSession] = useLocalStorage('liveSession', null)

  const startWorkout = (workout) => {
    setSession(newSession(workout, library, alternates))
    setView('session')
  }

  // ── Gym live-session mutations ──
  const patchExercise = (index, patch) =>
    setSession((s) => ({
      ...s,
      exercises: s.exercises.map((e, i) => (i === index ? { ...e, ...patch } : e)),
    }))

  const setWeight = (index, weight) => patchExercise(index, { weight })
  const toggleDone = (index) =>
    setSession((s) => ({
      ...s,
      exercises: s.exercises.map((e, i) => (i === index ? { ...e, done: !e.done } : e)),
    }))

  // Swap exercise `index` for one of its alternates (a library row).
  const chooseAlternate = (index, alt) =>
    setSession((s) => ({
      ...s,
      exercises: s.exercises.map((e, i) => {
        if (i !== index) return e
        const altsFor = (alternates[alt.id] || [])
          .map((aid) => library.find((l) => l.id === aid))
          .filter(Boolean)
        return {
          ...e,
          // Remember the originally prescribed exercise the first time we swap.
          swappedFromId: e.swappedFromId ?? e.exerciseId,
          exerciseId: alt.id,
          name: alt.name,
          muscleGroup: alt.muscle_group,
          weight: alt.default_weight,
          step: alt.step ?? 2.5,
          unit: alt.unit ?? 'kg',
          alternates: altsFor,
        }
      }),
    }))

  // ── Simple (tennis/yoga) live-session mutations ──
  const patchSimple = (patch) => setSession((s) => ({ ...s, ...patch }))

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
      setView('plan')
    }
  }

  const handleSignOut = () => {
    setSession(null) // don't leak an in-progress workout to the next account
    signOut()
  }

  const tabs = [
    ['plan', 'Plan'],
    ['workouts', 'Workouts'],
    ['library', 'Library'],
    ['history', 'History'],
  ]

  return (
    <>
      <header>
        <div className="header-top">
          <h1>Workout</h1>
          <button className="link" onClick={handleSignOut}>Sign out</button>
        </div>
        <div className="tabs">
          {tabs.map(([id, label]) => (
            <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)}>
              {label}
            </button>
          ))}
        </div>
      </header>

      <main>
        {error && <section className="card auth-msg error">{error}</section>}
        {loading && <Centered>Loading your workouts…</Centered>}

        {!loading && view === 'plan' && (
          <Plan
            data={data}
            liveSession={session}
            onStart={startWorkout}
            onResume={() => setView('session')}
          />
        )}

        {!loading && view === 'session' && session && (
          <Session
            session={session}
            onSetWeight={setWeight}
            onToggleDone={toggleDone}
            onChooseAlternate={chooseAlternate}
            onPatchSimple={patchSimple}
            onFinish={finishWorkout}
            onCancel={cancelWorkout}
          />
        )}
        {!loading && view === 'session' && !session && (
          <section className="card">No active workout. Go to <strong>Plan</strong> to start one.</section>
        )}

        {!loading && view === 'workouts' && <Workouts data={data} />}
        {!loading && view === 'library' && <Library data={data} />}
        {!loading && view === 'history' && (
          <History history={sessions} onDelete={removeSession} />
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
