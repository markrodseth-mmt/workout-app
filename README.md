# 3-Day Strength Tracker

A React + Vite app for tracking a 3-day muscle & strength program. Workout
history is stored in your browser's `localStorage`, so data stays on your
device — no backend, no account.

**Live:** https://markrodseth-mmt.github.io/workout-app/

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # production build into dist/
npm run preview  # preview the production build
```

## Deployment

Pushing to `main` triggers the GitHub Actions workflow in
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which builds the
app and publishes `dist/` to GitHub Pages.

One-time setup: in the repo, go to **Settings → Pages → Build and deployment →
Source** and select **GitHub Actions**.

> The Vite `base` in [`vite.config.js`](vite.config.js) is set to
> `/workout-app/` to match the Pages subpath. Update it if the repo is renamed.
