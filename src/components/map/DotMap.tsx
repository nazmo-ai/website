import { useCallback, useEffect, useRef, useState } from 'react'
import { CLOUD_REGIONS, PROVIDERS, TOTAL_REGIONS, type ProviderId } from '../../data/cloudRegions'
import { decodeLandDots } from '../../data/landDots'
import { useTheme } from '../../theme/useTheme'
import {
  CURSOR_EASING,
  FALLBACK_RADIUS,
  FOCUS_RADIUS,
  HIT_RADIUS,
  INFLUENCE_RADIUS,
  buildIndex,
  clusterByProximity,
  computeTransform,
  ease,
  projectRef,
  regionRenderPosition,
  type SpatialIndex,
} from './dotField'
import {
  drawBaseLayer,
  drawFrame,
  type LandPoints,
  type MapColors,
  type RegionDot,
} from './renderDotMap'
import RegionTooltip from './RegionTooltip'

const LAND_PACKED = decodeLandDots()
/** One full traversal of the ambient sweep, in milliseconds. */
const SWEEP_PERIOD = 12_000

function readColors(): MapColors {
  const styles = getComputedStyle(document.documentElement)
  const read = (name: string) => styles.getPropertyValue(name).trim()

  return {
    land: read('--nz-map-land') || 'rgba(148,163,184,0.3)',
    landHot: read('--nz-map-land-hot') || 'rgba(226,232,240,0.95)',
    providers: Object.fromEntries(
      PROVIDERS.map((p) => [p.id, read(`--nz-provider-${p.id}`) || p.color]),
    ) as Record<ProviderId, string>,
  }
}

interface Scene {
  land: LandPoints
  regions: RegionDot[]
  /** Shared anchor per cluster, for resolving and holding focus. */
  clusterAnchors: Map<number, { x: number; y: number }>
  /** Every region sharing a cluster, so the tooltip can list them all. */
  clusterMembers: Map<number, RegionDot[]>
  index: SpatialIndex<RegionDot>
  base: HTMLCanvasElement
  colors: MapColors
  width: number
  height: number
  dpr: number
}

/**
 * Which cluster is open: simply the metro nearest the cursor.
 *
 * An earlier version added hysteresis so a bloomed rosette would not collapse
 * while the user reached for one of its petals. That backfired — approaching
 * Singapore from the west locks focus onto Kuala Lumpur 11px away and holds it.
 * Since the tooltip now lists a whole cluster at once, nobody needs to thread
 * individual petals, so nearest-metro is both simpler and more predictable.
 */
function resolveFocus(scene: Scene, cursor: { x: number; y: number } | null): number | null {
  if (!cursor) return null
  const nearest = scene.index.nearest(cursor.x, cursor.y, FOCUS_RADIUS)
  return nearest ? nearest.clusterId : null
}

/**
 * Finds the region under the pointer against where dots are *drawn*, not where
 * their anchors sit. A bloomed rosette throws its members ~20px off the shared
 * anchor, so anchor-based hit testing would return a neighbouring city.
 *
 * The fallback matters as much as the primary pass: once a cluster blooms, its
 * centre is vacant, so pointing straight at the dot you originally aimed for
 * would otherwise select nothing.
 */
function hitTest(
  x: number,
  y: number,
  scene: Scene,
  cursor: { x: number; y: number },
  presence: number,
  focusedCluster: number | null,
): { dot: RegionDot; exact: RegionDot | null } | null {
  const radius = INFLUENCE_RADIUS * presence
  const active = presence > 0.01 ? cursor : null
  const candidates = scene.index.query(x, y, HIT_RADIUS + FOCUS_RADIUS)


  let best: RegionDot | null = null
  let bestDistance = HIT_RADIUS
  let fallback: RegionDot | null = null
  let fallbackDistance = FALLBACK_RADIUS

  for (const dot of candidates) {
    const drawn = regionRenderPosition(
      dot,
      active,
      presence,
      radius,
      dot.clusterId === focusedCluster,
    )
    const distance = Math.hypot(drawn.x - x, drawn.y - y)
    if (distance <= bestDistance) {
      best = dot
      bestDistance = distance
    }

    // Anchor distance, for the vacant-centre case.
    const anchorDistance = Math.hypot(dot.x - x, dot.y - y)
    if (anchorDistance <= fallbackDistance) {
      fallback = dot
      fallbackDistance = anchorDistance
    }
  }

  if (best) return { dot: best, exact: best }
  if (fallback) return { dot: fallback, exact: null }
  return null
}

