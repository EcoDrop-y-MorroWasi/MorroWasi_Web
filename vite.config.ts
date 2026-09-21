import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'

// Huella de este build — VERCEL_GIT_COMMIT_SHA lo pone Vercel solo en cada
// deploy; en local (dev/build a mano) cae a "dev" para que UpdateGate nunca
// dispare fuera de producción. Se necesita ANTES de defineConfig porque Vite
// lee process.env para reemplazar %VITE_APP_VERSION% en index.html.
process.env.VITE_APP_VERSION = process.env.VERCEL_GIT_COMMIT_SHA || 'dev'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
  },
})
