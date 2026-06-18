// Each exercise has a numeric default weight so it can be pre-selected and
// adjusted with +/- steppers. `step` is the increment per tap, `unit` the
// label shown beside the number. Bodyweight moves use weight: null.
export const workouts = {
  1: [
    { name: 'Incline Dumbbell Press', sets: 4, reps: '6–8', weight: 18, step: 2, unit: 'kg each' },
    { name: 'Hip Thrust', sets: 4, reps: '8', weight: 50, step: 5, unit: 'kg' },
    { name: 'Chest Supported Row', sets: 4, reps: '8', weight: 20, step: 2.5, unit: 'kg each' },
    { name: 'Bulgarian Split Squat', sets: 3, reps: '8 each leg', weight: 10, step: 2, unit: 'kg each' },
    { name: 'Assisted Pull-Up', sets: 3, reps: '8', weight: 40, step: 5, unit: 'kg assist' },
    { name: 'Seated DB Shoulder Press', sets: 3, reps: '10', weight: 12.5, step: 2.5, unit: 'kg each' },
    { name: 'Plank', sets: 3, reps: '60 sec', weight: null, unit: 'bodyweight' },
  ],
  2: [
    { name: 'Leg Press', sets: 4, reps: '10', weight: 120, step: 10, unit: 'kg' },
    { name: 'Olympic Bench Press', sets: 4, reps: '8', weight: 35, step: 2.5, unit: 'kg' },
    { name: 'Seated Cable Row', sets: 4, reps: '10', weight: 45, step: 5, unit: 'kg' },
    { name: 'Assisted Pull-Up', sets: 3, reps: '8', weight: 40, step: 5, unit: 'kg assist' },
    { name: 'Pec Deck Fly', sets: 3, reps: '12', weight: 25, step: 5, unit: 'kg' },
    { name: 'Face Pull', sets: 3, reps: '15', weight: 20, step: 2.5, unit: 'kg' },
    { name: 'DB Bicep Curl', sets: 3, reps: '12', weight: 12.5, step: 2.5, unit: 'kg each' },
    { name: 'Tricep Pushdown', sets: 3, reps: '12', weight: 30, step: 5, unit: 'kg' },
  ],
  3: [
    { name: 'Goblet Squat', sets: 4, reps: '8', weight: 24, step: 2, unit: 'kg' },
    { name: 'Seated Cable Row', sets: 4, reps: '10', weight: 45, step: 5, unit: 'kg' },
    { name: 'Olympic Bench Press', sets: 4, reps: '8', weight: 35, step: 2.5, unit: 'kg' },
    { name: 'Walking Lunges', sets: 3, reps: '10 each leg', weight: 10, step: 2, unit: 'kg each' },
    { name: 'Assisted Pull-Up', sets: 3, reps: '8', weight: 40, step: 5, unit: 'kg assist' },
    { name: 'Reverse Pec Deck', sets: 3, reps: '15', weight: 20, step: 5, unit: 'kg' },
    { name: "Farmer's Carry", sets: 3, reps: '30 m', weight: 25, step: 5, unit: 'kg each' },
    { name: 'Dead Bug', sets: 3, reps: '10 each side', weight: null, unit: 'bodyweight' },
  ],
}

export const dayLabels = {
  1: 'Day 1 – Strength',
  2: 'Day 2 – Muscle',
  3: 'Day 3 – Athletic',
}
