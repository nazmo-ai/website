import { describe, expect, it } from 'vitest'
import { buildRun, type RunStep } from '../../data/orchestrationFlow'
import { advance, completedState, initialRunState } from './flowRunner'

/** A short deterministic run, so timing assertions stay readable. */
const STEPS: RunStep[] = [
  { type: 'work', node: 'a', ms: 100 },
  { type: 'travel', edge: 'a-b', ms: 100 },
  { type: 'gate', node: 'b', ms: 100 },
]

const makeRun = () => STEPS
const HOLD = 50

function run(dt: number, times: number, state = initialRunState()) {
  let current = state
  for (let i = 0; i < times; i++) current = advance(current, dt, makeRun, HOLD)
  return current
}

describe('advance', () => {
  it('starts the first step on the first tick', () => {
    const state = advance(initialRunState(), 16, makeRun, HOLD)
    expect(state.nodes.a).toBe('active')
  })

  it('ignores non-positive time', () => {
    const state = initialRunState()
    expect(advance(state, 0, makeRun, HOLD)).toBe(state)
    expect(advance(state, -5, makeRun, HOLD)).toBe(state)
  })

  it('marks a step done and starts the next when its time elapses', () => {
    const state = run(50, 3)
    expect(state.nodes.a).toBe('done')
    expect(state.edges['a-b']).toBe('active')
    expect(state.activeEdge).toBe('a-b')
  })

  it('tracks travel progress along the active edge', () => {
    const state = run(50, 3)
    expect(state.edgeProgress).toBeCloseTo(0.5)
  })

  it('renders a gate as waiting, not active', () => {
    const state = run(50, 5)
    expect(state.nodes.b).toBe('waiting')
  })

  it('clears the token while a node is working', () => {
    const state = advance(initialRunState(), 16, makeRun, HOLD)
    expect(state.activeEdge).toBeNull()
  })

  it('enters the hold once every step finishes', () => {
    const state = run(50, 6)
    expect(state.holding).toBe(true)
    expect(state.nodes.b).toBe('done')
    expect(state.activeEdge).toBeNull()
  })

  it('resets and advances the loop after the hold', () => {
    const state = run(50, 8)
    expect(state.loopIndex).toBe(1)
    expect(state.holding).toBe(false)
    expect(state.nodes.b).toBeUndefined()
    expect(state.nodes.a).toBe('active')
  })

  it('consumes several steps when one frame is very long', () => {
    const state = advance(initialRunState(), 250, makeRun, HOLD)
    expect(state.nodes.a).toBe('done')
    expect(state.edges['a-b']).toBe('done')
    expect(state.nodes.b).toBe('waiting')
  })

  it('reaches the same place regardless of frame pacing', () => {
    const coarse = advance(initialRunState(), 200, makeRun, HOLD)
    const fine = run(20, 10)
    expect(fine.stepIndex).toBe(coarse.stepIndex)
    expect(fine.nodes).toEqual(coarse.nodes)
  })

  it('terminates rather than looping forever on an absurd frame', () => {
    const state = advance(initialRunState(), 1e9, makeRun, HOLD)
    expect(state).toBeTruthy()
  })
})

describe('buildRun', () => {
  it('runs straight through to monitoring on a healthy loop', () => {
    const steps = buildRun(0)
    const nodes = steps.filter((s) => s.type !== 'travel').map((s) => s.node)
    expect(nodes).toContain('approval')
    expect(nodes).toContain('monitor')
    expect(nodes).not.toContain('failure')
  })

  it('always stops at the approval gate before deploying', () => {
    for (let loop = 0; loop < 6; loop++) {
      const steps = buildRun(loop)
      const gateIndex = steps.findIndex((s) => s.type === 'gate' && s.node === 'approval')
      const deployIndex = steps.findIndex((s) => s.type === 'work' && s.node === 'deploy')
      expect(gateIndex).toBeGreaterThan(-1)
      expect(deployIndex).toBeGreaterThan(gateIndex)
    }
  })

  it('degrades on every other loop', () => {
    const nodesOf = (loop: number) =>
      buildRun(loop).filter((s) => s.type !== 'travel').map((s) => s.node)

    expect(nodesOf(0)).not.toContain('failure')
    expect(nodesOf(1)).toContain('failure')
    expect(nodesOf(2)).not.toContain('failure')
    expect(nodesOf(3)).toContain('failure')
  })

  it('self-heals on the first fault and escalates on the next', () => {
    const first = buildRun(1)
    const second = buildRun(3)

    expect(first.some((s) => s.type === 'travel' && s.edge === 'e-remediate-deploy')).toBe(true)
    expect(first.some((s) => s.type !== 'travel' && s.node === 'escalate')).toBe(false)

    expect(second.some((s) => s.type !== 'travel' && s.node === 'escalate')).toBe(true)
  })

  it('lights every node within the first four loops', () => {
    const seen = new Set<string>()
    for (let loop = 0; loop < 4; loop++) {
      for (const step of buildRun(loop)) {
        if (step.type !== 'travel') seen.add(step.node)
      }
    }
    // Escalation used to take ~90s to first appear, which read as a dead node.
    expect(seen.has('escalate')).toBe(true)
    expect(seen.size).toBe(10)
  })

  it('gives every step a positive duration', () => {
    for (let loop = 0; loop < 6; loop++) {
      for (const step of buildRun(loop)) expect(step.ms).toBeGreaterThan(0)
    }
  })
})

describe('completedState', () => {
  it('marks the whole happy path finished', () => {
    const state = completedState()
    expect(state.nodes.approval).toBe('done')
    expect(state.nodes.monitor).toBe('done')
    expect(state.activeEdge).toBeNull()
    expect(state.holding).toBe(true)
  })
})
