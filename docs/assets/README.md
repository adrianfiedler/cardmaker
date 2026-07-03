# Asset-Bibliothek

Alle optischen Bausteine der Karten liegen hier als PNG. Welche davon in der App
auswählbar sind, steht in **`manifest.json`**. Nach dem Ergänzen/Ändern von Dateien
oder Manifest einfach neu deployen (Push auf `main`).

Die Buch-Motive (das Bild pro Karte) gehören **nicht** hierher – die lädt man in der
App direkt im Browser hoch.

## Ordnerstruktur

```
public/assets/
├── manifest.json          ← Liste aller auswählbaren Elemente
├── backgrounds/           ← vollflächige Hintergründe (Papier/Textur)
│   └── *.png
├── deco/<set-name>/       ← Deko-Set: Blumen/Ranken an festen Ankerpunkten
│   ├── top-left.png
│   ├── top-right.png
│   ├── bottom-left.png
│   ├── bottom-right.png
│   ├── oval.png           ← Ranke rund um das Motiv-Oval (Mitte transparent!)
│   └── bottom.png         ← optionale Zierleiste unten (Achtung: Kartennummer!)
├── banners/               ← optionale Banner-Grafiken hinter dem Schriftzug
│   └── *.png
└── icons/<style-name>/    ← Bewertungs-Icons, je „voll“ und „leer“
    ├── stars-full.png     stars-empty.png
    ├── emotions-full.png  emotions-empty.png
    ├── pacing-full.png    pacing-empty.png
    └── spice-full.png     spice-empty.png
```

## manifest.json

```jsonc
{
  "backgrounds": [
    { "id": "creme", "name": "Creme Papier", "file": "backgrounds/creme.png" }
  ],
  "decoSets": [
    {
      "id": "botanical",
      "name": "Botanisch",
      "dir": "deco/botanical",
      "anchors": {            // nur vorhandene Anker angeben; fehlende werden weggelassen
        "topLeft": "top-left.png",
        "topRight": "top-right.png",
        "bottomLeft": "bottom-left.png",
        "bottomRight": "bottom-right.png",
        "oval": "oval.png"
        // "bottom": "bottom.png"   // nur setzen, wenn die Grafik die Kartennummer freilässt
      }
    }
  ],
  "banners": [
    { "id": "ribbon", "name": "Schleife", "file": "banners/ribbon.png" }
  ],
  "iconStyles": [
    { "id": "classic", "name": "Klassisch", "dir": "icons/classic" }
  ],
  "accentColors": [
    { "id": "green", "name": "Salbeigrün", "value": "#3d5236" }
  ]
}
```

- **Neuen Hintergrund/Banner/Deko-Set/Icon-Stil/Farbe hinzufügen** = Dateien ablegen +
  passenden Eintrag ins Manifest schreiben. `id` muss eindeutig sein, `name` ist die
  Anzeige in der App.

## Icons

- Genau diese vier Typen, je **full** (gefüllt) und **empty** (leer):
  `stars`, `emotions` (Herzen), `pacing` (Blitze), `spice` (Chili).
- Die App zeigt pro Bewertung 5 Icons und füllt automatisch `n` volle + Rest leere.
- Empfehlung: quadratisch, transparent, ~128×128 px.

## Deko + feste Karten-Geometrie

Die **Textpositionen sind im Code fixiert** (Datei `src/components/Card.tsx` /
`src/styles.css`) – Deko ist rein dekorativ und liegt hinter dem Text. Die Karte ist
intern **630 × 880 px** groß (= Seitenverhältnis 63×88 mm; Export skaliert ×3 auf
1890 × 2640 px). Wichtige Bereiche in diesen 630×880 px (x, y = obere linke Ecke):

| Bereich          | x   | y   | Breite | Höhe |
|------------------|----:|----:|-------:|-----:|
| Banner           |  78 |  26 |    474 |   96 |
| Motiv-Oval       |  30 | 209 |    256 |  406 |
| PAIR-Box         | 301 | 209 |    313 |   72 |
| SUMMARY-Box      | 301 | 293 |    313 |  322 |
| MY THOUGHTS-Box  |  28 | 630 |    574 |   89 |
| Sterne + Tropes  |  26 | 723 |    578 |   59 |
| Emotions/Pacing/Spice | 26 | 782 | 578 | 51 |
| Kartennummer     |  26 | 833 |    578 |   29 |

- **Corner-Deko** (`top-left` etc.) sitzt in den Ecken und darf ruhig in die Ränder
  ragen – Überlappung mit Text vermeiden.
- **`oval.png`** sollte in der Mitte transparent sein (ca. 256×406 px Fläche freilassen),
  damit das Motiv sichtbar bleibt. Empf. Dateigröße ~360×460 px.
- Möchte man einen **kompletten gezeichneten Rahmen** statt Code-Linien, kann man ihn
  als ein großes transparentes PNG (630×880 oder Vielfaches) bauen und als
  Corner-/Bottom-Anker oder künftig als eigenen Overlay-Slot einbinden – dann an obigen
  Koordinaten ausrichten.

## Platzhalter neu erzeugen

Die aktuell enthaltenen Dateien sind schlichte Platzhalter. Neu generieren mit:

```
node scripts/gen-assets.mjs
```
