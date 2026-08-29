/**
 * Canvas drawing for the hero dot map.
 *
 * Land dots are painted once into an offscreen base layer. Each frame blits
 * that base, erases the disc under the cursor, and repaints only the dots
 * inside it. Per-frame cost stays flat no matter how dense the map gets.
 *
 * Colours arrive already resolved from CSS custom properties, so nothing here
 * reads the DOM.
 */
import type { ProviderId } from '../../data/cloudRegions'
import {
  INFLUENCE_RADIUS,
  LAND_MAGNIFY,
  MAX_DISPLACEMENT,
  REGION_MAGNIFY,
  falloff,
  regionRenderPosition,
  type Point,
} from './dotField'

/** Rest radius in CSS pixels. */
export const LAND_DOT_RADIUS = 1.3
export const REGION_DOT_RADIUS = 2.4

export interface MapColors {
  land: string
  landHot: string
  providers: Record<ProviderId, string>
}

export interface RegionDot extends Point {
  provider: ProviderId
  code: string
  city: string
  /** Desynchronises the breathing pulse across dots. */
  phase: number
  /** Which co-located group this belongs to. */
  clusterId: number
  /** Position within its co-located group; drives the fan-out angle. */
  clusterIndex: number
  /** How many regions share this spot. 1 means it stands alone. */
  clusterSize: number
}

/** Land dot positions in canvas CSS pixels, packed as [x0, y0, x1, y1, ...]. */
export type LandPoints = Float32Array

function setupContext(ctx: CanvasRenderingContext2D, width: number, height: number, dpr: number) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, width, height)
}

/** Paints every land dot at rest. Called on resize and theme change only. */
export function drawBaseLayer(
  ctx: CanvasRenderingContext2D,
  land: LandPoints,
  colors: MapColors,
  width: number,
  height: number,
  dpr: number,
) {
  setupContext(ctx, width, height, dpr)
  ctx.fillStyle = colors.land

  for (let i = 0; i < land.length; i += 2) {
    const x = land[i]
    const y = land[i + 1]
    if (x < -2 || y < -2 || x > width + 2 || y > height + 2) continue
    ctx.beginPath()
    ctx.arc(x, y, LAND_DOT_RADIUS, 0, Math.PI * 2)
    ctx.fill()
  }
}

export interface FrameState {
  /** Eased cursor position, or null when the pointer is away. */
  cursor: Point | null
  /** Influence strength in [0, 1]; decays to 0 as the pointer leaves. */
  presence: number
  /** Milliseconds since mount, driving the region pulse. */
  elapsed: number
  /** Suppresses the pulse and any non-user-driven motion. */
  reducedMotion: boolean
  /** X position of the ambient sweep, or null when it is not running. */
  sweepX: number | null
  /** Only this cluster opens its rosette; see regionRenderPosition. */
  focusedCluster: number | null
}

/**
 * Draws one frame over the pre-rendered base layer.
 *
 * `base` is blitted rather than redrawn, then the influence disc is punched out
 * with destination-out so magnified dots do not leave a rest-size ghost behind
 * once they are displaced.
 */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  base: HTMLCanvasElement | OffscreenCanvas,
  land: LandPoints,
  regions: RegionDot[],
  colors: MapColors,
  state: FrameState,
  width: number,
  height: number,
  dpr: number,
) {
  setupContext(ctx, width, height, dpr)
  ctx.drawImage(base as CanvasImageSource, 0, 0, width, height)

  const { cursor, presence } = state
  const radius = INFLUENCE_RADIUS * presence

  if (cursor && radius > 1) {
    drawHotLand(ctx, land, colors, cursor, radius, presence, width, height)
  }

  drawRegions(ctx, regions, colors, state, radius, width, height)

  if (state.sweepX !== null) {
    drawSweep(ctx, land, colors, state.sweepX, width, height)
  }
}

function drawHotLand(
  ctx: CanvasRenderingContext2D,
  land: LandPoints,
  colors: MapColors,
  cursor: Point,
  radius: number,
  presence: number,
  width: number,
  height: number,
) {
  // Erase the base dots inside the influence disc.
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(cursor.x, cursor.y, radius + LAND_DOT_RADIUS + MAX_DISPLACEMENT + 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  const minX = cursor.x - radius
  const maxX = cursor.x + radius
  const minY = cursor.y - radius
  const maxY = cursor.y + radius

  for (let i = 0; i < land.length; i += 2) {
    const x = land[i]
    const y = land[i + 1]
    if (x < minX || x > maxX || y < minY || y > maxY) continue
    if (x < -2 || y < -2 || x > width + 2 || y > height + 2) continue

    const dx = x - cursor.x
    const dy = y - cursor.y
    const distance = Math.hypot(dx, dy)
    const intensity = falloff(distance, radius) * presence
    if (intensity <= 0) continue

    const push = distance > 0 ? (MAX_DISPLACEMENT * intensity) / distance : 0
    const px = x + dx * push
    const py = y + dy * push
    const r = LAND_DOT_RADIUS * (1 + LAND_MAGNIFY * intensity)

    // Two passes cross-fade rest colour into hot colour across the falloff.
    ctx.globalAlpha = 1
    ctx.fillStyle = colors.land
    ctx.beginPath()
    ctx.arc(px, py, r, 0, Math.PI * 2)
    ctx.fill()

    ctx.globalAlpha = intensity
    ctx.fillStyle = colors.landHot
    ctx.fill()
  }

  ctx.globalAlpha = 1
}

function drawRegions(
  ctx: CanvasRenderingContext2D,
  regions: RegionDot[],
  colors: MapColors,
  state: FrameState,
  radius: number,
  width: number,
  height: number,
) {
  const { cursor, presence, elapsed, reducedMotion } = state

  for (const dot of regions) {
    if (dot.x < -32 || dot.y < -32 || dot.x > width + 32 || dot.y > height + 32) continue

    // Shared with the hit test, so a bloomed dot is clickable where it appears.
    const { x, y, intensity } = regionRenderPosition(
      dot,
      cursor,
      presence,
      radius,
      dot.clusterId === state.focusedCluster,
    )

    const pulse = reducedMotion ? 1 : 1 + 0.12 * Math.sin(elapsed / 1400 + dot.phase)
    const r = REGION_DOT_RADIUS * pulse * (1 + REGION_MAGNIFY * intensity)
    const color = colors.providers[dot.provider]

    if (intensity > 0.05) {
      ctx.globalAlpha = intensity * 0.22
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y, r * 1.8, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.globalAlpha = 0.75 + 0.25 * intensity
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.globalAlpha = 1
}

/** Soft band crossing the map where there is no pointer to follow. */
function drawSweep(
  ctx: CanvasRenderingContext2D,
  land: LandPoints,
  colors: MapColors,
  sweepX: number,
  width: number,
  height: number,
) {
  const band = 90
  ctx.fillStyle = colors.landHot

  for (let i = 0; i < land.length; i += 2) {
    const x = land[i]
    const y = land[i + 1]
    if (x < sweepX - band || x > sweepX + band) continue
    if (x < -2 || y < -2 || x > width + 2 || y > height + 2) continue

    const intensity = falloff(Math.abs(x - sweepX), band)
    if (intensity <= 0.02) continue

    ctx.globalAlpha = intensity * 0.55
    ctx.beginPath()
    ctx.arc(x, y, LAND_DOT_RADIUS * (1 + 0.9 * intensity), 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.globalAlpha = 1
}
