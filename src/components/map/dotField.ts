/**
 * Pure geometry for the hero dot map: projection, cursor magnification, and
 * hit-testing. No DOM or canvas access, so all of it is unit-testable.
 */
import { LAND_REF_WIDTH, LAND_REF_HEIGHT, LAT_MAX, LAT_MIN } from '../../data/landDots'

/** Radius of the cursor's influence, in CSS pixels. */
export const INFLUENCE_RADIUS = 130
/** Peak scale multiplier added on top of 1x, at the cursor's exact position. */
export const LAND_MAGNIFY = 1.75
export const REGION_MAGNIFY = 2.2
/** How far a dot slides away from the cursor at peak influence, in pixels. */
export const MAX_DISPLACEMENT = 4
/** Fraction of the remaining distance the cursor eases each frame. */
export const CURSOR_EASING = 0.15
/** A pointer within this many pixels of a region dot opens its tooltip. */
export const HIT_RADIUS = 8

/**
 * Regions whose projected positions fall within this many pixels are treated as
 * sharing a spot and fanned apart.
 */
export const CLUSTER_THRESHOLD = 7
/** How far the rosette opens at full cursor influence, as a multiple of rest. */
export const FAN_BLOOM = 1.9
/**
 * Only the cluster whose anchor is within this many pixels of the cursor blooms.
 * At hero scale Frankfurt, Zurich, Milan and Paris sit ~11px apart with 4-6
 * providers each; blooming them all at once turns western Europe into a smear.
 */
export const FOCUS_RADIUS = 34
/**
 * How near a metro the pointer must be for its tooltip to open when it is not
 * sitting on a specific dot. Also covers the vacant centre of a bloomed rosette.
 */
export const FALLBACK_RADIUS = 18

export interface Point {
  x: number
  y: number
}

/** How the reference-space map is placed on the canvas. */
export interface MapTransform {
  scale: number
  offsetX: number
  offsetY: number
}

/**
 * Fits the map to the canvas width and centres it vertically, so the whole
 * world is always visible.
 *
 * Cover-scaling was tried first and is wrong here: hero viewports are far
 * squarer than the 2.7:1 map, so it cropped away everything but a vertical
 * slice of Eurasia.
 */
export function computeTransform(width: number, height: number): MapTransform {
  const scale = width / LAND_REF_WIDTH
  return {
    scale,
    offsetX: 0,
    offsetY: (height - LAND_REF_HEIGHT * scale) / 2,
  }
}

/**
 * Equirectangular projection into reference space. Must stay in sync with the
 * identical maths in scripts/build-land-dots.mjs.
 */
export function projectRef(lat: number, lng: number): Point {
  return {
    x: ((lng + 180) / 360) * LAND_REF_WIDTH,
    y: ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * LAND_REF_HEIGHT,
  }
}

export function applyTransform(x: number, y: number, t: MapTransform): Point {
  return { x: x * t.scale + t.offsetX, y: y * t.scale + t.offsetY }
}

export function project(lat: number, lng: number, t: MapTransform): Point {
  const ref = projectRef(lat, lng)
  return applyTransform(ref.x, ref.y, t)
}

/**
 * Smoothstep falloff: 1 at the cursor, easing to 0 at the influence radius.
 * Returns 0 outside the radius so callers can skip work cheaply.
 */
export function falloff(distance: number, radius: number = INFLUENCE_RADIUS): number {
  if (distance >= radius || radius <= 0) return 0
  if (distance <= 0) return 1
  const f = 1 - distance / radius
  return f * f * (3 - 2 * f)
}

export interface Magnified {
  /** Displaced position. */
  x: number
  y: number
  /** Radius multiplier, >= 1. */
  scale: number
  /** Falloff value in [0, 1], for alpha and colour blending. */
  intensity: number
}

/**
 * Scales and nudges a dot away from the cursor. The outward displacement
 * matters as much as the scaling: dense clusters like us-east-1 and western
 * Europe overlap at rest, and this spreads them apart exactly when the user is
 * trying to read them.
 */
export function magnify(
  dot: Point,
  cursor: Point,
  strength: number,
  radius: number = INFLUENCE_RADIUS,
): Magnified {
  const dx = dot.x - cursor.x
  const dy = dot.y - cursor.y
  const distance = Math.hypot(dx, dy)
  const intensity = falloff(distance, radius)

  if (intensity === 0) {
    return { x: dot.x, y: dot.y, scale: 1, intensity: 0 }
  }

  // At distance 0 the direction is undefined; leave the dot in place.
  const push = distance > 0 ? (MAX_DISPLACEMENT * intensity) / distance : 0

  return {
    x: dot.x + dx * push,
    y: dot.y + dy * push,
    scale: 1 + strength * intensity,
    intensity,
  }
}

/** Moves `from` a fraction of the way toward `to`, for the trailing cursor. */
export function ease(from: number, to: number, amount: number = CURSOR_EASING): number {
  return from + (to - from) * amount
}

/**
 * Ambient sweep used where there is no pointer (touch) or where motion is
 * reduced. A soft vertical band crossing the map, so it still reads as alive.
 */
export function sweepIntensity(x: number, sweepX: number, bandWidth: number): number {
  return falloff(Math.abs(x - sweepX), bandWidth)
}

/**
 * Uniform-grid spatial index. Region dots cluster hard around a handful of
 * metros, so a grid beats a linear scan by a wide margin on hover.
 */
export interface SpatialIndex<T extends Point> {
  query: (x: number, y: number, radius: number) => T[]
  nearest: (x: number, y: number, maxDistance: number) => T | null
}

