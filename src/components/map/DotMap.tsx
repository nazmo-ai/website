import { useCallback, useEffect, useRef, useState } from 'react'
import { CLOUD_REGIONS, PROVIDERS, TOTAL_REGIONS, type ProviderId } from '../../data/cloudRegions'
import { decodeLandDots } from '../../data/landDots'
import { useTheme } from '../../theme/useTheme'
import {
  CURSOR_EASING,
  HIT_RADIUS,
  buildIndex,
  computeTransform,
  ease,
  projectRef,
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
  index: SpatialIndex<RegionDot>
  base: HTMLCanvasElement
  colors: MapColors
  width: number
  height: number
  dpr: number
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

  const [hovered, setHovered] = useState<RegionDot | null>(null)
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

    const regions: RegionDot[] = CLOUD_REGIONS.map((region, i) => {
      const ref = projectRef(region.lat, region.lng)
      return {
        x: ref.x * transform.scale + transform.offsetX,
        y: ref.y * transform.scale + transform.offsetY,
        provider: region.provider,
        code: region.code,
        city: region.city,
        phase: (i * 2.399963) % (Math.PI * 2),
      }
    })

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
    sceneRef.current = { land, regions, index: buildIndex(regions), base, colors, width, height, dpr }
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

    setHovered(scene.index.nearest(x, y, HIT_RADIUS))
  }, [])

  const handlePointerLeave = useCallback(() => {
    pointerRef.current = null
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
      {hovered && <RegionTooltip dot={hovered} />}
    </div>
  )
}
