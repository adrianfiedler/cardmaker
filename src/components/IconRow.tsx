import { iconFile, type IconStyleEntry, type RatingType } from '../lib/manifest'

interface Props {
  type: RatingType
  value: number // 0..5
  total?: number
  iconStyle: IconStyleEntry
  size?: number
}

/**
 * Rendert `total` Icons: `value` volle + Rest leere, aus dem gewählten Icon-Style.
 */
export function IconRow({ type, value, total = 5, iconStyle, size = 22 }: Props) {
  const filled = Math.max(0, Math.min(total, Math.round(value)))
  return (
    <div className="icon-row" style={{ ['--icon-size' as string]: `${size}px` }}>
      {Array.from({ length: total }, (_, i) => (
        <img
          key={i}
          className="icon-img"
          src={iconFile(iconStyle, type, i < filled)}
          alt=""
          draggable={false}
        />
      ))}
    </div>
  )
}
