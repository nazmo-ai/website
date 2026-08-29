import type { FlowNodeSpec, NodeBox } from '../../data/orchestrationFlow'
import type { NodeStatus } from './flowRunner'
import { wrapLabel } from './wrapLabel'

interface Props {
  spec: FlowNodeSpec
  box: NodeBox
  status: NodeStatus
  /** True when the node sits on the failure branch, which recolours it. */
  onFailPath: boolean
  hovered: boolean
  onHover: (id: string | null) => void
}

export default function FlowNode({ spec, box, status, onFailPath, hovered, onHover }: Props) {
  const { x, y, w, h } = box
  const left = x - w / 2
  const top = y - h / 2
  const lines = wrapLabel(spec.label, w)
  const lineHeight = 15
  const firstLineY = y - ((lines.length - 1) * lineHeight) / 2 + 4

  const tone = spec.kind === 'human' ? 'human' : onFailPath ? 'fail' : 'agent'
  const showStatus = status === 'active' || status === 'waiting'

  return (
    <g
      className={`flow-node flow-node-${tone} flow-node-${status}${hovered ? ' is-hovered' : ''}`}
      onMouseEnter={() => onHover(spec.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(spec.id)}
      onBlur={() => onHover(null)}
      tabIndex={0}
      role="listitem"
      aria-label={`${spec.label}. ${spec.detail.what}`}
    >
      {spec.kind === 'human' && (
        <rect
          className="flow-node-ring"
          x={left - 5}
          y={top - 5}
          width={w + 10}
          height={h + 10}
          rx={14}
        />
      )}

      <rect className="flow-node-box" x={left} y={top} width={w} height={h} rx={10} />

      <text className="flow-node-label" x={x} y={firstLineY} textAnchor="middle">
        {lines.map((line, i) => (
          <tspan key={line} x={x} dy={i === 0 ? 0 : lineHeight}>
            {line}
          </tspan>
        ))}
      </text>

      <g className="flow-node-badge" transform={`translate(${left + w - 7}, ${top + 7})`}>
        <circle r={7.5} />
        {status === 'done' ? (
          <path className="flow-node-badge-glyph" d="M-3.2,0.2 L-1,2.4 L3.2,-2.2" />
        ) : spec.kind === 'human' ? (
          <path
            className="flow-node-badge-glyph"
            d="M0,-3.2 a2,2 0 1,1 0,0.1 M-3.4,3.6 a3.4,3 0 0,1 6.8,0"
          />
        ) : (
          <circle className="flow-node-badge-dot" r={2.4} />
        )}
      </g>

      {showStatus && (
        <text className="flow-node-status" x={x} y={top + h + 16} textAnchor="middle">
          {spec.status}
        </text>
      )}
    </g>
  )
}
