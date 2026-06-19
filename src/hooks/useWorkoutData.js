import { useCallback, useEffect, useState } from 'react'
import * as db from '../lib/db.js'

// Loads the signed-in user's library, workouts, weekly plan and history,
// seeding the default program on first use.
export function useWorkoutData(userId) {
  const [library, setLibrary] = useState([])
  const [alternates, setAlternates] = useState({}) // exerciseId -> [alternateId]
  const [workouts, setWorkouts] = useState([])
  const [schedule, setSchedule] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      let lib = await db.fetchLibrary()
      if (lib.length === 0) {
        await db.seedDefaults(userId)
        lib = await db.fetchLibrary()
      }
      const [alts, w, sched, hist] = await Promise.all([
        db.fetchAlternates(),
        db.fetchWorkouts(),
        db.fetchSchedule(),
        db.fetchSessions(),
      ])
      setLibrary(lib)
      setAlternates(alts)
      setWorkouts(w)
      setSchedule(sched)
      setSessions(hist)
    } catch (e) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  const saveSession = useCallback(
    async (session) => {
      await db.insertSession(userId, session)
      setSessions(await db.fetchSessions())
    },
    [userId],
  )

  const removeSession = useCallback(async (id) => {
    await db.deleteSession(id)
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }, [])

  return {
    library,
    alternates,
    workouts,
    schedule,
    sessions,
    loading,
    error,
    reload: load,
    saveSession,
    removeSession,
    db,
    userId,
  }
}
