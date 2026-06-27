-- One-off data script (NOT a schema migration).
-- Adds 8 kettlebell/core exercises and a "Day 4 – Kettlebell & Core" workout to
-- an EXISTING account, then appends it to the weekly plan and wires up alternates.
--
-- Why this exists: seedDefaults() (src/lib/db.js) only runs once, on first login,
-- so editing src/data/seed.js does not touch live accounts. Paste this into the
-- Supabase dashboard -> SQL Editor -> Run. It derives your user_id automatically
-- from existing rows and is fully idempotent (safe to run more than once).

do $$
declare
  uid uuid;
  wid uuid;
begin
  select user_id into uid from public.exercise_library limit 1;
  if uid is null then
    raise exception 'No existing exercise_library rows found; cannot derive user_id.';
  end if;

  -- 1) New library exercises (skip any that already exist by name for this user).
  insert into public.exercise_library
    (user_id, name, muscle_group, default_sets, default_reps, default_weight, step, unit)
  select uid, v.name, v.muscle_group, v.default_sets, v.default_reps, v.default_weight, v.step, v.unit
  from (values
    ('Renegade Row',             'Back',      3, '8 each side',      16::numeric, 2::numeric,   'kg each'),
    ('1-Arm Kettlebell Swing',   'Glutes',    3, '10 each side',     16::numeric, 4::numeric,   'kg'),
    ('Kettlebell Clean & Press', 'Shoulders', 3, '6 each side',      16::numeric, 2::numeric,   'kg'),
    ('Windmill',                 'Core',      3, '6 each side',      12::numeric, 2::numeric,   'kg'),
    ('Hardstyle Side Plank',     'Core',      3, '30 sec each side', null::numeric, 2.5::numeric, 'bodyweight'),
    ('Bird Dog',                 'Core',      3, '10 each side',     null::numeric, 2.5::numeric, 'bodyweight'),
    ('Glute Bridge',             'Glutes',    3, '15',               null::numeric, 2.5::numeric, 'bodyweight'),
    ('Suitcase Carry',           'Core',      3, '30 m each side',   24::numeric, 4::numeric,   'kg')
  ) as v(name, muscle_group, default_sets, default_reps, default_weight, step, unit)
  where not exists (
    select 1 from public.exercise_library e
    where e.user_id = uid and e.name = v.name
  );

  -- 2) The Day 4 workout (guarded by name).
  select id into wid from public.workouts
  where user_id = uid and name = 'Day 4 – Kettlebell & Core' limit 1;
  if wid is null then
    insert into public.workouts (user_id, name, category)
    values (uid, 'Day 4 – Kettlebell & Core', 'gym')
    returning id into wid;
  end if;

  -- 3) Workout exercises (resolved from the library by name; includes existing Dead Bug).
  --    Idempotent: only insert rows not already present for this workout.
  insert into public.workout_exercises
    (user_id, workout_id, exercise_id, position, sets, reps, target_weight, step)
  select uid, wid, lib.id, p.position, p.sets, p.reps, p.target_weight, p.step
  from (values
    ('1-Arm Kettlebell Swing',   0, 3, '10 each side',     16::numeric, 4::numeric),
    ('Kettlebell Clean & Press', 1, 3, '6 each side',      16::numeric, 2::numeric),
    ('Renegade Row',             2, 3, '8 each side',      16::numeric, 2::numeric),
    ('Windmill',                 3, 3, '6 each side',      12::numeric, 2::numeric),
    ('Suitcase Carry',           4, 3, '30 m each side',   24::numeric, 4::numeric),
    ('Hardstyle Side Plank',     5, 3, '30 sec each side', null::numeric, 2.5::numeric),
    ('Bird Dog',                 6, 3, '10 each side',     null::numeric, 2.5::numeric),
    ('Glute Bridge',             7, 3, '15',               null::numeric, 2.5::numeric),
    ('Dead Bug',                 8, 3, '10 each side',     null::numeric, 2.5::numeric)
  ) as p(name, position, sets, reps, target_weight, step)
  join public.exercise_library lib on lib.user_id = uid and lib.name = p.name
  where not exists (
    select 1 from public.workout_exercises we
    where we.workout_id = wid and we.exercise_id = lib.id
  );

  -- 4) Append Day 4 to the weekly plan (only if not already scheduled).
  if not exists (
    select 1 from public.schedule s where s.user_id = uid and s.workout_id = wid
  ) then
    insert into public.schedule (user_id, workout_id, position)
    values (
      uid, wid,
      (select coalesce(max(position), -1) + 1 from public.schedule where user_id = uid)
    );
  end if;

  -- 5) Curated alternates (symmetric). on conflict relies on the (exercise_id, alternate_id) PK.
  insert into public.exercise_alternates (user_id, exercise_id, alternate_id)
  select uid, a.id, b.id
  from (values
    ('Suitcase Carry',         'Farmer''s Carry'),
    ('Hardstyle Side Plank',   'Plank'),
    ('Dead Bug',               'Bird Dog'),
    ('1-Arm Kettlebell Swing', 'Hip Thrust')
  ) as pr(x, y)
  join public.exercise_library a on a.user_id = uid and a.name = pr.x
  join public.exercise_library b on b.user_id = uid and b.name = pr.y
  on conflict (exercise_id, alternate_id) do nothing;

  insert into public.exercise_alternates (user_id, exercise_id, alternate_id)
  select uid, b.id, a.id
  from (values
    ('Suitcase Carry',         'Farmer''s Carry'),
    ('Hardstyle Side Plank',   'Plank'),
    ('Dead Bug',               'Bird Dog'),
    ('1-Arm Kettlebell Swing', 'Hip Thrust')
  ) as pr(x, y)
  join public.exercise_library a on a.user_id = uid and a.name = pr.x
  join public.exercise_library b on b.user_id = uid and b.name = pr.y
  on conflict (exercise_id, alternate_id) do nothing;
end $$;
