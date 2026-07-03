import { emptyCard, type CardData } from '../types'

/**
 * Parst die emoji-strukturierte Zusammenfassung in ein CardData-Objekt.
 *
 * Erwartetes Format (Reihenfolge egal, Emoji optional):
 *   📚 Titel
 *   Ruin My Life
 *   ✍️ Autor
 *   Julia McColgan
 *   ...
 *
 * Auch inline unterstützt:  "Titel: Ruin My Life".
 * Unbekannte Abschnitte (Setting, Highlight, Re-Read-Faktor) werden ignoriert.
 */

// Bekannte Abschnitts-Labels -> Feldschlüssel (oder null = ignorieren).
// Schlüssel sind normalisiert (kleingeschrieben, ohne Doppelpunkt).
const LABELS: Record<string, keyof CardData | null> = {
  kategorie: 'category',
  genre: 'category',
  tagline: 'tagline',
  untertitel: 'tagline',
  titel: 'title',
  title: 'title',
  autor: 'author',
  author: 'author',
  reihe: 'series',
  serie: 'series',
  series: 'series',
  paar: 'pair',
  pair: 'pair',
  tropes: 'tropes',
  kurzinhalt: 'summary',
  summary: 'summary',
  inhalt: 'summary',
  urteil: 'thoughts',
  fazit: 'thoughts',
  gesamtbewertung: 'stars',
  bewertung: 'stars',
  emotionen: 'emotions',
  emotions: 'emotions',
  pacing: 'pacing',
  tempo: 'pacing',
  spice: 'spice',
  kartennummer: 'cardNumber',
  // Bewusst ignoriert (im Layout nicht sichtbar):
  setting: null,
  highlight: null,
  're-read-faktor': null,
  're-read': null,
  reread: null,
}

const RATING_FIELDS = new Set<keyof CardData>(['stars', 'emotions', 'pacing', 'spice'])

/** Entfernt führende Emojis/Symbole/Whitespace, um an das Label zu kommen. */
function stripLead(line: string): string {
  return line.replace(/^[^\p{L}#]+/u, '')
}

/** Prüft, ob eine Zeile ein bekannter Abschnittskopf ist; liefert Feld + Inline-Wert. */
function matchHeader(
  line: string,
): { field: keyof CardData | null; inline: string } | undefined {
  const stripped = stripLead(line)
  const colon = stripped.indexOf(':')
  const labelPart = colon >= 0 ? stripped.slice(0, colon) : stripped
  const key = labelPart.trim().toLowerCase()
  if (!(key in LABELS)) return undefined
  const inline = colon >= 0 ? stripped.slice(colon + 1).trim() : ''
  return { field: LABELS[key], inline }
}

/**
 * Zählt "gefüllte" Bewertungs-Glyphen (0..5). Ein explizites "(4/5)" hat Vorrang.
 * Leere Glyphen (☆, 🤍) werden ignoriert.
 */
function parseRating(value: string, field: keyof CardData): number {
  const explicit = value.match(/(\d)\s*\/\s*5/)
  if (explicit) return clamp5(parseInt(explicit[1], 10))

  let re: RegExp
  switch (field) {
    case 'stars':
      re = /[⭐★]/gu // ⭐ ★
      break
    case 'emotions':
      re = /[❤♥❣\u{1F493}-\u{1F49F}]/gu // ❤ ♥ + farbige Herzen (ohne 🤍)
      break
    case 'pacing':
      re = /⚡/gu // ⚡
      break
    case 'spice':
      re = /\u{1F336}/gu // 🌶
      break
    default:
      return 0
  }
  // 🤍 (weißes Herz) niemals als gefüllt zählen.
  const filled = (value.replace(/\u{1F90D}/gu, '').match(re) ?? []).length
  return clamp5(filled)
}

function clamp5(n: number): number {
  if (Number.isNaN(n)) return 0
  return Math.max(0, Math.min(5, n))
}

export function parseCard(input: string): CardData {
  const card = emptyCard()
  const lines = input.replace(/\r\n?/g, '\n').split('\n')

  let current: keyof CardData | null | undefined = undefined // undefined = kein Abschnitt / ignoriert
  let buffer: string[] = []

  const flush = () => {
    if (current == null) {
      buffer = []
      return
    }
    const value = buffer.join('\n').replace(/\n{2,}/g, '\n').trim()
    if (value) assign(card, current, value)
    buffer = []
  }

  for (const line of lines) {
    const header = matchHeader(line)
    if (header) {
      flush()
      current = header.field
      buffer = header.inline ? [header.inline] : []
    } else {
      buffer.push(line)
    }
  }
  flush()

  return card
}

function assign(card: CardData, field: keyof CardData, value: string): void {
  if (RATING_FIELDS.has(field)) {
    ;(card[field] as number) = parseRating(value, field)
    return
  }
  // Mehrzeilige Textfelder als ein Absatz (weiche Umbrüche zu Leerzeichen),
  // außer der Wert enthält bewusst mehrere Zeilen -> zu Leerzeichen normalisieren.
  const text = value.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim()
  ;(card[field] as string) = text
}
