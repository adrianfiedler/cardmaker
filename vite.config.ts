import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base = './'  -> RELATIVE Pfade. Damit läuft die Seite egal, unter welchem
// Unterpfad GitHub Pages sie ausliefert (https://user.github.io/<repo>/).
// Kein Anpassen an den Repo-Namen nötig. Per Env überschreibbar, falls doch mal
// ein absoluter Pfad gebraucht wird:  VITE_BASE=/mein-repo/ npm run build
const base = process.env.VITE_BASE ?? './'

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    // Ausgabe direkt nach docs/, damit GitHub Pages "Deploy from a branch -> /docs"
    // den fertig gebauten Ordner ausliefern kann.
    outDir: 'docs',
    emptyOutDir: true,
  },
})
