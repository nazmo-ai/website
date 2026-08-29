import { useEffect, useRef, useState } from 'react'
import { PROVIDERS, REGION_COUNTS, TOTAL_REGIONS } from '../data/cloudRegions'

/** Counts from 0 to `target` once `active`, easing out. */
function useCountUp(target: number, active: boolean): number {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target)
      return
    }

    let frame = 0
    const start = performance.now()
    const duration = 1100

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))))
      if (t < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, active])

  return value
}

function ProviderCount({ id, name, active }: { id: string; name: string; active: boolean }) {
  const count = useCountUp(REGION_COUNTS[id as keyof typeof REGION_COUNTS], active)

  return (
    <div className="coverage-item">
      <span className="coverage-swatch" style={{ background: `var(--nz-provider-${id})` }} />
      <span className="coverage-count">{count}</span>
      <span className="coverage-name">{name}</span>
    </div>
  )
}

/**
 * Decodes the hero map's colours and states the coverage behind it. Counts come
 * from the same dataset the map plots, so the two cannot disagree.
 */
export default function CoverageStrip() {
  const ref = useRef<HTMLElement | null>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true)
          observer.disconnect()
        }
      },
      { threshold: 0.4 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="coverage-strip" ref={ref} aria-label="Cloud region coverage">
      <div className="container">
        <div className="coverage-inner">
          <div className="coverage-total">
            <span className="coverage-total-number">{TOTAL_REGIONS}</span>
            <span className="coverage-total-label">
              regions
              <br />
              orchestrated
            </span>
          </div>
          <div className="coverage-list">
            {PROVIDERS.map((provider) => (
              <ProviderCount
                key={provider.id}
                id={provider.id}
                name={provider.name}
                active={active}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
