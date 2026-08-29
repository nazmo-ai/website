import { describe, expect, it } from 'vitest'
import { LAND_REF_HEIGHT, LAND_REF_WIDTH, LAT_MAX, LAT_MIN } from '../../data/landDots'
import {
  INFLUENCE_RADIUS,
  MAX_DISPLACEMENT,
  buildIndex,
  clusterByProximity,
  computeTransform,
  ease,
  falloff,
  fanOffset,
  fanRadius,
  magnify,
  projectRef,
  regionRenderPosition,
} from './dotField'
import { REGION_DOT_RADIUS } from './renderDotMap'

describe('projectRef', () => {
  it('maps the antimeridian to the horizontal edges', () => {
    expect(projectRef(0, -180).x).toBeCloseTo(0)
    expect(projectRef(0, 180).x).toBeCloseTo(LAND_REF_WIDTH)
  })

  it('maps the latitude clip to the vertical edges', () => {
    expect(projectRef(LAT_MAX, 0).y).toBeCloseTo(0)
    expect(projectRef(LAT_MIN, 0).y).toBeCloseTo(LAND_REF_HEIGHT)
  })

  it('puts the prime meridian at the horizontal centre', () => {
    expect(projectRef(0, 0).x).toBeCloseTo(LAND_REF_WIDTH / 2)
  })

  it('places northern latitudes above southern ones', () => {
    expect(projectRef(50, 0).y).toBeLessThan(projectRef(-50, 0).y)
  })
})

describe('computeTransform', () => {
  it('fits the map to the full canvas width', () => {
    const t = computeTransform(LAND_REF_WIDTH * 2, LAND_REF_HEIGHT)
    expect(t.scale).toBeCloseTo(2)
    expect(t.offsetX).toBe(0)
  })

  it('centres the map vertically in a taller canvas', () => {
    const t = computeTransform(LAND_REF_WIDTH, LAND_REF_HEIGHT * 3)
    expect(t.scale).toBeCloseTo(1)
    expect(t.offsetY).toBeCloseTo(LAND_REF_HEIGHT)
  })

  it('never crops horizontally, whatever the aspect ratio', () => {
    for (const [w, h] of [[1440, 900], [390, 800], [2560, 1080]]) {
      const t = computeTransform(w, h)
      expect(t.offsetX).toBe(0)
      expect(LAND_REF_WIDTH * t.scale).toBeCloseTo(w)
    }
  })
})

describe('falloff', () => {
  it('is 1 at the cursor and 0 at the radius', () => {
    expect(falloff(0, 100)).toBe(1)
    expect(falloff(100, 100)).toBe(0)
  })

  it('is 0 beyond the radius', () => {
    expect(falloff(101, 100)).toBe(0)
    expect(falloff(5000, 100)).toBe(0)
  })

  it('reaches exactly half way at half the radius', () => {
    expect(falloff(50, 100)).toBeCloseTo(0.5)
  })

  it('decreases monotonically', () => {
    let previous = Infinity
    for (let d = 0; d <= 100; d += 5) {
      const value = falloff(d, 100)
      expect(value).toBeLessThanOrEqual(previous)
      previous = value
    }
  })

  it('treats a zero radius as no influence', () => {
    expect(falloff(0, 0)).toBe(0)
  })
})

describe('magnify', () => {
  const cursor = { x: 100, y: 100 }

  it('leaves distant dots untouched', () => {
    const result = magnify({ x: 900, y: 900 }, cursor, 2.2)
    expect(result).toEqual({ x: 900, y: 900, scale: 1, intensity: 0 })
  })

  it('scales a dot under the cursor by the full strength', () => {
    const result = magnify({ x: 100, y: 100 }, cursor, 2.2)
    expect(result.scale).toBeCloseTo(3.2)
    expect(result.intensity).toBe(1)
  })

  it('pushes a nearby dot directly away from the cursor', () => {
    const result = magnify({ x: 140, y: 100 }, cursor, 2.2)
    expect(result.x).toBeGreaterThan(140)
    expect(result.y).toBeCloseTo(100)
  })

  it('never displaces further than the configured maximum', () => {
    for (let d = 1; d < INFLUENCE_RADIUS; d += 3) {
      const result = magnify({ x: 100 + d, y: 100 }, cursor, 2.2)
      expect(result.x - (100 + d)).toBeLessThanOrEqual(MAX_DISPLACEMENT + 1e-9)
    }
  })

  it('does not divide by zero when the dot sits exactly on the cursor', () => {
    const result = magnify({ x: 100, y: 100 }, cursor, 2.2)
    expect(Number.isFinite(result.x)).toBe(true)
    expect(Number.isFinite(result.y)).toBe(true)
  })
})

describe('ease', () => {
  it('moves a fraction of the way toward the target', () => {
    expect(ease(0, 100, 0.15)).toBeCloseTo(15)
  })

  it('converges without overshooting', () => {
    let value = 0
    for (let i = 0; i < 200; i++) value = ease(value, 100, 0.15)
    expect(value).toBeGreaterThan(99.9)
    expect(value).toBeLessThanOrEqual(100)
  })
})

