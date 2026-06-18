import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base must match the GitHub Pages subpath: https://markrodseth-mmt.github.io/workout-app/
export default defineConfig({
  base: '/workout-app/',
  plugins: [react()],
})
