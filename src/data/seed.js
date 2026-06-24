// First-run seed: a starter exercise library, three gym workouts built from it,
// a few curated alternates, and a weekly plan. Copied into the user's account
// on first login (see seedDefaults in lib/db.js). Names are used as the join
// key while seeding, so they must be unique within this file.
//
// The three gym days are deliberately differentiated by goal:
//   Day 1 – Strength : heavy compounds, low reps (5–6), long rest.
//   Day 2 – Muscle   : moderate reps (8–15), machines/DB, run as supersets
//                      (pec deck+lateral, leg curl+calf, curl+pushdown) to fit ~1h.
//   Day 3 – Athletic : unilateral, explosive, carries & core.
// Each major muscle is trained 2–3×/week. Hamstrings, side delts and calves
// (previously untrained) are now covered.

export const seedLibrary = [
  { name: 'Incline Dumbbell Press', muscle_group: 'Chest',     default_sets: 4, default_reps: '6–8',          default_weight: 18,    step: 2,   unit: 'kg each' },
  { name: 'Hip Thrust',             muscle_group: 'Glutes',    default_sets: 4, default_reps: '8',            default_weight: 50,    step: 5,   unit: 'kg' },
  { name: 'Chest Supported Row',    muscle_group: 'Back',      default_sets: 4, default_reps: '8',            default_weight: 20,    step: 2.5, unit: 'kg each' },
  { name: 'Bulgarian Split Squat',  muscle_group: 'Legs',      default_sets: 3, default_reps: '8 each leg',   default_weight: 10,    step: 2,   unit: 'kg each' },
  { name: 'Assisted Pull-Up',       muscle_group: 'Back',      default_sets: 3, default_reps: '8',            default_weight: 40,    step: 5,   unit: 'kg assist' },
  { name: 'Seated DB Shoulder Press', muscle_group: 'Shoulders', default_sets: 4, default_reps: '6',          default_weight: 12.5,  step: 2.5, unit: 'kg each' },
  { name: 'Plank',                  muscle_group: 'Core',      default_sets: 3, default_reps: '60 sec',       default_weight: null,  step: 2.5, unit: 'bodyweight' },
  { name: 'Leg Press',              muscle_group: 'Legs',      default_sets: 4, default_reps: '12',           default_weight: 120,   step: 10,  unit: 'kg' },
  { name: 'Olympic Bench Press',    muscle_group: 'Chest',     default_sets: 4, default_reps: '5',            default_weight: 35,    step: 2.5, unit: 'kg' },
  { name: 'Seated Cable Row',       muscle_group: 'Back',      default_sets: 4, default_reps: '10',           default_weight: 45,    step: 5,   unit: 'kg' },
  { name: 'Pec Deck Fly',           muscle_group: 'Chest',     default_sets: 3, default_reps: '12',           default_weight: 25,    step: 5,   unit: 'kg' },
  { name: 'Face Pull',              muscle_group: 'Shoulders', default_sets: 3, default_reps: '15',           default_weight: 20,    step: 2.5, unit: 'kg' },
  { name: 'DB Bicep Curl',          muscle_group: 'Arms',      default_sets: 3, default_reps: '12',           default_weight: 12.5,  step: 2.5, unit: 'kg each' },
  { name: 'Tricep Pushdown',        muscle_group: 'Arms',      default_sets: 3, default_reps: '12',           default_weight: 30,    step: 5,   unit: 'kg' },
  { name: 'Goblet Squat',           muscle_group: 'Legs',      default_sets: 4, default_reps: '8',            default_weight: 24,    step: 2,   unit: 'kg' },
  { name: 'Walking Lunges',         muscle_group: 'Legs',      default_sets: 3, default_reps: '10 each leg',  default_weight: 10,    step: 2,   unit: 'kg each' },
  { name: 'Reverse Pec Deck',       muscle_group: 'Shoulders', default_sets: 3, default_reps: '15',           default_weight: 20,    step: 5,   unit: 'kg' },
  { name: "Farmer's Carry",         muscle_group: 'Core',      default_sets: 3, default_reps: '30 m',         default_weight: 25,    step: 5,   unit: 'kg each' },
  { name: 'Dead Bug',               muscle_group: 'Core',      default_sets: 3, default_reps: '10 each side', default_weight: null,  step: 2.5, unit: 'bodyweight' },
  { name: 'Romanian Deadlift',      muscle_group: 'Hamstrings', default_sets: 4, default_reps: '6',           default_weight: 40,    step: 5,   unit: 'kg' },
  { name: 'Seated Leg Curl',        muscle_group: 'Hamstrings', default_sets: 3, default_reps: '12',          default_weight: 35,    step: 5,   unit: 'kg' },
  { name: 'DB Lateral Raise',       muscle_group: 'Shoulders', default_sets: 4, default_reps: '15',           default_weight: 8,     step: 1,   unit: 'kg each' },
  { name: 'Standing Calf Raise',    muscle_group: 'Calves',    default_sets: 4, default_reps: '12',           default_weight: 40,    step: 5,   unit: 'kg' },
  { name: 'DB Push Press',          muscle_group: 'Shoulders', default_sets: 3, default_reps: '8',            default_weight: 15,    step: 2.5, unit: 'kg each' },
]

