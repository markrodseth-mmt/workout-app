-- Per-user app settings. One row per user, created on first save (upsert).
-- Currently holds the weekly workout goal that drives the Activity tab's rings.
create table if not exists public.user_settings (
  user_id             uuid primary key references auth.users (id) on delete cascade,
  weekly_workout_goal int not null default 3 check (weekly_workout_goal between 1 and 14),
  updated_at          timestamptz not null default now()
);

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table public.user_settings enable row level security;

drop policy if exists "own user_settings" on public.user_settings;
create policy "own user_settings" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
