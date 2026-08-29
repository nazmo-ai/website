import type { FlowNodeSpec, NodeBox } from '../../data/orchestrationFlow'

interface Props {
  spec: FlowNodeSpec
  box: NodeBox
  viewBox: { width: number; height: number }
}

/**
 * Detail panel for the hovered node.
 *
 * Positioned as a percentage of the container so it tracks the SVG's own
 * scaling, and flipped to the other side of the node when it would otherwise
 * run off the edge.
 */
export default function NodeDetailCard({ spec, box, viewBox }: Props) {
  const anchorLeft = (box.x / viewBox.width) * 100
  const anchorTop = ((box.y + box.h / 2) / viewBox.height) * 100

  // Keep the card inside the frame near the left and right edges.
  const clampedLeft = Math.min(Math.max(anchorLeft, 20), 80)
  const above = anchorTop > 62

  return (
    <div
      className={`flow-detail-card${above ? ' is-above' : ''}`}
      style={{
        left: `${clampedLeft}%`,
        top: above ? 'auto' : `calc(${anchorTop}% + 1.75rem)`,
        bottom: above ? `calc(${100 - (box.y - box.h / 2) / viewBox.height * 100}% + 1.75rem)` : 'auto',
      }}
      role="tooltip"
    >
      <div className="flow-detail-kind">
        {spec.kind === 'human' ? 'Human decision' : spec.kind === 'entry' ? 'Input' : 'Agent'}
      </div>
      <h4 className="flow-detail-title">{spec.label}</h4>
      <p className="flow-detail-what">{spec.detail.what}</p>
      <dl className="flow-detail-io">
        <div>
          <dt>In</dt>
          <dd>{spec.detail.input}</dd>
        </div>
        <div>
          <dt>Out</dt>
          <dd>{spec.detail.output}</dd>
        </div>
      </dl>
    </div>
  )
}