export default function DotMap() {
  const { theme } = useTheme()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sceneRef = useRef<Scene | null>(null)

  /** Animation state lives in refs: it changes per frame and must not re-render. */
  const pointerRef = useRef<{ x: number; y: number } | null>(null)
  const cursorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const presenceRef = useRef(0)
  const focusRef = useRef<number | null>(null)

  const [hovered, setHovered] = useState<{ members: RegionDot[]; active: RegionDot | null } | null>(
    null,
  )
  const [unsupported, setUnsupported] = useState(false)

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const coarsePointer =
    typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

  /** Rebuilds projected geometry and the base layer. Resize and theme changes only. */
  const buildScene = useCallback(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const width = container.clientWidth
    const height = container.clientHeight
    if (width === 0 || height === 0) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const transform = computeTransform(width, height)
    const colors = readColors()

    const land = new Float32Array(LAND_PACKED.length) as LandPoints
    for (let i = 0; i < LAND_PACKED.length; i += 2) {
      land[i] = LAND_PACKED[i] * transform.scale + transform.offsetX
      land[i + 1] = LAND_PACKED[i + 1] * transform.scale + transform.offsetY
    }

    const anchors = CLOUD_REGIONS.map((region) => {
      const ref = projectRef(region.lat, region.lng)
      return {
        x: ref.x * transform.scale + transform.offsetX,
        y: ref.y * transform.scale + transform.offsetY,
      }
    })

    // Roughly half the regions share a metro with another provider, so they must
    // be fanned apart or all but one is invisible.
    const clusters = clusterByProximity(anchors)

    const regions: RegionDot[] = CLOUD_REGIONS.map((region, i) => ({
      x: anchors[i].x,
      y: anchors[i].y,
      provider: region.provider,
      code: region.code,
      city: region.city,
      phase: (i * 2.399963) % (Math.PI * 2),
      clusterId: clusters[i].clusterId,
      clusterIndex: clusters[i].clusterIndex,
      clusterSize: clusters[i].clusterSize,
    }))

    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const base = document.createElement('canvas')
    base.width = canvas.width
    base.height = canvas.height
    const baseCtx = base.getContext('2d')
    if (!baseCtx) {
      setUnsupported(true)
      return
    }

    drawBaseLayer(baseCtx, land, colors, width, height, dpr)
    const clusterAnchors = new Map<number, { x: number; y: number }>()
    const clusterMembers = new Map<number, RegionDot[]>()
    for (const dot of regions) {
      if (!clusterAnchors.has(dot.clusterId)) clusterAnchors.set(dot.clusterId, { x: dot.x, y: dot.y })
      const members = clusterMembers.get(dot.clusterId)
      if (members) members.push(dot)
      else clusterMembers.set(dot.clusterId, [dot])
    }

    sceneRef.current = {
      land,
      regions,
      clusterAnchors,
      clusterMembers,
      index: buildIndex(regions),
      base,
      colors,
      width,
      height,
      dpr,
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    if (!canvas.getContext('2d')) {
      setUnsupported(true)
      return
    }

    buildScene()

    const observer = new ResizeObserver(() => buildScene())
    observer.observe(container)
    return () => observer.disconnect()
  }, [buildScene, theme])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || unsupported) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frame = 0
    const start = performance.now()

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      const scene = sceneRef.current
      if (!scene) return

      const elapsed = now - start
      const pointer = pointerRef.current

      if (pointer) {
        // Reduced motion keeps magnification (it is user-driven) but drops the trail.
        const amount = reducedMotion ? 1 : CURSOR_EASING
        cursorRef.current = {
          x: ease(cursorRef.current.x, pointer.x, amount),
          y: ease(cursorRef.current.y, pointer.y, amount),
        }
        presenceRef.current = ease(presenceRef.current, 1, reducedMotion ? 1 : 0.12)
      } else {
        presenceRef.current = ease(presenceRef.current, 0, reducedMotion ? 1 : 0.08)
      }

      focusRef.current = resolveFocus(
        scene,
        presenceRef.current > 0.01 ? cursorRef.current : null,
      )

      const sweepX =
        coarsePointer && !reducedMotion
          ? ((elapsed % SWEEP_PERIOD) / SWEEP_PERIOD) * (scene.width + 240) - 120
          : null

      drawFrame(
        ctx,
        scene.base,
        scene.land,
        scene.regions,
        scene.colors,
        {
          cursor: presenceRef.current > 0.01 ? cursorRef.current : null,
          presence: presenceRef.current,
          elapsed,
          reducedMotion,
          sweepX,
          focusedCluster: focusRef.current,
        },
        scene.width,
        scene.height,
        scene.dpr,
      )
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [unsupported, reducedMotion, coarsePointer])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current
    const scene = sceneRef.current
    if (!container || !scene) return

    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // First move after entering: start the trail at the pointer, not at (0,0).
    if (!pointerRef.current) cursorRef.current = { x, y }
    pointerRef.current = { x, y }

    // Focus is resolved once per frame in the render loop; reuse it so the hit
    // test and the pixels agree.
    const hit = hitTest(x, y, scene, cursorRef.current, presenceRef.current, focusRef.current)
    setHovered(
      hit ? { members: scene.clusterMembers.get(hit.dot.clusterId) ?? [hit.dot], active: hit.exact } : null,
    )
  }, [])

  const handlePointerLeave = useCallback(() => {
    pointerRef.current = null
    focusRef.current = null
    setHovered(null)
  }, [])

  if (unsupported) {
    return <div ref={containerRef} className="dot-map dot-map-fallback" aria-hidden="true" />
  }

  return (
    <div
      ref={containerRef}
      className="dot-map"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <canvas
        ref={canvasRef}
        className="dot-map-canvas"
        role="img"
        aria-label={`World map showing ${TOTAL_REGIONS} public cloud regions across ${PROVIDERS.length} providers`}
      />
      {hovered && (
        <RegionTooltip
          members={hovered.members}
          active={hovered.active}
          containerWidth={sceneRef.current?.width ?? 0}
        />
      )}
    </div>
  )
}
