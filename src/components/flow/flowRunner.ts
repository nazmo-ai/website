/**
 * Pure state machine for the orchestration run.
 *
 * `advance` is a total function of (state, elapsed milliseconds), so the whole
 * choreography — the approval pause, the failure branch, the loop restart — is
 * testable without rendering anything.
 */
import { RUN_HOLD_MS, buildRun, type RunStep } from '../../data/orchestrationFlow'

export type NodeStatus = 'idle' | 'active' | 'waiting' | 'done'
export type EdgeStatus = 'idle' | 'active' | 'done'

export interface RunState {
  /** Which run we are on; selects the happy, self-healing, or escalating path. */
  loopIndex: number
  stepIndex: number
  stepElapsed: number
  nodes: Record<string, NodeStatus>
  edges: Record<string, EdgeStatus>
  /** Edge the travelling token is on, if any. */
  activeEdge: string | null
  /** Token position along `activeEdge`, in [0, 1]. */
  edgeProgress: number
  /** True while resting on the finished graph before the next run. */
  holding: boolean
}

/** Guards against a pathological dt consuming the step list forever. */
const MAX_STEPS_PER_TICK = 200

export function initialRunState(loopIndex = 0): RunState {
  return {
    loopIndex,
    stepIndex: 0,
    stepElapsed: 0,
    nodes: {},
    edges: {},
    activeEdge: null,
    edgeProgress: 0,
    holding: false,
  }
}

/** Applies the visual state a step implies while it is in progress. */
function applyStepStart(state: RunState, step: RunStep): RunState {
  if (step.type === 'travel') {
    return {
      ...state,
      edges: { ...state.edges, [step.edge]: 'active' },
      activeEdge: step.edge,
      edgeProgress: 0,
    }
  }
  return {
    ...state,
    nodes: { ...state.nodes, [step.node]: step.type === 'gate' ? 'waiting' : 'active' },
    activeEdge: null,
    edgeProgress: 0,
  }
}

/** Applies the visual state a step leaves behind once it finishes. */
function applyStepEnd(state: RunState, step: RunStep): RunState {
  if (step.type === 'travel') {
    return {
      ...state,
      edges: { ...state.edges, [step.edge]: 'done' },
      activeEdge: null,
      edgeProgress: 0,
    }
  }
  return { ...state, nodes: { ...state.nodes, [step.node]: 'done' } }
}

export function advance(
  state: RunState,
  dt: number,
  makeRun: (loopIndex: number) => RunStep[] = buildRun,
  holdMs: number = RUN_HOLD_MS,
): RunState {
  if (dt <= 0) return state

  let next = state
  let remaining = dt

  for (let guard = 0; guard < MAX_STEPS_PER_TICK; guard++) {
    if (next.holding) {
      const elapsed = next.stepElapsed + remaining
      if (elapsed < holdMs) {
        return { ...next, stepElapsed: elapsed }
      }
      // Hold finished — clear the board and start the next run.
      remaining = elapsed - holdMs
      next = initialRunState(next.loopIndex + 1)
      const first = makeRun(next.loopIndex)[0]
      if (first) next = applyStepStart(next, first)
      continue
    }

    const steps = makeRun(next.loopIndex)
    const step = steps[next.stepIndex]

    if (!step) {
      next = { ...next, holding: true, stepElapsed: 0, activeEdge: null, edgeProgress: 0 }
      continue
    }

    // A step that has not been started yet needs its start state applied once.
    if (next.stepElapsed === 0 && !isStepStarted(next, step)) {
      next = applyStepStart(next, step)
    }

    const elapsed = next.stepElapsed + remaining

    if (elapsed < step.ms) {
      return {
        ...next,
        stepElapsed: elapsed,
        edgeProgress: step.type === 'travel' ? elapsed / step.ms : next.edgeProgress,
      }
    }

    remaining = elapsed - step.ms
    next = applyStepEnd(next, step)
    next = { ...next, stepIndex: next.stepIndex + 1, stepElapsed: 0 }

    const following = steps[next.stepIndex]
    if (following) next = applyStepStart(next, following)
  }

  return next
}

function isStepStarted(state: RunState, step: RunStep): boolean {
  if (step.type === 'travel') return state.activeEdge === step.edge
  const status = state.nodes[step.node]
  return status === 'active' || status === 'waiting'
}

/** Renders the finished graph, for `prefers-reduced-motion`. */
export function completedState(): RunState {
  const state = initialRunState()
  const steps = buildRun(0)
  const nodes: Record<string, NodeStatus> = {}
  const edges: Record<string, EdgeStatus> = {}

  for (const step of steps) {
    if (step.type === 'travel') edges[step.edge] = 'done'
    else nodes[step.node] = 'done'
  }

  return { ...state, nodes, edges, holding: true }
}
