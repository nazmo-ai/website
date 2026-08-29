import { PROVIDER_BY_ID } from '../../data/cloudRegions'
import type { RegionDot } from './renderDotMap'

/**
 * Label for the region under the cursor. Positioned absolutely inside the map
 * container and nudged up-left of the dot so it never sits under the pointer.
 */
export default function RegionTooltip({ dot }: { dot: RegionDot }) {
  const provider = PROVIDER_BY_ID[dot.provider]

  return (
    <div
      className="dot-map-tooltip"
      style={{ left: `${dot.x}px`, top: `${dot.y}px` }}
      role="status"
      aria-live="polite"
    >
      <span className="dot-map-tooltip-swatch" style={{ background: `var(--nz-provider-${dot.provider})` }} />
      <span className="dot-map-tooltip-code">{dot.code}</span>
      <span className="dot-map-tooltip-sep">·</span>
      <span>{dot.city}</span>
      <span className="dot-map-tooltip-sep">·</span>
      <span className="dot-map-tooltip-provider">{provider.name}</span>
    </div>
  )
}
