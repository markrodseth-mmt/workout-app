-- Workout App — schema redesign.
-- Introduces: workout types (gym/tennis/yoga/…), a reusable gym exercise
-- library with curated alternates, named workouts, a weekly plan, and a
-- normalized session log that tracks the actual weight used and any swap.
--
-- Replaces the original workout_days / exercises / sessions model. Existing
-- data is the seeded default program only, so we drop and rebuild cleanly.
-- Idempotent where practical; safe to re-run.

-- ── Tear down the old model ──────────────────────────────────────────────────
drop table if exists public.sessions      cascade;
drop table if exists public.exercises      cascade;
drop table if exists public.workout_days   cascade;

-- ── Exercise library (gym) ───────────────────────────────────────────────────
-- The reusable pool of gym exercises a user can drop into any workout.
-- weight = null means a bodyweight movement. `step` is the +/- increment.
create table if not exists public.exercise_library (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  name          text not null,
  muscle_group  text,                       -- e.g. 'Chest', 'Legs', 'Back'
  default_sets  int     not null default 3,
  default_reps  text    not null default '10',
  default_weight numeric,                   -- null = bodyweight
  step          numeric not null default 2.5,
  unit          text    not null default 'kg',
  created_at    timestamptz not null default now()
);

-- Curated swaps: "you may substitute exercise B for exercise A".
-- Stored symmetrically by the app (insert both directions) so a lookup from
-- either side returns the same set of alternates.
create table if not exists public.exercise_alternates (
  user_id      uuid not null references auth.users (id) on delete cascade,
  exercise_id  uuid not null references public.exercise_library (id) on delete cascade,
  alternate_id uuid not null references public.exercise_library (id) on delete cascade,
  primary key (exercise_id, alternate_id),
  check (exercise_id <> alternate_id)
);

-- ── Workouts (templates) ─────────────────────────────────────────────────────
-- A named routine. `category` distinguishes the machinery: 'gym' workouts have
-- workout_exercises; 'tennis'/'yoga'/other are logged as completion + duration.
create table if not exists public.workouts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  category   text not null default 'gym',   -- 'gym' | 'tennis' | 'yoga' | other
  notes      text,
  created_at timestamptz not null default now()
);

-- Exercises placed into a gym workout, in order. Sets/reps/target weight here
-- override the library defaults for this specific workout.
create table if not exists public.workout_exercises (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  workout_id    uuid not null references public.workouts (id) on delete cascade,
  exercise_id   uuid not null references public.exercise_library (id) on delete restrict,
  position      int  not null default 0,
  sets          int  not null default 3,
  reps          text not null default '10',
  target_weight numeric,                    -- null = bodyweight; the starting weight
  step          numeric not null default 2.5
);

-- ── Weekly plan ──────────────────────────────────────────────────────────────
-- The workouts the user aims to do in a week (≈3). Ordered; day_of_week is an
-- optional pin (0 = Monday … 6 = Sunday, null = unpinned / "any day").
create table if not exists public.schedule (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  workout_id  uuid not null references public.workouts (id) on delete cascade,
  position    int  not null default 0,
  day_of_week int,                          -- 0..6 or null
  created_at  timestamptz not null default now(),
  check (day_of_week is null or day_of_week between 0 and 6)
);

-- ── Sessions (history) ───────────────────────────────────────────────────────
-- One completed workout. Name/category are snapshotted so later template edits
-- don't rewrite past history. Gym sessions also have session_exercises rows;
-- tennis/yoga use duration_min + notes only.
create table if not exists public.sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  workout_id    uuid references public.workouts (id) on delete set null,
  workout_name  text not null,
  category      text not null default 'gym',
  performed_on  date not null,
  duration_min  int,                         -- for tennis/yoga (or any timed session)
  notes         text,
  completed     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Per-exercise actuals for a gym session. `exercise_id` is the exercise actually
-- performed (the alternate, if one was chosen); `swapped_from_id` records the
-- originally prescribed exercise when a swap happened. `name` is snapshotted.
create table if not exists public.session_exercises (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  session_id      uuid not null references public.sessions (id) on delete cascade,
  exercise_id     uuid references public.exercise_library (id) on delete set null,
  swapped_from_id uuid references public.exercise_library (id) on delete set null,
  position        int  not null default 0,
  name            text not null,
  sets            int,
  reps            text,
  weight          numeric,                   -- actual weight used; null = bodyweight
  unit            text not null default 'kg',
  done            boolean not null default false
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists exlib_user_idx        on public.exercise_library (user_id);
create index if not exists altern_user_idx        on public.exercise_alternates (user_id);
create index if not exists workouts_user_idx       on public.workouts (user_id);
create index if not exists wex_workout_idx          on public.workout_exercises (workout_id, position);
create index if not exists schedule_user_idx         on public.schedule (user_id, position);
create index if not exists sessions_user_idx          on public.sessions (user_id, created_at desc);
create index if not exists sesex_session_idx           on public.session_exercises (session_id, position);
-- Progression queries: "show me weight over time for this exercise".
create index if not exists sesex_exercise_idx           on public.session_exercises (user_id, exercise_id);

-- ── Row Level Security ───────────────────────────────────────────────────────
-- Every row is owned by a user; nobody can read or write anyone else's data.
alter table public.exercise_library    enable row level security;
alter table public.exercise_alternates enable row level security;
alter table public.workouts            enable row level security;
alter table public.workout_exercises   enable row level security;
alter table public.schedule            enable row level security;
alter table public.sessions            enable row level security;
alter table public.session_exercises   enable row level security;

drop policy if exists "own exercise_library" on public.exercise_library;
create policy "own exercise_library" on public.exercise_library
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own exercise_alternates" on public.exercise_alternates;
create policy "own exercise_alternates" on public.exercise_alternates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own workouts" on public.workouts;
create policy "own workouts" on public.workouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own workout_exercises" on public.workout_exercises;
create policy "own workout_exercises" on public.workout_exercises
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own schedule" on public.schedule;
create policy "own schedule" on public.schedule
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own sessions" on public.sessions;
create policy "own sessions" on public.sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own session_exercises" on public.session_exercises;
create policy "own session_exercises" on public.session_exercises
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
