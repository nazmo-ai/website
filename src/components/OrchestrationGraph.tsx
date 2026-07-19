import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

const WIDTH = 640
const HEIGHT = 360

const SPINE_PATH = `M 20 200 C 140 60, 260 320, 340 160 S 520 40, 620 140`

const NODES = [
  { label: 'Trigger', t: 0.02 },
  { label: 'API', t: 0.22 },
  { label: 'AI Model', t: 0.44 },
  { label: 'Queue', t: 0.62 },
  { label: 'Compute', t: 0.8 },
  { label: 'Storage', t: 0.98 },
]

const PARTICLE_COUNT = 4
const LOOP_DURATION_MS = 5200

export default function OrchestrationGraph() {
  const svgRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const spine = svg
      .append('path')
      .attr('d', SPINE_PATH)
      .attr('class', 'og-spine')

    const pathNode = spine.node() as SVGPathElement
    const totalLength = pathNode.getTotalLength()

    const nodeGroup = svg.append('g')
    const nodePositions = NODES.map((n) => {
      const point = pathNode.getPointAtLength(n.t * totalLength)
      return { ...n, x: point.x, y: point.y }
    })

    const nodes = nodeGroup
      .selectAll('g.og-node')
      .data(nodePositions)
      .enter()
      .append('g')
      .attr('class', 'og-node')
      .attr('transform', (d) => `translate(${d.x}, ${d.y})`)

    nodes
      .append('circle')
      .attr('class', 'og-node-circle')
      .attr('r', 0)
      .transition()
      .delay((_, i) => i * 120)
      .duration(500)
      .ease(d3.easeBackOut)
      .attr('r', 22)

    nodes
      .append('text')
      .attr('class', 'og-node-label')
      .attr('y', 40)
      .attr('opacity', 0)
      .text((d) => d.label)
      .transition()
      .delay((_, i) => i * 120 + 200)
      .duration(400)
      .attr('opacity', 1)

    const particleGroup = svg.append('g')
    const particles = particleGroup
      .selectAll('circle.og-particle')
      .data(d3.range(PARTICLE_COUNT))
      .enter()
      .append('circle')
      .attr('class', 'og-particle')
      .attr('r', 4)
      .attr('fill', (d) => (d % 2 === 0 ? '#7c5cff' : '#22d3ee'))

    const timer = d3.timer((elapsed) => {
      particles.attr('transform', (i) => {
        const offset = (i / PARTICLE_COUNT) * LOOP_DURATION_MS
        const progress = ((elapsed + offset) % LOOP_DURATION_MS) / LOOP_DURATION_MS
        const point = pathNode.getPointAtLength(progress * totalLength)
        return `translate(${point.x}, ${point.y})`
      })
    })

    return () => {
      timer.stop()
    }
  }, [])

  return (
    <svg
      ref={svgRef}
      className="orchestration-graph"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="Animated diagram of an AI-orchestrated cloud service chain"
    >
      <defs>
        <linearGradient id="nz-node-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c5cff" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
    </svg>
  )
}
