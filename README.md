# Strength Tracker

A React + Vite app for tracking a configurable strength program. Workouts and
history are stored in **Supabase** (hosted Postgres) behind email login, so your
data syncs across devices. The frontend is hosted on GitHub Pages; an
in-progress workout is cached in `localStorage` so a refresh won't lose it.

**Live:** https://markrodseth-mmt.github.io/workout-app/

## Supabase setup (one time)

The database schema lives in [`supabase/migrations/`](supabase/migrations/). With
the **Supabase GitHub integration** enabled, pushing to the production branch
applies these migrations to your project automatically — no manual SQL needed.

1. Create a free project at [supabase.com](https://supabase.com) and connect it
   to this repo (Supabase dashboard → **Integrations → GitHub**).
2. Push to the production branch; the integration runs the migration, creating
   the `workout_days`, `exercises`, and `sessions` tables with row-level security.
   _(Or apply it manually: paste [`supabase/migrations/20260618000000_init.sql`](supabase/migrations/20260618000000_init.sql)
   into the dashboard **SQL Editor** and Run.)_
3. Grab your API credentials from **Project Settings → API**:
   the **Project URL** and the **anon public** key.
4. (Optional but recommended) Under **Authentication → Providers → Email**, you
   can disable "Confirm email" for a smoother personal-use sign-up.

The anon key is safe to expose in the browser — RLS is what protects the data.

> The GitHub integration manages the **database** only. The frontend's Supabase
> URL + anon key still have to be set as GitHub Actions secrets (see Deployment).

## Development

```bash
npm install
cp .env.example .env.local   # then paste your Supabase URL + anon key
npm run dev      # local dev server
npm run build    # production build into dist/
npm run preview  # preview the production build
```

On first sign-in the app seeds the default 3-day program into your account; edit
it any time from the **Edit** tab.

## Deployment

Pushing to `main` triggers the GitHub Actions workflow in
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which builds the
app and publishes `dist/` to GitHub Pages.

One-time setup:

- **Settings → Pages → Build and deployment → Source** → select **GitHub Actions**.
- **Settings → Secrets and variables → Actions → New repository secret** → add
  `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The build reads these to
  bake your Supabase credentials into the deployed app.

> The Vite `base` in [`vite.config.js`](vite.config.js) is set to
> `/workout-app/` to match the Pages subpath. Update it if the repo is renamed.
