import { supabase } from './supabase.js'
import { seedLibrary, seedAlternateGroups, seedWorkouts, seedSchedule } from '../data/seed.js'

// ── Exercise library ─────────────────────────────────────────────────────────

export async function fetchLibrary() {
  const { data, error } = await supabase
    .from('exercise_library')
    .select('id, name, muscle_group, default_sets, default_reps, default_weight, step, unit')
    .order('muscle_group')
    .order('name')
  if (error) throw error
  return data || []
}

export async function addLibraryExercise(userId, fields = {}) {
  const { data, error } = await supabase
    .from('exercise_library')
    .insert({
      user_id: userId,
      name: 'New exercise',
      muscle_group: 'Other',
      default_sets: 3,
      default_reps: '10',
      default_weight: 20,
      step: 2.5,
      unit: 'kg',
      ...fields,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateLibraryExercise(id, fields) {
  const { error } = await supabase.from('exercise_library').update(fields).eq('id', id)
  if (error) throw error
}

export async function deleteLibraryExercise(id) {
  const { error } = await supabase.from('exercise_library').delete().eq('id', id)
  if (error) throw error
}

// ── Alternates (curated, symmetric) ──────────────────────────────────────────

// Returns a map: exerciseId -> [alternateId, …].
export async function fetchAlternates() {
  const { data, error } = await supabase
    .from('exercise_alternates')
    .select('exercise_id, alternate_id')
  if (error) throw error
  const map = {}
  for (const { exercise_id, alternate_id } of data || []) {
    ;(map[exercise_id] ||= []).push(alternate_id)
  }
  return map
}

export async function addAlternate(userId, a, b) {
  const { error } = await supabase
    .from('exercise_alternates')
    .upsert(
      [
        { user_id: userId, exercise_id: a, alternate_id: b },
        { user_id: userId, exercise_id: b, alternate_id: a },
      ],
      { onConflict: 'exercise_id,alternate_id', ignoreDuplicates: true },
    )
  if (error) throw error
}

export async function removeAlternate(a, b) {
  const { error } = await supabase
    .from('exercise_alternates')
    .delete()
    .or(`and(exercise_id.eq.${a},alternate_id.eq.${b}),and(exercise_id.eq.${b},alternate_id.eq.${a})`)
  if (error) throw error
}

// ── Workouts (templates) ─────────────────────────────────────────────────────

export async function fetchWorkouts() {
  const { data, error } = await supabase
    .from('workouts')
    .select(
      'id, name, category, notes, created_at, ' +
        'workout_exercises (id, position, sets, reps, target_weight, step, exercise_id, ' +
        'exercise:exercise_library (id, name, muscle_group, unit, default_weight, step))',
    )
    .order('created_at')
  if (error) throw error
  return (data || []).map((w) => ({
    ...w,
    exercises: [...(w.workout_exercises || [])].sort((a, b) => a.position - b.position),
  }))
}

export async function addWorkout(userId, name, category = 'gym') {
  const { data, error } = await supabase
    .from('workouts')
    .insert({ user_id: userId, name, category })
    .select()
    .single()
  if (error) throw error
  return { ...data, workout_exercises: [], exercises: [] }
}

export async function updateWorkout(id, fields) {
  const { error } = await supabase.from('workouts').update(fields).eq('id', id)
  if (error) throw error
}

export async function deleteWorkout(id) {
  const { error } = await supabase.from('workouts').delete().eq('id', id)
  if (error) throw error
}

// Add a library exercise to a workout, defaulting its prescription from the
// library entry. `lib` is the library row being added.
export async function addWorkoutExercise(userId, workoutId, lib, position) {
  const { data, error } = await supabase
    .from('workout_exercises')
    .insert({
      user_id: userId,
      workout_id: workoutId,
      exercise_id: lib.id,
      position,
      sets: lib.default_sets ?? 3,
      reps: lib.default_reps ?? '10',
      target_weight: lib.default_weight ?? null,
      step: lib.step ?? 2.5,
    })
    .select(
      'id, position, sets, reps, target_weight, step, exercise_id, ' +
        'exercise:exercise_library (id, name, muscle_group, unit, default_weight, step)',
    )
    .single()
  if (error) throw error
  return data
}

export async function updateWorkoutExercise(id, fields) {
  const { error } = await supabase.from('workout_exercises').update(fields).eq('id', id)
  if (error) throw error
}

export async function deleteWorkoutExercise(id) {
  const { error } = await supabase.from('workout_exercises').delete().eq('id', id)
  if (error) throw error
}

// ── Weekly plan ──────────────────────────────────────────────────────────────

export async function fetchSchedule() {
  const { data, error } = await supabase
    .from('schedule')
    .select('id, position, day_of_week, workout:workouts (id, name, category)')
    .order('position')
  if (error) throw error
  return data || []
}

export async function addScheduleEntry(userId, workoutId, position, dayOfWeek = null) {
  const { data, error } = await supabase
    .from('schedule')
    .insert({ user_id: userId, workout_id: workoutId, position, day_of_week: dayOfWeek })
    .select('id, position, day_of_week, workout:workouts (id, name, category)')
    .single()
  if (error) throw error
  return data
}

export async function updateScheduleEntry(id, fields) {
  const { error } = await supabase.from('schedule').update(fields).eq('id', id)
  if (error) throw error
}

export async function deleteScheduleEntry(id) {
  const { error } = await supabase.from('schedule').delete().eq('id', id)
  if (error) throw error
}

// ── Sessions (history) ───────────────────────────────────────────────────────

export async function fetchSessions() {
  const { data, error } = await supabase
    .from('sessions')
    .select(
      'id, workout_id, workout_name, category, performed_on, duration_min, notes, completed, created_at, ' +
        'session_exercises (id, position, name, sets, reps, weight, unit, done, exercise_id, swapped_from_id)',
    )
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map((s) => ({
    ...s,
    session_exercises: [...(s.session_exercises || [])].sort((a, b) => a.position - b.position),
  }))
}

// Persist a finished live session (see App.jsx for the live shape).
export async function insertSession(userId, session) {
  const { data: row, error } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      workout_id: session.workoutId ?? null,
      workout_name: session.workoutName,
      category: session.category,
      performed_on: session.date,
      duration_min: session.durationMin ?? null,
      notes: session.notes ?? null,
      completed: true,
    })
    .select()
    .single()
  if (error) throw error

  if (session.category === 'gym' && session.exercises?.length) {
    const exRows = session.exercises.map((e, i) => ({
      user_id: userId,
      session_id: row.id,
      exercise_id: e.exerciseId ?? null,
      swapped_from_id: e.swappedFromId ?? null,
      position: i,
      name: e.name,
      sets: e.sets ?? null,
      reps: e.reps ?? null,
      weight: e.weight ?? null,
      unit: e.unit ?? 'kg',
      done: !!e.done,
    }))
    const { error: exErr } = await supabase.from('session_exercises').insert(exRows)
    if (exErr) throw exErr
  }
  return row
}

export async function deleteSession(id) {
  // session_exercises cascade-delete via the foreign key.
  const { error } = await supabase.from('sessions').delete().eq('id', id)
  if (error) throw error
}

// ── First-run seed ───────────────────────────────────────────────────────────

export async function seedDefaults(userId) {
  // 1) Library — insert, then map name -> id (names are unique in the seed).
  const libRows = seedLibrary.map((e) => ({ user_id: userId, ...e }))
  const { data: lib, error: libErr } = await supabase
    .from('exercise_library')
    .insert(libRows)
    .select('id, name')
  if (libErr) throw libErr
  const idByName = Object.fromEntries(lib.map((r) => [r.name, r.id]))

  // 2) Alternates — symmetric pairs within each group.
  const altRows = []
  for (const group of seedAlternateGroups) {
    for (let i = 0; i < group.length; i++) {
      for (let j = 0; j < group.length; j++) {
        if (i === j) continue
        altRows.push({ user_id: userId, exercise_id: idByName[group[i]], alternate_id: idByName[group[j]] })
      }
    }
  }
  if (altRows.length) {
    const { error } = await supabase.from('exercise_alternates').insert(altRows)
    if (error) throw error
  }

  // 3) Workouts + their exercises.
  const wRows = seedWorkouts.map((w) => ({ user_id: userId, name: w.name, category: w.category }))
  const { data: workouts, error: wErr } = await supabase.from('workouts').insert(wRows).select('id, name')
  if (wErr) throw wErr
  const workoutIdByName = Object.fromEntries(workouts.map((r) => [r.name, r.id]))

  const wexRows = []
  for (const w of seedWorkouts) {
    ;(w.exercises || []).forEach(([name, sets, reps, weight, step], i) => {
      wexRows.push({
        user_id: userId,
        workout_id: workoutIdByName[w.name],
        exercise_id: idByName[name],
        position: i,
        sets,
        reps,
        target_weight: weight,
        step,
      })
    })
  }
  if (wexRows.length) {
    const { error } = await supabase.from('workout_exercises').insert(wexRows)
    if (error) throw error
  }

  // 4) Weekly plan.
  const schedRows = seedSchedule.map((name, i) => ({
    user_id: userId,
    workout_id: workoutIdByName[name],
    position: i,
  }))
  if (schedRows.length) {
    const { error } = await supabase.from('schedule').insert(schedRows)
    if (error) throw error
  }
}
