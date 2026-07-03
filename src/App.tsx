import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Card, type CardVisuals } from './components/Card'
import { Editor } from './components/Editor'
import { emptyCard, type CardData, type CardStyle } from './types'
import { parseCard } from './lib/parseCard'
import {
  assetUrl,
  firstOr,
  loadManifest,
  type IconStyleEntry,
  type Manifest,
} from './lib/manifest'
import { buildFilename, exportCardPng } from './lib/export'

const SAMPLE = `📚 Titel
Ruin My Life
✍️ Autor
Julia McColgan
📖 Reihe
Mangled Masterpieces | Book 1
👥 Paar
Win × Remy
📍 Setting
MM Romance • High School / Second Chance
🏷️ Tropes
Childhood Friends • Second Chance • Hurt/Comfort • Mental Health
📝 Kurzinhalt
Remy und Win werden in der Highschool beste Freunde. Während Remy mit Depressionen kämpft, ist Win zunächst für ihn da. Sechs Jahre später kehrt er zurück und muss Remys Vertrauen zurückgewinnen.
📝 Urteil
Durchgängig warmes Miteinander mit starker Hurt/Comfort-Dynamik. Der Fokus liegt jedoch oft auf externem Drama, während ich mir mehr inneren Struggle gewünscht hätte.
⭐ Gesamtbewertung
⭐⭐⭐⭐☆ (4/5)
❤️ Emotionen
❤️❤️❤️❤️🤍
⚡ Pacing
⚡⚡⚡⚡🤍
🌶️ Spice
🌶️🌶️🌶️🤍🤍
🃏 Kartennummer
#50 | 07/26`

const STYLE_KEY = 'card-app.style.v1'

function loadSavedStyle(): Partial<CardStyle> {
  try {
    return JSON.parse(localStorage.getItem(STYLE_KEY) ?? '{}') as Partial<CardStyle>
  } catch {
    return {}
  }
}

export default function App() {
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<CardData>(() => ({ ...emptyCard(), ...parseCard(SAMPLE) }))
  const [pasteText, setPasteText] = useState(SAMPLE)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [style, setStyle] = useState<CardStyle | null>(null)
  const [exporting, setExporting] = useState(false)
  const [previewScale, setPreviewScale] = useState(1)

  const cardRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  // Manifest laden + Anfangs-Stil bestimmen (aus localStorage oder Defaults).
  useEffect(() => {
    loadManifest()
      .then((m) => {
        setManifest(m)
        const saved = loadSavedStyle()
        setStyle({
          backgroundId: firstOr(m.backgrounds, saved.backgroundId).id,
          decoId: firstOr(m.decoSets, saved.decoId).id,
          iconStyleId: firstOr(m.iconStyles, saved.iconStyleId).id,
          bannerId:
            saved.bannerId && m.banners.some((b) => b.id === saved.bannerId)
              ? saved.bannerId
              : null,
          accentColor: saved.accentColor ?? m.accentColors[0]?.value ?? '#3d5236',
        })
      })
      .catch((e) => setError(String(e)))
  }, [])

  // Stil speichern.
  useEffect(() => {
    if (style) localStorage.setItem(STYLE_KEY, JSON.stringify(style))
  }, [style])

  // Vorschau-Skalierung an verfügbaren Platz anpassen.
  useLayoutEffect(() => {
    const el = previewRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth - 48
      const h = el.clientHeight - 48
      setPreviewScale(Math.max(0.2, Math.min(w / 630, h / 880)))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [manifest])

  const onData = useCallback(
    <K extends keyof CardData>(field: K, value: CardData[K]) =>
      setData((d) => ({ ...d, [field]: value })),
    [],
  )
  const onStyle = useCallback(
    <K extends keyof CardStyle>(field: K, value: CardStyle[K]) =>
      setStyle((s) => (s ? { ...s, [field]: value } : s)),
    [],
  )

  const onApplyPaste = useCallback(() => {
    setData((d) => ({ ...d, ...parseCard(pasteText) }))
  }, [pasteText])

  const onImage = useCallback((file: File | null) => {
    if (!file) {
      setImageUrl(null)
      return
    }
    const reader = new FileReader()
    reader.onload = () => setImageUrl(typeof reader.result === 'string' ? reader.result : null)
    reader.readAsDataURL(file)
  }, [])

  const onExport = useCallback(async () => {
    if (!cardRef.current) return
    setExporting(true)
    try {
      await exportCardPng(cardRef.current, buildFilename(data.title, data.cardNumber), 3)
    } catch (e) {
      alert('Export fehlgeschlagen: ' + e)
    } finally {
      setExporting(false)
    }
  }, [data.title, data.cardNumber])

  if (error) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Fehler beim Laden der Assets</h2>
        <pre>{error}</pre>
        <p>Stelle sicher, dass <code>public/assets/manifest.json</code> existiert.</p>
      </div>
    )
  }

  if (!manifest || !style) {
    return <div style={{ padding: 40 }}>Lädt…</div>
  }

  const visuals = resolveVisuals(manifest, style, imageUrl)

  return (
    <div className="app">
      <Editor
        data={data}
        onData={onData}
        style={style}
        onStyle={onStyle}
        manifest={manifest}
        pasteText={pasteText}
        onPasteText={setPasteText}
        onApplyPaste={onApplyPaste}
        onImage={onImage}
        onExport={onExport}
        exporting={exporting}
      />
      <div className="preview-pane" ref={previewRef}>
        <div className="preview-scale" style={{ ['--preview-scale' as string]: previewScale }}>
          <Card ref={cardRef} data={data} visuals={visuals} />
        </div>
      </div>
    </div>
  )
}

function resolveVisuals(m: Manifest, style: CardStyle, imageUrl: string | null): CardVisuals {
  const bg = firstOr(m.backgrounds, style.backgroundId)
  const deco = firstOr(m.decoSets, style.decoId)
  const iconStyle: IconStyleEntry = firstOr(m.iconStyles, style.iconStyleId)
  const banner = style.bannerId ? m.banners.find((b) => b.id === style.bannerId) : null

  const anchorUrl = (name?: string) => (name ? assetUrl(`${deco.dir}/${name}`) : undefined)

  return {
    backgroundUrl: bg ? assetUrl(bg.file) : null,
    deco: {
      topLeft: anchorUrl(deco.anchors.topLeft),
      topRight: anchorUrl(deco.anchors.topRight),
      bottomLeft: anchorUrl(deco.anchors.bottomLeft),
      bottomRight: anchorUrl(deco.anchors.bottomRight),
      oval: anchorUrl(deco.anchors.oval),
      bottom: anchorUrl(deco.anchors.bottom),
    },
    bannerUrl: banner?.file ? assetUrl(banner.file) : null,
    iconStyle,
    accentColor: style.accentColor,
    imageUrl,
  }
}
