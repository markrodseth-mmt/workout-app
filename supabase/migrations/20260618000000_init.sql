-- Workout App schema for Supabase (Postgres).
-- Applied automatically by the Supabase GitHub integration on push to the
-- production branch. Idempotent: uses "if not exists" / "drop policy if exists",
-- so it's also safe to paste into the dashboard SQL Editor manually.

-- ── Tables ──────────────────────────────────────────────────────────────────

-- A configurable workout day (e.g. "Day 1 – Strength"). One row per day per user.
create table if not exists public.workout_days (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  position   int  not null default 0,
  label      text not null,
  created_at timestamptz not null default now()
);

-- The exercises that make up a day (the editable template).
create table if not exists public.exercises (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  day_id     uuid not null references public.workout_days (id) on delete cascade,
  position   int  not null default 0,
  name       text not null,
  sets       int  not null default 3,
  reps       text not null default '',
  weight     numeric,            -- null = bodyweight
  step       numeric,            -- increment per +/- tap
  unit       text not null default 'kg',
  created_at timestamptz not null default now()
);

-- A completed workout (history). Exercises are stored as a JSON snapshot so
-- edits to the template later don't rewrite past sessions.
create table if not exists public.sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  day_id       uuid references public.workout_days (id) on delete set null,
  day_label    text not null,
  performed_on date not null,
  exercises    jsonb not null,   -- [{ name, sets, reps, weight, unit, done }]
  created_at   timestamptz not null default now()
);

create index if not exists exercises_day_idx   on public.exercises (day_id);
create index if not exists days_user_idx        on public.workout_days (user_id);
create index if not exists sessions_user_idx     on public.sessions (user_id, created_at desc);

-- ── Row Level Security ───────────────────────────────────────────────────────
-- Every row is owned by a user; nobody can read or write anyone else's data.

alter table public.workout_days enable row level security;
alter table public.exercises    enable row level security;
alter table public.sessions     enable row level security;

drop policy if exists "own workout_days" on public.workout_days;
create policy "own workout_days" on public.workout_days
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own exercises" on public.exercises;
create policy "own exercises" on public.exercises
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own sessions" on public.sessions;
create policy "own sessions" on public.sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
