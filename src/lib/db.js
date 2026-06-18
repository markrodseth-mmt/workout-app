import { supabase } from './supabase.js'
import { workouts as defaultWorkouts, dayLabels } from '../data/workouts.js'

// ── Workout config (days + exercises) ────────────────────────────────────────

// Returns days sorted by position, each with its exercises sorted by position.
export async function fetchDays() {
  const { data, error } = await supabase
    .from('workout_days')
    .select('id, position, label, exercises (id, position, name, sets, reps, weight, step, unit)')
    .order('position')
  if (error) throw error
  return (data || []).map((d) => ({
    ...d,
    exercises: [...(d.exercises || [])].sort((a, b) => a.position - b.position),
  }))
}

// First-run seed: copy the bundled default program into the user's account.
export async function seedDefaults(userId) {
  const keys = Object.keys(defaultWorkouts) // '1','2','3'
  const dayRows = keys.map((k, i) => ({ user_id: userId, position: i, label: dayLabels[k] }))
  const { data: days, error } = await supabase.from('workout_days').insert(dayRows).select()
  if (error) throw error

  const byPosition = [...days].sort((a, b) => a.position - b.position)
  const exRows = []
  byPosition.forEach((day, i) => {
    defaultWorkouts[keys[i]].forEach((ex, j) => {
      exRows.push({ user_id: userId, day_id: day.id, position: j, ...ex })
    })
  })
  const { error: exErr } = await supabase.from('exercises').insert(exRows)
  if (exErr) throw exErr
}

export async function addDay(userId, label, position) {
  const { data, error } = await supabase
    .from('workout_days')
    .insert({ user_id: userId, label, position })
    .select()
    .single()
  if (error) throw error
  return { ...data, exercises: [] }
}

export async function updateDay(id, fields) {
  const { error } = await supabase.from('workout_days').update(fields).eq('id', id)
  if (error) throw error
}

export async function deleteDay(id) {
  // exercises cascade-delete via the foreign key.
  const { error } = await supabase.from('workout_days').delete().eq('id', id)
  if (error) throw error
}

export async function addExercise(userId, dayId, position) {
  const { data, error } = await supabase
    .from('exercises')
    .insert({
      user_id: userId,
      day_id: dayId,
      position,
      name: 'New exercise',
      sets: 3,
      reps: '10',
      weight: 20,
      step: 2.5,
      unit: 'kg',
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateExercise(id, fields) {
  const { error } = await supabase.from('exercises').update(fields).eq('id', id)
  if (error) throw error
}

export async function deleteExercise(id) {
  const { error } = await supabase.from('exercises').delete().eq('id', id)
  if (error) throw error
}

// ── Sessions (history) ────────────────────────────────────────────────────────

export async function fetchSessions() {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, day_id, day_label, performed_on, exercises, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function insertSession(userId, session) {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      day_id: session.dayId ?? null,
      day_label: session.dayLabel,
      performed_on: session.date,
      exercises: session.exercises,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteSession(id) {
  const { error } = await supabase.from('sessions').delete().eq('id', id)
  if (error) throw error
}
