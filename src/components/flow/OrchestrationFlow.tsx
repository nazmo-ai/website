import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DESKTOP_VIEWBOX,
  FLOW_EDGES,
  FLOW_NODES,
  FLOW_NODE_BY_ID,
  MOBILE_VIEWBOX,
} from '../../data/orchestrationFlow'
import FlowNode from './FlowNode'
import NodeDetailCard from './NodeDetailCard'
import type { RunState } from './flowRunner'
import { useFlowRunner } from './useFlowRunner'

/** Below this width the graph switches to its vertical layout. */
const DESKTOP_MIN_WIDTH = 992

/** Nodes reached by a failure edge, which recolours them. */
const FAIL_NODES = new Set(FLOW_EDGES.filter((e) => e.kind === 'fail').map((e) => e.to))

export default function OrchestrationFlow() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const tokenRef = useRef<SVGGElement | null>(null)
  const pathRefs = useRef(new Map<string, SVGPathElement>())
  const overlayRefs = useRef(new Map<string, SVGPathElement>())

  const [isDesktop, setIsDesktop] = useState(
    () => typeof window === 'undefined' || window.innerWidth >= DESKTOP_MIN_WIDTH,
  )
  const [inView, setInView] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)

  const reducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    const query = window.matchMedia(`(min-width: ${DESKTOP_MIN_WIDTH}px)`)
    const onChange = () => setIsDesktop(query.matches)
    onChange()
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  // Don't burn frames while the section is scrolled out of view.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.15 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const viewBox = isDesktop ? DESKTOP_VIEWBOX : MOBILE_VIEWBOX

  const onFrame = useCallback((state: RunState) => {
    const token = tokenRef.current
    if (!token) return

    const edgeId = state.activeEdge
    const path = edgeId ? pathRefs.current.get(edgeId) : null

    if (!edgeId || !path) {
      token.style.opacity = '0'
      return
    }

    const point = path.getPointAtLength(state.edgeProgress * path.getTotalLength())
    token.setAttribute('transform', `translate(${point.x}, ${point.y})`)
    token.style.opacity = '1'

    // pathLength="1" lets the overlay fill in normalised units, no measuring.
    const overlay = overlayRefs.current.get(edgeId)
    if (overlay) overlay.setAttribute('stroke-dashoffset', String(1 - state.edgeProgress))
  }, [])

  const run = useFlowRunner({
    paused: hovered !== null,
    active: inView,
    reducedMotion,
    onFrame,
  })

  const hoveredSpec = hovered ? FLOW_NODE_BY_ID[hovered] : null
  const hoveredBox = hoveredSpec ? (isDesktop ? hoveredSpec.desktop : hoveredSpec.mobile) : null

  const aspect = useMemo(() => `${viewBox.width} / ${viewBox.height}`, [viewBox])

  return (
    <div className="flow-frame" ref={containerRef} style={{ aspectRatio: aspect }}>
      <svg
        className="flow-svg"
        viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
        role="list"
        aria-label="How an orchestration run flows from intent to a monitored, self-healing deployment"
      >
        <g className="flow-edges">
          {FLOW_EDGES.map((edge) => {
            const d = isDesktop ? edge.desktop : edge.mobile
            const status = run.edges[edge.id] ?? 'idle'
            // Active edges get their offset driven per-frame in onFrame.
            const offset = status === 'done' ? 0 : 1

            return (
              <g key={edge.id} className={`flow-edge flow-edge-${edge.kind}`}>
                <path
                  className="flow-edge-base"
                  d={d}
                  ref={(el) => {
                    if (el) pathRefs.current.set(edge.id, el)
                    else pathRefs.current.delete(edge.id)
                  }}
                />
                <path
                  className={`flow-edge-fill flow-edge-${status}`}
                  d={d}
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={offset}
                  ref={(el) => {
                    if (el) overlayRefs.current.set(edge.id, el)
                    else overlayRefs.current.delete(edge.id)
                  }}
                />
              </g>
            )
          })}
        </g>

        <g className="flow-nodes">
          {FLOW_NODES.map((spec) => (
            <FlowNode
              key={spec.id}
              spec={spec}
              box={isDesktop ? spec.desktop : spec.mobile}
              status={run.nodes[spec.id] ?? 'idle'}
              onFailPath={FAIL_NODES.has(spec.id)}
              hovered={hovered === spec.id}
              onHover={setHovered}
            />
          ))}
        </g>

        <g className="flow-token" ref={tokenRef} style={{ opacity: 0 }}>
          <circle className="flow-token-halo" r={11} />
          <circle className="flow-token-core" r={4.5} />
        </g>
      </svg>

      {hoveredSpec && hoveredBox && (
        <NodeDetailCard spec={hoveredSpec} box={hoveredBox} viewBox={viewBox} />
      )}
    </div>
  )
}
