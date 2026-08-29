import { useEffect, useRef, useState } from 'react'
import { advance, completedState, initialRunState, type RunState } from './flowRunner'

/** Caps the step a backgrounded tab can take when it returns. */
const MAX_FRAME_MS = 100

interface Options {
  /** Hover pauses the run in place. */
  paused: boolean
  /** False when the section is offscreen, so we stop burning frames. */
  active: boolean
  reducedMotion: boolean
  /**
   * Called every frame with the live state. Used to move the token by writing
   * to the DOM directly, which keeps React out of the 60fps path.
   */
  onFrame: (state: RunState) => void
}

/**
 * Drives the run loop.
 *
 * Returns only the discrete part of the state — node and edge statuses — and
 * re-renders when that changes, not on every frame. Continuous values (the
 * token's position along its edge) reach the DOM through `onFrame`.
 */
export function useFlowRunner({ paused, active, reducedMotion, onFrame }: Options): RunState {
  const stateRef = useRef<RunState>(initialRunState())
  const [discrete, setDiscrete] = useState<RunState>(() => stateRef.current)
  const onFrameRef = useRef(onFrame)
  onFrameRef.current = onFrame

  useEffect(() => {
    if (reducedMotion) {
      const finished = completedState()
      stateRef.current = finished
      setDiscrete(finished)
      onFrameRef.current(finished)
      return
    }

    if (!active || paused) {
      // Keep the last painted frame; the token simply stops where it is.
      onFrameRef.current(stateRef.current)
      return
    }

    let frame = 0
    let previous = performance.now()
    let signature = signatureOf(stateRef.current)

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      const dt = Math.min(now - previous, MAX_FRAME_MS)
      previous = now

      const next = advance(stateRef.current, dt)
      stateRef.current = next
      onFrameRef.current(next)

      const nextSignature = signatureOf(next)
      if (nextSignature !== signature) {
        signature = nextSignature
        setDiscrete(next)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [paused, active, reducedMotion])

  return discrete
}

/** Everything that affects rendering apart from the token's position. */
function signatureOf(state: RunState): string {
  const nodes = Object.entries(state.nodes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, status]) => `${id}:${status}`)
    .join(',')
  const edges = Object.entries(state.edges)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, status]) => `${id}:${status}`)
    .join(',')
  return `${state.loopIndex}|${state.activeEdge ?? '-'}|${nodes}|${edges}`
}
