import type { CardData, CardStyle } from '../types'
import { assetUrl, type Manifest } from '../lib/manifest'

interface Props {
  data: CardData
  onData: <K extends keyof CardData>(field: K, value: CardData[K]) => void
  style: CardStyle
  onStyle: <K extends keyof CardStyle>(field: K, value: CardStyle[K]) => void
  manifest: Manifest
  pasteText: string
  onPasteText: (t: string) => void
  onApplyPaste: () => void
  onImage: (file: File | null) => void
  onExport: () => void
  exporting: boolean
}

export function Editor(props: Props) {
  const { data, onData, style, onStyle, manifest } = props

  const text = (field: keyof CardData, label: string) => (
    <div className="field">
      <label>{label}</label>
      <input
        type="text"
        value={data[field] as string}
        onChange={(e) => onData(field, e.target.value as CardData[typeof field])}
      />
    </div>
  )

  const area = (field: keyof CardData, label: string, rows = 4) => (
    <div className="field">
      <label>{label}</label>
      <textarea
        rows={rows}
        value={data[field] as string}
        onChange={(e) => onData(field, e.target.value as CardData[typeof field])}
      />
    </div>
  )

  const rating = (field: 'stars' | 'emotions' | 'pacing' | 'spice', label: string) => (
    <div className="rating-input">
      <label>{label}</label>
      <input
        type="range"
        min={0}
        max={5}
        step={1}
        value={data[field]}
        onChange={(e) => onData(field, Number(e.target.value))}
      />
      <span className="val">{data[field]}/5</span>
    </div>
  )

  return (
    <div className="editor-pane">
      <h1>🃏 Sammelkarten-Generator</h1>
      <p className="sub">Zusammenfassung einfügen → übernehmen → Motiv & Stil wählen → als PNG exportieren.</p>

      <button className="btn btn-primary" onClick={props.onExport} disabled={props.exporting}>
        {props.exporting ? 'Exportiere…' : '⬇  Als PNG exportieren'}
      </button>

      <hr className="divider-line" />

      <div className="section-heading">1 · Zusammenfassung einfügen</div>
      <div className="field">
        <textarea
          rows={7}
          placeholder="Die komplette 📚-Zusammenfassung hier einfügen …"
          value={props.pasteText}
          onChange={(e) => props.onPasteText(e.target.value)}
        />
      </div>
      <button className="btn btn-ghost" onClick={props.onApplyPaste}>
        ↥  Felder aus Text übernehmen
      </button>

      <hr className="divider-line" />

      <div className="section-heading">2 · Motiv-Bild</div>
      <div className="field">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => props.onImage(e.target.files?.[0] ?? null)}
        />
      </div>

      <hr className="divider-line" />

      <div className="section-heading">3 · Texte (editierbar)</div>
      {text('category', 'Banner-Kategorie')}
      {text('title', 'Titel')}
      {text('tagline', 'Untertitel / Tagline (optional)')}
      {text('author', 'Autor')}
      {text('series', 'Reihe')}
      {text('pair', 'Paar')}
      {area('summary', 'Kurzinhalt (Summary)', 5)}
      {area('thoughts', 'Urteil (My Thoughts)', 5)}
      {text('tropes', 'Tropes')}
      {text('cardNumber', 'Kartennummer')}

      <div className="section-heading" style={{ marginTop: 14 }}>Bewertungen</div>
      {rating('stars', 'Gesamt')}
      {rating('emotions', 'Emotions')}
      {rating('pacing', 'Pacing')}
      {rating('spice', 'Spice')}

      <hr className="divider-line" />

      <div className="section-heading">4 · Optik</div>

      <div className="field">
        <label>Hintergrund</label>
        <div className="thumbs">
          {manifest.backgrounds.map((bg) => (
            <button
              key={bg.id}
              className={`thumb ${style.backgroundId === bg.id ? 'active' : ''}`}
              title={bg.name}
              onClick={() => onStyle('backgroundId', bg.id)}
            >
              <img src={assetUrl(bg.file)} alt={bg.name} />
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Deko-Set (Blumen / Rahmen)</label>
        <select value={style.decoId} onChange={(e) => onStyle('decoId', e.target.value)}>
          {manifest.decoSets.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <div className="row">
          <div>
            <label>Icon-Stil</label>
            <select value={style.iconStyleId} onChange={(e) => onStyle('iconStyleId', e.target.value)}>
              {manifest.iconStyles.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Banner-Bild</label>
            <select
              value={style.bannerId ?? 'none'}
              onChange={(e) => onStyle('bannerId', e.target.value === 'none' ? null : e.target.value)}
            >
              <option value="none">— keines —</option>
              {manifest.banners
                .filter((b) => b.file)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      <div className="field">
        <label>Akzentfarbe</label>
        <div className="swatches">
          {manifest.accentColors.map((c) => (
            <button
              key={c.id}
              className={`swatch ${style.accentColor === c.value ? 'active' : ''}`}
              style={{ background: c.value }}
              title={c.name}
              onClick={() => onStyle('accentColor', c.value)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