export function buildIndex<T extends Point>(items: T[], cellSize = 40): SpatialIndex<T> {
  const cells = new Map<string, T[]>()
  const key = (cx: number, cy: number) => `${cx},${cy}`

  for (const item of items) {
    const k = key(Math.floor(item.x / cellSize), Math.floor(item.y / cellSize))
    const bucket = cells.get(k)
    if (bucket) bucket.push(item)
    else cells.set(k, [item])
  }

  function query(x: number, y: number, radius: number): T[] {
    const minX = Math.floor((x - radius) / cellSize)
    const maxX = Math.floor((x + radius) / cellSize)
    const minY = Math.floor((y - radius) / cellSize)
    const maxY = Math.floor((y + radius) / cellSize)

    const found: T[] = []
    for (let cy = minY; cy <= maxY; cy++) {
      for (let cx = minX; cx <= maxX; cx++) {
        const bucket = cells.get(key(cx, cy))
        if (bucket) found.push(...bucket)
      }
    }
    return found
  }

  function nearest(x: number, y: number, maxDistance: number): T | null {
    let best: T | null = null
    let bestDistance = maxDistance
    for (const item of query(x, y, maxDistance)) {
      const distance = Math.hypot(item.x - x, item.y - y)
      if (distance <= bestDistance) {
        best = item
        bestDistance = distance
      }
    }
    return best
  }

  return { query, nearest }
}


/**
 * Fans co-located regions onto a small rosette.
 *
 * Nearly half the dataset shares coordinates with something else — London,
 * Frankfurt and Tokyo each host six providers at the same metro — so without
 * this only the last dot drawn is ever visible. Magnification alone cannot fix
 * it: displacement is derived from the cursor-to-dot vector, so identical dots
 * receive identical displacement and stay stacked.
 *
 * The rosette is tight at rest and blooms open under the cursor, which is what
 * makes the magnification actually reveal something.
 */
export function fanRadius(clusterSize: number, intensity: number): number {
  if (clusterSize <= 1) return 0
  // Larger clusters need a wider rest circle or their dots still touch.
  const base = Math.max(4.6, clusterSize * 1.25)
  return base * (1 + FAN_BLOOM * intensity)
}

export function fanOffset(
  indexInCluster: number,
  clusterSize: number,
  intensity: number,
): Point {
  if (clusterSize <= 1) return { x: 0, y: 0 }
  const r = fanRadius(clusterSize, intensity)
  // Start at the top so a pair splits vertically rather than along the equator.
  const angle = (indexInCluster / clusterSize) * Math.PI * 2 - Math.PI / 2
  return { x: Math.cos(angle) * r, y: Math.sin(angle) * r }
}

export interface ClusterAssignment {
  /** Which co-located group this belongs to. */
  clusterId: number
  /** Position within that group; drives the fan-out angle. */
  clusterIndex: number
  /** How many regions share the spot. */
  clusterSize: number
}

/**
 * Greedy proximity clustering, in projected screen space rather than by
 * coordinate equality — some providers list the same metro a fraction of a
 * degree apart, which still collides at hero scale.
 *
 * Runs once per resize over ~200 items, so O(n²) is not worth avoiding.
 */
export function clusterByProximity<T extends Point>(
  items: T[],
  threshold: number = CLUSTER_THRESHOLD,
): ClusterAssignment[] {
  const result: ClusterAssignment[] = items.map(() => ({
    clusterId: 0,
    clusterIndex: 0,
    clusterSize: 1,
  }))
  let nextId = 0
  const taken = new Array<boolean>(items.length).fill(false)

  for (let i = 0; i < items.length; i++) {
    if (taken[i]) continue
    const group = [i]
    taken[i] = true

    for (let j = i + 1; j < items.length; j++) {
      if (taken[j]) continue
      if (Math.hypot(items[j].x - items[i].x, items[j].y - items[i].y) <= threshold) {
        taken[j] = true
        group.push(j)
      }
    }

    const clusterId = nextId++
    group.forEach((memberIndex, position) => {
      result[memberIndex] = { clusterId, clusterIndex: position, clusterSize: group.length }
    })
  }

  return result
}

export interface RenderedRegion extends Point {
  /** Falloff at the cluster anchor, in [0, 1]. */
  intensity: number
}

/**
 * Where a region dot actually ends up on screen.
 *
 * Shared by the renderer and the hit test so the two cannot drift — aiming at a
 * bloomed dot has to hit that dot.
 *
 * `focused` is what keeps neighbouring cities legible: only the cluster nearest
 * the cursor opens its rosette, the rest stay tight. Size and brightness still
 * respond across the whole influence radius, so the ripple is unaffected.
 *
 * Intensity is measured at the cluster anchor, not the fanned position, so a
 * rosette blooms evenly instead of lopsidedly.
 */
export function regionRenderPosition(
  dot: Point & { clusterIndex: number; clusterSize: number },
  cursor: Point | null,
  presence: number,
  radius: number = INFLUENCE_RADIUS,
  focused = true,
): RenderedRegion {
  let intensity = 0
  let pushX = 0
  let pushY = 0

  if (cursor && radius > 1) {
    const dx = dot.x - cursor.x
    const dy = dot.y - cursor.y
    const distance = Math.hypot(dx, dy)
    intensity = falloff(distance, radius) * presence

    if (intensity > 0 && distance > 0) {
      const push = (MAX_DISPLACEMENT * intensity) / distance
      pushX = dx * push
      pushY = dy * push
    }
  }

  const fan = fanOffset(dot.clusterIndex, dot.clusterSize, focused ? intensity : 0)
  return { x: dot.x + fan.x + pushX, y: dot.y + fan.y + pushY, intensity }
}
