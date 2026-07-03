import { forwardRef } from 'react'
import type { CardData } from '../types'
import type { IconStyleEntry } from '../lib/manifest'
import { IconRow } from './IconRow'

/** Aufgelöste (fertige URLs) optische Elemente für die Karte. */
export interface CardVisuals {
  backgroundUrl: string | null
  deco: {
    topLeft?: string
    topRight?: string
    bottomLeft?: string
    bottomRight?: string
    oval?: string
    bottom?: string
  }
  bannerUrl: string | null
  iconStyle: IconStyleEntry
  accentColor: string
  imageUrl: string | null
}

interface Props {
  data: CardData
  visuals: CardVisuals
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="section-title">
      <span className="section-diamond">✦</span>
      <span className="section-label">{children}</span>
      <span className="section-diamond">✦</span>
    </div>
  )
}

export const Card = forwardRef<HTMLDivElement, Props>(function Card({ data, visuals }, ref) {
  const { deco } = visuals
  const bgStyle: React.CSSProperties = {
    ['--accent' as string]: visuals.accentColor,
  }
  if (visuals.backgroundUrl) {
    bgStyle.backgroundImage = `url("${visuals.backgroundUrl}")`
  }

  return (
    <div className="card" ref={ref} style={bgStyle}>
      {/* Deko-Ebene (rein dekorativ, hinter dem Inhalt) */}
      <div className="deco-layer">
        {deco.topLeft && <img className="deco deco-tl" src={deco.topLeft} alt="" draggable={false} />}
        {deco.topRight && <img className="deco deco-tr" src={deco.topRight} alt="" draggable={false} />}
        {deco.bottomLeft && <img className="deco deco-bl" src={deco.bottomLeft} alt="" draggable={false} />}
        {deco.bottomRight && (
          <img className="deco deco-br" src={deco.bottomRight} alt="" draggable={false} />
        )}
        {deco.bottom && <img className="deco deco-bottom" src={deco.bottom} alt="" draggable={false} />}
      </div>

      <div className="card-inner">
        <div className="card-border" />

        {/* Banner */}
        <div className="banner">
          {visuals.bannerUrl && (
            <img className="banner-img" src={visuals.bannerUrl} alt="" draggable={false} />
          )}
          <div className="banner-text">
            {data.category}
            <span className="banner-heart">♡</span>
          </div>
        </div>

        {/* Kopf: Titel | Autor */}
        <div className="header">
          <div className="header-col title-col">
            <div className="title">{data.title || 'Titel'}</div>
            {data.tagline && <div className="tagline">{data.tagline}</div>}
          </div>
          <div className="header-divider">
            <span className="divider-heart">♥</span>
          </div>
          <div className="header-col author-col">
            <div className="author">{data.author || 'Autor'}</div>
            {data.series && <div className="series">{data.series}</div>}
          </div>
        </div>

        {/* Mitte: Motiv | Pair + Summary */}
        <div className="mid">
          <div className="image-col">
            <div className="oval-frame">
              {visuals.imageUrl ? (
                <img className="oval-img" src={visuals.imageUrl} alt="" draggable={false} />
              ) : (
                <div className="oval-placeholder">Motiv&#10;hochladen</div>
              )}
              {deco.oval && <img className="oval-deco" src={deco.oval} alt="" draggable={false} />}
            </div>
          </div>

          <div className="info-col">
            <div className="box pair-box">
              <SectionTitle>PAIR:</SectionTitle>
              <div className="pair">{data.pair}</div>
            </div>
            <div className="box summary-box">
              <SectionTitle>SUMMARY:</SectionTitle>
              <div className="summary body-italic">{data.summary}</div>
            </div>
          </div>
        </div>

        {/* My Thoughts */}
        <div className="box thoughts-box">
          <SectionTitle>MY THOUGHTS:</SectionTitle>
          <div className="thoughts body-italic">{data.thoughts}</div>
        </div>

        {/* Sterne + Tropes */}
        <div className="stars-row">
          <IconRow type="stars" value={data.stars} iconStyle={visuals.iconStyle} size={24} />
          {data.tropes && <div className="tropes">{data.tropes}</div>}
        </div>

        {/* Bewertungs-Footer */}
        <div className="ratings">
          <div className="rating-cell">
            <div className="rating-label">EMOTIONS</div>
            <IconRow type="emotions" value={data.emotions} iconStyle={visuals.iconStyle} size={20} />
          </div>
          <div className="rating-sep" />
          <div className="rating-cell">
            <div className="rating-label">PACING</div>
            <IconRow type="pacing" value={data.pacing} iconStyle={visuals.iconStyle} size={20} />
          </div>
          <div className="rating-sep" />
          <div className="rating-cell">
            <div className="rating-label">SPICE</div>
            <IconRow type="spice" value={data.spice} iconStyle={visuals.iconStyle} size={20} />
          </div>
        </div>

        {/* Kartennummer */}
        <div className="card-number">
          <span className="num-heart">♥</span>
          <span>{data.cardNumber}</span>
          <span className="num-heart">♥</span>
        </div>
      </div>
    </div>
  )
})
