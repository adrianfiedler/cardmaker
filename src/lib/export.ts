import { toSvg } from 'html-to-image'

/**
 * Rendert das Karten-DOM-Element als PNG und stößt den Download an.
 *
 * Warum nicht `toPng`? html-to-image rastert intern über `img.decode()`, das bei
 * SVG-`foreignObject`-Bildern in Chromium hängen bleiben kann. Deshalb nutzen wir
 * nur `toSvg` (klont DOM, bettet Bilder + Schriften ein) und rastern selbst über
 * ein `onload`-basiertes Image auf ein Canvas. Zuverlässig und schnell.
 *
 * Die Karte ist 630×880 px; `scale` skaliert hoch (3 ≈ 1890×2640 px, Druckqualität).
 */
export async function exportCardPng(
  node: HTMLElement,
  filename: string,
  scale = 3,
): Promise<void> {
  const w = node.offsetWidth
  const h = node.offsetHeight

  const svgUrl = await toSvg(node, { width: w, height: h })
  const img = await loadImage(svgUrl)

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * scale)
  canvas.height = Math.round(h * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas-Kontext nicht verfügbar')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('PNG konnte nicht erzeugt werden')

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`
  link.href = url
  link.click()
  // Object-URL nach kurzer Zeit freigeben (Download muss zuerst starten).
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

/** Lädt eine (SVG-)Data-URL onload-basiert; wirft bei Fehler/Timeout. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const timer = setTimeout(() => reject(new Error('Bild-Rendering hat zu lange gedauert')), 30000)
    img.onload = () => {
      clearTimeout(timer)
      resolve(img)
    }
    img.onerror = () => {
      clearTimeout(timer)
      reject(new Error('Bild konnte nicht gerendert werden'))
    }
    img.src = src
  })
}

/** Baut einen sicheren Dateinamen aus Titel + Kartennummer. */
export function buildFilename(title: string, cardNumber: string): string {
  const num = cardNumber.replace(/[^\d]/g, '').slice(0, 6)
  const safeTitle =
    title
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '') || 'karte'
  return `${safeTitle}${num ? `-${num}` : ''}.png`
}
