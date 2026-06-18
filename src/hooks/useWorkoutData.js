import { useCallback, useEffect, useState } from 'react'
import * as db from '../lib/db.js'

// Loads the signed-in user's workout config and history from Supabase,
// seeding the default program on first use.
export function useWorkoutData(userId) {
  const [days, setDays] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      let fetched = await db.fetchDays()
      if (fetched.length === 0) {
        await db.seedDefaults(userId)
        fetched = await db.fetchDays()
      }
      const history = await db.fetchSessions()
      setDays(fetched)
      setSessions(history)
    } catch (e) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  // Sessions
  const saveSession = useCallback(
    async (session) => {
      const row = await db.insertSession(userId, session)
      setSessions((prev) => [row, ...prev])
    },
    [userId],
  )

  const removeSession = useCallback(async (id) => {
    await db.deleteSession(id)
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }, [])

  return {
    days,
    sessions,
    loading,
    error,
    reload: load,
    saveSession,
    removeSession,
    // Config mutations (used by the editor); reload() resyncs afterwards.
    db,
    userId,
  }
}
