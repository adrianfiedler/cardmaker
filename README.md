# 🃏 Sammelkarten-Generator

Eine kleine Web-App, um für gelesene Bücher digitale Sammelkarten im Format **63 × 88 mm**
(Standard-Trading-Card) zu erzeugen. Man fügt die emoji-strukturierte Zusammenfassung ein,
lädt ein Motiv-Bild hoch, wählt Hintergrund/Deko/Farbe – und exportiert die fertige Karte
als PNG in Druckauflösung (1890 × 2640 px).

Der Aufbau der Karte ist immer gleich (nach Vorbild der Beispielkarte); nur Motiv,
Hintergrund, Blumen/Rahmen und Akzentfarbe variieren.

## Schnellstart (lokal)

Voraussetzung: [Node.js](https://nodejs.org) ≥ 18.

```bash
npm install
npm run dev
```

Dann die angezeigte Adresse öffnen (z. B. `http://localhost:5173/card-app/`).

Weitere Befehle:

```bash
npm run build     # Produktions-Build nach dist/
npm run preview   # Build lokal ansehen
```

## Bedienung

1. **Zusammenfassung einfügen** – den kompletten 📚-Text ins Textfeld kopieren und
   „Felder aus Text übernehmen“ klicken. Titel, Autor, Reihe, Paar, Kurzinhalt, Urteil,
   Tropes, Bewertungen und Kartennummer werden automatisch erkannt. Danach ist jedes Feld
   noch von Hand editierbar.
2. **Motiv-Bild** hochladen (erscheint im Oval).
3. **Optik** wählen: Hintergrund, Deko-Set, Icon-Stil, Banner, Akzentfarbe.
4. **Als PNG exportieren.**

Die zuletzt gewählte Optik wird im Browser gemerkt.

## Eigene Grafiken hinzufügen

Alle Hintergründe, Blumen/Rahmen, Banner und Icons liegen unter **`public/assets/`** und
werden über `public/assets/manifest.json` eingebunden. Wie man neue Motive ergänzt, steht
ausführlich in **[`public/assets/README.md`](public/assets/README.md)** (inkl. der festen
Karten-Koordinaten für passgenaue Rahmen). Nach Änderungen neu deployen.

## Deployment auf GitHub Pages

Der mitgelieferte Workflow **`.github/workflows/deploy.yml`** baut und veröffentlicht die
Seite bei jedem Push auf `main` automatisch. Einmalig einrichten:

1. Repo auf GitHub anlegen und pushen.
2. In **Settings → Pages** unter *Build and deployment* → *Source* **„GitHub Actions“**
   auswählen.
3. Push auf `main` → die Seite erscheint unter
   `https://<dein-github-name>.github.io/<repo-name>/`.

Der `base`-Pfad wird im Workflow automatisch aus dem Repo-Namen gesetzt
(`VITE_BASE=/<repo-name>/`). Läuft die Seite lokal oder unter einem anderen Pfad, lässt
sich das überschreiben:

```bash
VITE_BASE=/mein-pfad/ npm run build
```

Standardwert (falls nichts gesetzt ist) steht in `vite.config.ts`.

## Technik

- **Vite + React + TypeScript**
- **html-to-image** (`toSvg`) zum Einbetten von Layout, Bildern und Schriften; die
  Rasterung auf Canvas passiert selbst (umgeht einen Chromium-Hänger bei `toPng`).
- Gebündelte Schriften via **@fontsource** (Playfair Display, EB Garamond, Pinyon Script),
  damit der Export ohne externe Requests funktioniert.

## Projektstruktur

```
src/
  App.tsx                 App-Zustand, Layout, Export-Trigger
  components/
    Card.tsx              Karten-Renderer (feste Geometrie + Ebenen)
    Editor.tsx            Formular + Optik-Auswahl
    IconRow.tsx           Bewertungs-Icons (voll/leer)
  lib/
    parseCard.ts          Text-Parser (Emoji-Abschnitte -> Felder)
    manifest.ts           Laden der Asset-Bibliothek
    export.ts             PNG-Export
  types.ts                Datentypen
public/assets/            Bibliothek (Hintergründe, Deko, Icons) + manifest.json
scripts/gen-assets.mjs    Erzeugt die Platzhalter-Grafiken
```
