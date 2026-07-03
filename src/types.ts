// Zentrale Datentypen für eine Sammelkarte.

/** Vom Text-Parser gefüllte, danach frei editierbare Karteninhalte. */
export interface CardData {
  /** Banner-Kategorie oben, z.B. "Romance" (kein Eingabefeld -> Default). */
  category: string
  /** Optionale Tagline unter dem Titel, z.B. "Like Teammates". */
  tagline: string
  title: string
  author: string
  /** Reihe/Serie, z.B. "Mangled Masterpieces | Book 1". */
  series: string
  /** Paar, z.B. "Win × Remy". */
  pair: string
  /** Kurzinhalt -> SUMMARY. */
  summary: string
  /** Urteil -> MY THOUGHTS. */
  thoughts: string
  /** Tropes-Zeile (mit • getrennt). */
  tropes: string
  /** Kartennummer-Zeile, z.B. "#50 | 07/26". */
  cardNumber: string

  /** Bewertungen 0..5. */
  stars: number
  emotions: number
  pacing: number
  spice: number
}

export function emptyCard(): CardData {
  return {
    category: 'Romance',
    tagline: '',
    title: '',
    author: '',
    series: '',
    pair: '',
    summary: '',
    thoughts: '',
    tropes: '',
    cardNumber: '',
    stars: 0,
    emotions: 0,
    pacing: 0,
    spice: 0,
  }
}

/** Auswahl der optischen Elemente (IDs zeigen ins Manifest). */
export interface CardStyle {
  backgroundId: string
  decoId: string
  iconStyleId: string
  bannerId: string | null
  accentColor: string
}
