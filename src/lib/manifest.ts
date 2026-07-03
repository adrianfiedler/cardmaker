// Lädt und typisiert die Asset-Bibliothek aus public/assets/manifest.json.

export interface BackgroundEntry {
  id: string
  name: string
  file: string // relativ zu assets/, z.B. "backgrounds/cream.png"
}

export interface DecoAnchors {
  topLeft?: string
  topRight?: string
  bottomLeft?: string
  bottomRight?: string
  oval?: string // Ranke rund um das Motiv-Oval
  bottom?: string // Zierleiste unten
}

export interface DecoEntry {
  id: string
  name: string
  dir: string // z.B. "deco/botanical"
  anchors: DecoAnchors
}

export interface BannerEntry {
  id: string
  name: string
  file: string | null // null = kein Banner-Bild (nur Schriftzug)
}

export interface IconStyleEntry {
  id: string
  name: string
  dir: string // enthält <type>-full.png / <type>-empty.png
}

export interface AccentColor {
  id: string
  name: string
  value: string // CSS-Farbe
}

export interface Manifest {
  backgrounds: BackgroundEntry[]
  decoSets: DecoEntry[]
  banners: BannerEntry[]
  iconStyles: IconStyleEntry[]
  accentColors: AccentColor[]
}

/** Basis-URL der Assets (berücksichtigt den GitHub-Pages base-Pfad). */
export const ASSET_BASE = `${import.meta.env.BASE_URL}assets/`

/** Löst einen assets-relativen Pfad zu einer ladbaren URL auf. */
export function assetUrl(relative: string): string {
  return ASSET_BASE + relative.replace(/^\/+/, '')
}

export type RatingType = 'stars' | 'emotions' | 'pacing' | 'spice'

/** Dateiname eines Icons innerhalb eines Icon-Style-Ordners. */
export function iconFile(style: IconStyleEntry, type: RatingType, filled: boolean): string {
  return assetUrl(`${style.dir}/${type}-${filled ? 'full' : 'empty'}.png`)
}

export async function loadManifest(): Promise<Manifest> {
  const res = await fetch(assetUrl('manifest.json'))
  if (!res.ok) throw new Error(`Manifest konnte nicht geladen werden (${res.status})`)
  return (await res.json()) as Manifest
}

export function firstOr<T extends { id: string }>(list: T[], id: string | undefined): T {
  return list.find((x) => x.id === id) ?? list[0]
}
