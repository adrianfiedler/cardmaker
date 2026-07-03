import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// WICHTIG für GitHub Pages:
// Wenn die Seite unter https://<user>.github.io/<repo-name>/ läuft, muss `base`
// auf '/<repo-name>/' stehen (mit Schrägstrichen). Beispiel: base: '/card-app/'.
// Bei einem eigenen Custom-Domain oder User-Pages-Repo (<user>.github.io) auf '/'.
// Per Env überschreibbar:  VITE_BASE=/mein-repo/ npm run build
const base = process.env.VITE_BASE ?? '/card-app/'

export default defineConfig({
  base,
  plugins: [react()],
})
