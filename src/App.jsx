import { useState } from 'react'
import { isSupabaseConfigured } from './lib/supabase.js'
import { useAuth } from './hooks/useAuth.js'
import { useWorkoutData } from './hooks/useWorkoutData.js'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import Auth from './components/Auth.jsx'
import Home from './components/Home.jsx'
import Plan from './components/Plan.jsx'
import Session from './components/Session.jsx'
import History from './components/History.jsx'
import Activity from './components/Activity.jsx'
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
    exercises: (workout.exercises || []).map((we) => ({
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
  const { library, alternates, workouts, schedule, sessions, settings, loading, error, saveSession, removeSession, saveSettings } = data

  const [view, setView] = useState('home') // home | plan | session | workouts | library | history | activity
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
      setView('home')
    }
  }

  const handleSignOut = () => {
    setSession(null) // don't leak an in-progress workout to the next account
    signOut()
  }

  const tabs = [
    ['plan', 'Plan', 'calendar'],
    ['workouts', 'Workouts', 'dumbbell'],
    ['library', 'Library', 'book'],
    ['activity', 'Activity', 'activity'],
    ['history', 'History', 'clock'],
  ]
  const titles = {
    home: 'Workout',
    plan: 'Plan',
    workouts: 'Workouts',
    library: 'Library',
    activity: 'Activity',
    history: 'History',
    session: session?.workoutName || 'Workout',
  }

  return (
    <div className="app">
      <header>
        <div className="header-left">
          <button
            className={view === 'home' ? 'icon-btn active' : 'icon-btn'}
            onClick={() => setView('home')}
            aria-label="Home"
          >
            <Icon name="home" />
          </button>
          <h1>{titles[view]}</h1>
        </div>
        <button className="icon-btn" onClick={handleSignOut} aria-label="Sign out">
          <Icon name="signout" />
        </button>
      </header>

      <main>
        {error && <section className="card auth-msg error">{error}</section>}
        {loading && <Centered>Loading your workouts…</Centered>}

        {!loading && view === 'home' && (
          <Home
            data={data}
            liveSession={session}
            onStart={startWorkout}
            onResume={() => setView('session')}
            onGoToPlan={() => setView('plan')}
          />
        )}

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
        {!loading && view === 'activity' && (
          <Activity sessions={sessions} settings={settings} onSaveSettings={saveSettings} />
        )}
        {!loading && view === 'history' && (
          <History history={sessions} onDelete={removeSession} />
        )}
      </main>

      {view !== 'session' && (
        <nav className="tabbar">
          {tabs.map(([id, label, icon]) => (
            <button
              key={id}
              className={view === id ? 'tab active' : 'tab'}
              onClick={() => setView(id)}
              aria-label={label}
            >
              <Icon name={icon} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}

// Minimal stroke icons (1.75 weight) for the bottom nav + header.
function Icon({ name }) {
  const p = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (name) {
    case 'home':
      return (<svg {...p}><path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19zM9.5 20.5v-6h5v6" /></svg>)
    case 'calendar':
      return (<svg {...p}><rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /></svg>)
    case 'dumbbell':
      return (<svg {...p}><path d="M6.5 8v8M3.5 9.5v5M17.5 8v8M20.5 9.5v5M6.5 12h11" /></svg>)
    case 'book':
      return (<svg {...p}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19a2 2 0 0 1 2-2h13" /></svg>)
    case 'clock':
      return (<svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3 2" /></svg>)
    case 'activity':
      return (<svg {...p}><path d="M21 12a9 9 0 1 1-6.2-8.56" /><circle cx="12" cy="12" r="3.4" /></svg>)
    case 'signout':
      return (<svg {...p}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11" /></svg>)
    default:
      return null
  }
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
