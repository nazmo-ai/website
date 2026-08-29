import { PROVIDER_BY_ID } from '../../data/cloudRegions'
import type { RegionDot } from './renderDotMap'

interface Props {
  /** Every region sharing the hovered metro, in provider order. */
  members: RegionDot[]
  /** The specific dot under the cursor, if the pointer resolved to one. */
  active: RegionDot | null
  /** Canvas width, used to keep the card from running off either edge. */
  containerWidth: number
}

/**
 * Names what is under the cursor.
 *
 * Lists the whole cluster rather than a single region: at hero scale a metro
 * like Frankfurt or Tokyo hosts six providers within a few pixels, and asking
 * someone to thread a cursor between individual petals to enumerate them is a
 * worse interaction than simply showing all six at once.
 */
export default function RegionTooltip({ members, active, containerWidth }: Props) {
  if (members.length === 0) return null

  const [first] = members
  // A six-row cluster card is ~170px tall and renders above its dot, which would
  // push it off-screen for northern metros like Stockholm and Oslo. Flip it below.
  const below = first.y < 40 + members.length * 24
  // Half the capped card width (16rem), so an edge metro like Sydney stays on
  // screen. Must track the max-width in .dot-map-tooltip.is-cluster.
  const margin = 132
  const left = containerWidth > margin * 2
    ? Math.min(Math.max(first.x, margin), containerWidth - margin)
    : first.x
  const anchorStyle = { left: `${left}px`, top: `${first.y}px` }

  if (members.length === 1) {
    const provider = PROVIDER_BY_ID[first.provider]
    return (
      <div
        className={`dot-map-tooltip${below ? ' is-below' : ''}`}
        style={anchorStyle}
        role="status"
        aria-live="polite"
      >
        <span
          className="dot-map-tooltip-swatch"
          style={{ background: `var(--nz-provider-${first.provider})` }}
        />
        <span className="dot-map-tooltip-code">{first.code}</span>
        <span className="dot-map-tooltip-sep">·</span>
        <span>{first.city}</span>
        <span className="dot-map-tooltip-sep">·</span>
        <span className="dot-map-tooltip-provider">{provider.name}</span>
      </div>
    )
  }

  return (
    <div
      className={`dot-map-tooltip is-cluster${below ? ' is-below' : ''}`}
      style={anchorStyle}
      role="status"
      aria-live="polite"
    >
      <div className="dot-map-tooltip-head">
        {first.city}
        <span className="dot-map-tooltip-count">{members.length} regions</span>
      </div>
      <ul className="dot-map-tooltip-list">
        {members.map((member) => (
          <li
            key={`${member.provider}-${member.code}`}
            className={member === active ? 'is-active' : undefined}
          >
            <span
              className="dot-map-tooltip-swatch"
              style={{ background: `var(--nz-provider-${member.provider})` }}
            />
            <span className="dot-map-tooltip-code">{member.code}</span>
            <span className="dot-map-tooltip-provider">
              {PROVIDER_BY_ID[member.provider].name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