// Each group is a set of mutually-interchangeable exercises. Seeded as
// symmetric pairs, so picking any member offers the others as alternates.
export const seedAlternateGroups = [
  ['Leg Press', 'Goblet Squat', 'Bulgarian Split Squat'],
  ['Olympic Bench Press', 'Incline Dumbbell Press'],
  ['Seated Cable Row', 'Chest Supported Row'],
  ['Walking Lunges', 'Bulgarian Split Squat'],
  ['Romanian Deadlift', 'Seated Leg Curl'],
  ['Seated DB Shoulder Press', 'DB Push Press'],
]

// exercises: [name, sets, reps, target_weight, step]
export const seedWorkouts = [
  {
    // Heavy, low-rep compounds. Rest 2–3 min between sets.
    name: 'Day 1 – Strength', category: 'gym',
    exercises: [
      ['Olympic Bench Press', 4, '5', 35, 2.5],
      ['Romanian Deadlift', 4, '6', 40, 5],
      ['Chest Supported Row', 4, '6', 22.5, 2.5],
      ['Bulgarian Split Squat', 3, '6 each leg', 12, 2],
      ['Seated DB Shoulder Press', 4, '6', 14, 2.5],
      ['Assisted Pull-Up', 3, '6', 35, 5],
      ['Face Pull', 3, '15', 20, 2.5],
    ],
  },
  {
    // Hypertrophy. Moderate reps, short rest. Superset the pairs to fit the hour:
    // (Seated Leg Curl + Standing Calf Raise), (Pec Deck + Lateral Raise),
    // (DB Bicep Curl + Tricep Pushdown).
    name: 'Day 2 – Muscle', category: 'gym',
    exercises: [
      ['Incline Dumbbell Press', 4, '8–10', 18, 2],
      ['Leg Press', 4, '12', 120, 10],
      ['Seated Cable Row', 4, '10', 45, 5],
      ['Seated Leg Curl', 3, '12', 35, 5],
      ['Standing Calf Raise', 4, '12', 40, 5],
      ['Pec Deck Fly', 3, '12', 25, 5],
      ['DB Lateral Raise', 4, '15', 8, 1],
      ['DB Bicep Curl', 3, '12', 12.5, 2.5],
      ['Tricep Pushdown', 3, '12', 30, 5],
    ],
  },
  {
    // Unilateral, explosive, carries & core. Move with intent on the power lifts.
    name: 'Day 3 – Athletic', category: 'gym',
    exercises: [
      ['Goblet Squat', 4, '8', 24, 2],
      ['Walking Lunges', 3, '10 each leg', 10, 2],
      ['Hip Thrust', 4, '8', 50, 5],
      ['DB Push Press', 3, '8', 15, 2.5],
      ['Assisted Pull-Up', 3, '8', 40, 5],
      ['Reverse Pec Deck', 3, '15', 20, 5],
      ["Farmer's Carry", 3, '30 m', 25, 5],
      ['Dead Bug', 3, '10 each side', null, 2.5],
    ],
  },
  { name: 'Tennis', category: 'tennis' },
  { name: 'Yoga', category: 'yoga' },
]

// The week's plan, by workout name. day_of_week is left unpinned (null).
export const seedSchedule = ['Day 1 – Strength', 'Day 2 – Muscle', 'Day 3 – Athletic']

export const CATEGORIES = ['gym', 'tennis', 'yoga', 'other']
