// First-run seed: a starter exercise library, three gym workouts built from it,
// a few curated alternates, and a weekly plan. Copied into the user's account
// on first login (see seedDefaults in lib/db.js). Names are used as the join
// key while seeding, so they must be unique within this file.

export const seedLibrary = [
  { name: 'Incline Dumbbell Press', muscle_group: 'Chest',     default_sets: 4, default_reps: '6–8',          default_weight: 18,    step: 2,   unit: 'kg each' },
  { name: 'Hip Thrust',             muscle_group: 'Glutes',    default_sets: 4, default_reps: '8',            default_weight: 50,    step: 5,   unit: 'kg' },
  { name: 'Chest Supported Row',    muscle_group: 'Back',      default_sets: 4, default_reps: '8',            default_weight: 20,    step: 2.5, unit: 'kg each' },
  { name: 'Bulgarian Split Squat',  muscle_group: 'Legs',      default_sets: 3, default_reps: '8 each leg',   default_weight: 10,    step: 2,   unit: 'kg each' },
  { name: 'Assisted Pull-Up',       muscle_group: 'Back',      default_sets: 3, default_reps: '8',            default_weight: 40,    step: 5,   unit: 'kg assist' },
  { name: 'Seated DB Shoulder Press', muscle_group: 'Shoulders', default_sets: 3, default_reps: '10',         default_weight: 12.5,  step: 2.5, unit: 'kg each' },
  { name: 'Plank',                  muscle_group: 'Core',      default_sets: 3, default_reps: '60 sec',       default_weight: null,  step: 2.5, unit: 'bodyweight' },
  { name: 'Leg Press',              muscle_group: 'Legs',      default_sets: 4, default_reps: '10',           default_weight: 120,   step: 10,  unit: 'kg' },
  { name: 'Olympic Bench Press',    muscle_group: 'Chest',     default_sets: 4, default_reps: '8',            default_weight: 35,    step: 2.5, unit: 'kg' },
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
]

// Each group is a set of mutually-interchangeable exercises. Seeded as
// symmetric pairs, so picking any member offers the others as alternates.
export const seedAlternateGroups = [
  ['Leg Press', 'Goblet Squat', 'Bulgarian Split Squat'],
  ['Olympic Bench Press', 'Incline Dumbbell Press'],
  ['Seated Cable Row', 'Chest Supported Row'],
  ['Walking Lunges', 'Bulgarian Split Squat'],
]

// exercises: [name, sets, reps, target_weight, step]
export const seedWorkouts = [
  {
    name: 'Day 1 – Strength', category: 'gym',
    exercises: [
      ['Incline Dumbbell Press', 4, '6–8', 18, 2],
      ['Hip Thrust', 4, '8', 50, 5],
      ['Chest Supported Row', 4, '8', 20, 2.5],
      ['Bulgarian Split Squat', 3, '8 each leg', 10, 2],
      ['Assisted Pull-Up', 3, '8', 40, 5],
      ['Seated DB Shoulder Press', 3, '10', 12.5, 2.5],
      ['Plank', 3, '60 sec', null, 2.5],
    ],
  },
  {
    name: 'Day 2 – Muscle', category: 'gym',
    exercises: [
      ['Leg Press', 4, '10', 120, 10],
      ['Olympic Bench Press', 4, '8', 35, 2.5],
      ['Seated Cable Row', 4, '10', 45, 5],
      ['Assisted Pull-Up', 3, '8', 40, 5],
      ['Pec Deck Fly', 3, '12', 25, 5],
      ['Face Pull', 3, '15', 20, 2.5],
      ['DB Bicep Curl', 3, '12', 12.5, 2.5],
      ['Tricep Pushdown', 3, '12', 30, 5],
    ],
  },
  {
    name: 'Day 3 – Athletic', category: 'gym',
    exercises: [
      ['Goblet Squat', 4, '8', 24, 2],
      ['Seated Cable Row', 4, '10', 45, 5],
      ['Olympic Bench Press', 4, '8', 35, 2.5],
      ['Walking Lunges', 3, '10 each leg', 10, 2],
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
