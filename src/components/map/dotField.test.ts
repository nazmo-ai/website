import { describe, expect, it } from 'vitest'
import { LAND_REF_HEIGHT, LAND_REF_WIDTH, LAT_MAX, LAT_MIN } from '../../data/landDots'
import {
  INFLUENCE_RADIUS,
  MAX_DISPLACEMENT,
  buildIndex,
  computeTransform,
  ease,
  falloff,
  magnify,
  projectRef,
} from './dotField'

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