describe('buildIndex', () => {
  const items = [
    { x: 10, y: 10, id: 'a' },
    { x: 12, y: 11, id: 'b' },
    { x: 400, y: 400, id: 'c' },
  ]

  it('finds the closest item within range', () => {
    const index = buildIndex(items)
    expect(index.nearest(10, 10, 8)?.id).toBe('a')
    expect(index.nearest(12, 11, 8)?.id).toBe('b')
  })

  it('returns null when nothing is close enough', () => {
    const index = buildIndex(items)
    expect(index.nearest(200, 200, 8)).toBeNull()
  })

  it('finds items that sit across a cell boundary', () => {
    // cellSize 40, so these two straddle the boundary at x = 40.
    const index = buildIndex([{ x: 39, y: 20, id: 'left' }, { x: 41, y: 20, id: 'right' }], 40)
    expect(index.nearest(41, 20, 4)?.id).toBe('right')
    expect(index.nearest(39, 20, 4)?.id).toBe('left')
  })

  it('handles negative coordinates', () => {
    const index = buildIndex([{ x: -30, y: -30, id: 'neg' }])
    expect(index.nearest(-30, -30, 5)?.id).toBe('neg')
  })

  it('returns every item in a queried radius', () => {
    const index = buildIndex(items)
    const found = index.query(11, 10, 20).map((i) => i.id).sort()
    expect(found).toEqual(['a', 'b'])
  })
})

describe('clusterByProximity', () => {
  it('leaves isolated points alone, in their own clusters', () => {
    const result = clusterByProximity([{ x: 0, y: 0 }, { x: 500, y: 500 }], 7)
    expect(result.every((r) => r.clusterSize === 1 && r.clusterIndex === 0)).toBe(true)
    expect(result[0].clusterId).not.toBe(result[1].clusterId)
  })

  it('gives every member of a group the same cluster id', () => {
    const result = clusterByProximity([{ x: 10, y: 10 }, { x: 10, y: 10 }, { x: 400, y: 9 }], 7)
    expect(result[0].clusterId).toBe(result[1].clusterId)
    expect(result[2].clusterId).not.toBe(result[0].clusterId)
  })

  it('groups points sharing a spot and indexes them distinctly', () => {
    const result = clusterByProximity(
      [{ x: 10, y: 10 }, { x: 10, y: 10 }, { x: 12, y: 11 }],
      7,
    )
    expect(result.every((r) => r.clusterSize === 3)).toBe(true)
    expect(result.map((r) => r.clusterIndex).sort()).toEqual([0, 1, 2])
  })

  it('keeps points just beyond the threshold separate', () => {
    const result = clusterByProximity([{ x: 0, y: 0 }, { x: 8, y: 0 }], 7)
    expect(result.every((r) => r.clusterSize === 1)).toBe(true)
  })

  it('assigns every input exactly one slot', () => {
    const points = Array.from({ length: 40 }, (_, i) => ({ x: (i % 4) * 2, y: 0 }))
    const result = clusterByProximity(points, 7)
    expect(result).toHaveLength(points.length)
    for (const r of result) expect(r.clusterIndex).toBeLessThan(r.clusterSize)
  })
})

describe('fanOffset', () => {
  it('does not move a region that stands alone', () => {
    expect(fanOffset(0, 1, 0)).toEqual({ x: 0, y: 0 })
    expect(fanOffset(0, 1, 1)).toEqual({ x: 0, y: 0 })
  })

  it('separates every member of a cluster at rest', () => {
    // The bug this fixes: six providers at one metro rendered as one dot.
    const size = 6
    const points = Array.from({ length: size }, (_, i) => fanOffset(i, size, 0))
    for (let a = 0; a < size; a++) {
      for (let b = a + 1; b < size; b++) {
        const gap = Math.hypot(points[a].x - points[b].x, points[a].y - points[b].y)
        expect(gap).toBeGreaterThan(REGION_DOT_RADIUS * 2)
      }
    }
  })

  it('blooms wider as cursor influence rises', () => {
    const rest = Math.hypot(...Object.values(fanOffset(0, 6, 0)))
    const hot = Math.hypot(...Object.values(fanOffset(0, 6, 1)))
    expect(hot).toBeGreaterThan(rest * 2.5)
  })

  it('gives bigger clusters a wider rest circle', () => {
    expect(fanRadius(6, 0)).toBeGreaterThan(fanRadius(2, 0))
  })
})

describe('regionRenderPosition', () => {
  const anchor = { x: 200, y: 200 }

  it('leaves a solitary region at its anchor when the cursor is away', () => {
    const p = regionRenderPosition({ ...anchor, clusterIndex: 0, clusterSize: 1 }, null, 0)
    expect(p).toEqual({ x: 200, y: 200, intensity: 0 })
  })

  it('blooms every member of a cluster by the same intensity', () => {
    const cursor = { x: 200, y: 200 }
    const a = regionRenderPosition({ ...anchor, clusterIndex: 0, clusterSize: 4 }, cursor, 1)
    const b = regionRenderPosition({ ...anchor, clusterIndex: 2, clusterSize: 4 }, cursor, 1)
    expect(a.intensity).toBeCloseTo(b.intensity)
    // Opposite sides of the rosette, so they must be far apart.
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(20)
  })

  it('never leaves two members of a cluster on top of each other', () => {
    const cursor = { x: 260, y: 200 }
    for (const presence of [0, 0.4, 1]) {
      const seen = Array.from({ length: 5 }, (_, i) =>
        regionRenderPosition({ ...anchor, clusterIndex: i, clusterSize: 5 }, cursor, presence),
      )
      for (let a = 0; a < seen.length; a++) {
        for (let b = a + 1; b < seen.length; b++) {
          expect(Math.hypot(seen[a].x - seen[b].x, seen[a].y - seen[b].y)).toBeGreaterThan(1)
        }
      }
    }
  })
})
