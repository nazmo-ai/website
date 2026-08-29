/**
 * The orchestration graph shown in "How it works".
 *
 * Geometry, copy, and run choreography all live here. Changing what the
 * animation says or how long it dwells is a data edit, not a code edit.
 *
 * Coordinates are hand-authored rather than force-laid-out, so the graph is
 * stable across renders and the orthogonal connectors never cross.
 */

export type NodeKind = 'entry' | 'agent' | 'human'

export interface NodeBox {
  x: number
  y: number
  w: number
  h: number
}

export interface FlowNodeSpec {
  id: string
  kind: NodeKind
  label: string
  /** Micro-status shown on the node while it is active. */
  status: string
  /** Detail card copy, shown on hover. */
  detail: {
    what: string
    input: string
    output: string
  }
  desktop: NodeBox
  mobile: NodeBox
}

export type EdgeKind = 'normal' | 'fail' | 'recover'

export interface FlowEdgeSpec {
  id: string
  from: string
  to: string
  kind: EdgeKind
  desktop: string
  mobile: string
}

export const DESKTOP_VIEWBOX = { width: 1200, height: 540 }
export const MOBILE_VIEWBOX = { width: 340, height: 1020 }

export const FLOW_NODES: FlowNodeSpec[] = [
  {
    id: 'intent',
    kind: 'entry',
    label: 'Intent',
    status: 'brief received',
    detail: {
      what: 'You describe the outcome in plain language — what should exist, where it may run, and what it must not exceed.',
      input: 'Natural language brief',
      output: 'Structured requirements',
    },
    desktop: { x: 90, y: 90, w: 120, h: 52 },
    mobile: { x: 190, y: 46, w: 220, h: 52 },
  },
  {
    id: 'chain',
    kind: 'agent',
    label: 'Service chain design',
    status: '12 services wired',
    detail: {
      what: 'Resolves the brief into a concrete chain of services and the connections between them, choosing managed offerings over glue code wherever one exists.',
      input: 'Structured requirements',
      output: 'Service graph',
    },
    desktop: { x: 272, y: 90, w: 140, h: 52 },
    mobile: { x: 190, y: 146, w: 220, h: 52 },
  },
  {
    id: 'placement',
    kind: 'agent',
    label: 'Cloud & region placement',
    status: '3 clouds · 5 regions',
    detail: {
      what: 'Assigns every service to a provider and a region, weighing data residency, latency to your users, and which provider actually offers the primitive.',
      input: 'Service graph',
      output: 'Placed topology',
    },
    desktop: { x: 454, y: 90, w: 140, h: 52 },
    mobile: { x: 190, y: 246, w: 220, h: 52 },
  },
  {
    id: 'cost',
    kind: 'agent',
    label: 'Cost estimation',
    status: '$1,840/mo est.',
    detail: {
      what: 'Prices the placed topology across every candidate provider and region, and reports the delta against what you are running today.',
      input: 'Placed topology',
      output: 'Costed plan + delta',
    },
    desktop: { x: 636, y: 90, w: 140, h: 52 },
    mobile: { x: 190, y: 346, w: 220, h: 52 },
  },
  {
    id: 'approval',
    kind: 'human',
    label: 'Design & cost approval',
    status: 'waiting for approval',
    detail: {
      what: 'The run stops here. Nothing is provisioned until a person reviews the proposed architecture, its monthly cost, and its blast radius.',
      input: 'Costed plan + delta',
      output: 'Approval or change request',
    },
    desktop: { x: 838, y: 90, w: 170, h: 56 },
    mobile: { x: 190, y: 450, w: 220, h: 56 },
  },
  {
    id: 'deploy',
    kind: 'agent',
    label: 'Deployment',
    status: 'applied in 4m 12s',
    detail: {
      what: 'Provisions the approved topology across each provider in dependency order, and rolls the whole set back together if any step fails.',
      input: 'Approved plan',
      output: 'Running chain',
    },
    desktop: { x: 1030, y: 90, w: 140, h: 52 },
    mobile: { x: 190, y: 554, w: 220, h: 52 },
  },
  {
    id: 'monitor',
    kind: 'agent',
    label: 'Monitoring & management',
    status: 'all chains healthy',
    detail: {
      what: 'Watches the live chain end to end — health, latency, spend — and keeps the running topology reconciled against the approved design.',
      input: 'Running chain',
      output: 'Health and spend signal',
    },
    desktop: { x: 300, y: 320, w: 140, h: 52 },
    mobile: { x: 190, y: 654, w: 220, h: 52 },
  },
  {
    id: 'failure',
    kind: 'agent',
    label: 'Failure detection',
    status: 'eu-central-1 degraded',
    detail: {
      what: 'Separates real faults from noise, then localises which service and which region is actually at fault before anything is changed.',
      input: 'Health and spend signal',
      output: 'Diagnosed fault',
    },
    desktop: { x: 560, y: 320, w: 140, h: 52 },
    mobile: { x: 190, y: 754, w: 220, h: 52 },
  },
  {
    id: 'remediate',
    kind: 'agent',
    label: 'Remediation',
    status: 'rerouted · redeployed',
    detail: {
      what: 'Applies the smallest fix that restores the approved design — failing over, rerouting, or redeploying — then hands back to deployment.',
      input: 'Diagnosed fault',
      output: 'Repaired chain',
    },
    desktop: { x: 820, y: 320, w: 140, h: 52 },
    mobile: { x: 190, y: 854, w: 220, h: 52 },
  },
  {
    id: 'escalate',
    kind: 'human',
    label: 'Escalation',
    status: 'paged on-call',
    detail: {
      what: 'When no safe automatic fix exists, the run stops and a person is paged with the diagnosis and the options — rather than the agent guessing.',
      input: 'Unresolvable fault',
      output: 'Human decision',
    },
    desktop: { x: 820, y: 470, w: 170, h: 56 },
    mobile: { x: 190, y: 958, w: 220, h: 56 },
  },
]

export const FLOW_NODE_BY_ID: Record<string, FlowNodeSpec> = Object.fromEntries(
  FLOW_NODES.map((n) => [n.id, n]),
)

export const FLOW_EDGES: FlowEdgeSpec[] = [
  { id: 'e-intent-chain', from: 'intent', to: 'chain', kind: 'normal',
    desktop: 'M150,90 H202', mobile: 'M190,72 V120' },
  { id: 'e-chain-placement', from: 'chain', to: 'placement', kind: 'normal',
    desktop: 'M342,90 H384', mobile: 'M190,172 V220' },
  { id: 'e-placement-cost', from: 'placement', to: 'cost', kind: 'normal',
    desktop: 'M524,90 H566', mobile: 'M190,272 V320' },
  { id: 'e-cost-approval', from: 'cost', to: 'approval', kind: 'normal',
    desktop: 'M706,90 H753', mobile: 'M190,372 V422' },
  { id: 'e-approval-deploy', from: 'approval', to: 'deploy', kind: 'normal',
    desktop: 'M923,90 H960', mobile: 'M190,478 V528' },
  // Drops out of deployment and runs back along y=200 to the runtime row.
  { id: 'e-deploy-monitor', from: 'deploy', to: 'monitor', kind: 'normal',
    desktop: 'M980,116 V200 H300 V294', mobile: 'M190,580 V628' },
  { id: 'e-monitor-failure', from: 'monitor', to: 'failure', kind: 'fail',
    desktop: 'M370,320 H490', mobile: 'M190,680 V728' },
  { id: 'e-failure-remediate', from: 'failure', to: 'remediate', kind: 'fail',
    desktop: 'M630,320 H750', mobile: 'M190,780 V828' },
  // Returns up the far right, clearing the y=200 corridor above.
  { id: 'e-remediate-deploy', from: 'remediate', to: 'deploy', kind: 'recover',
    desktop: 'M890,320 H1060 V116', mobile: 'M80,854 H40 V554 H80' },
  { id: 'e-remediate-escalate', from: 'remediate', to: 'escalate', kind: 'fail',
    desktop: 'M820,346 V442', mobile: 'M190,880 V930' },
]

export const FLOW_EDGE_BY_ID: Record<string, FlowEdgeSpec> = Object.fromEntries(
  FLOW_EDGES.map((e) => [e.id, e]),
)

/** One beat of the run. */
export type RunStep =
  | { type: 'travel'; edge: string; ms: number }
  | { type: 'work'; node: string; ms: number }
  /** Like `work`, but rendered as a blocked gate rather than busy. */
  | { type: 'gate'; node: string; ms: number }

const TRAVEL_MS = 620
const LONG_TRAVEL_MS = 900
const WORK_MS = 900

const DESIGN_PHASE: RunStep[] = [
  { type: 'work', node: 'intent', ms: 700 },
  { type: 'travel', edge: 'e-intent-chain', ms: TRAVEL_MS },
  { type: 'work', node: 'chain', ms: WORK_MS },
  { type: 'travel', edge: 'e-chain-placement', ms: TRAVEL_MS },
  { type: 'work', node: 'placement', ms: WORK_MS },
  { type: 'travel', edge: 'e-placement-cost', ms: TRAVEL_MS },
  { type: 'work', node: 'cost', ms: WORK_MS },
  { type: 'travel', edge: 'e-cost-approval', ms: TRAVEL_MS },
  { type: 'gate', node: 'approval', ms: 1400 },
  { type: 'travel', edge: 'e-approval-deploy', ms: TRAVEL_MS },
  { type: 'work', node: 'deploy', ms: WORK_MS },
  { type: 'travel', edge: 'e-deploy-monitor', ms: LONG_TRAVEL_MS },
  { type: 'work', node: 'monitor', ms: 1100 },
]

/**
 * Builds one run. Every other loop degrades, and those alternate between
 * self-healing and escalating.
 *
 * The cadence is deliberately tight: at every-third-loop with escalation on the
 * second fault, the escalation node first lit ~90s in, so in practice a visitor
 * never saw it and it read as a dead node. This way the first fault lands ~14s
 * in and the first escalation ~45s in, while healthy runs still show half the
 * time.
 */
export function buildRun(loopIndex: number): RunStep[] {
  const degrades = loopIndex % 2 === 1
  if (!degrades) return DESIGN_PHASE

  const escalates = Math.floor(loopIndex / 2) % 2 === 1

  const faultPath: RunStep[] = [
    { type: 'travel', edge: 'e-monitor-failure', ms: TRAVEL_MS },
    { type: 'work', node: 'failure', ms: 1000 },
    { type: 'travel', edge: 'e-failure-remediate', ms: TRAVEL_MS },
    { type: 'work', node: 'remediate', ms: 1000 },
  ]

  if (escalates) {
    return [
      ...DESIGN_PHASE,
      ...faultPath,
      { type: 'travel', edge: 'e-remediate-escalate', ms: TRAVEL_MS },
      { type: 'gate', node: 'escalate', ms: 1600 },
    ]
  }

  return [
    ...DESIGN_PHASE,
    ...faultPath,
    { type: 'travel', edge: 'e-remediate-deploy', ms: LONG_TRAVEL_MS },
    { type: 'work', node: 'deploy', ms: 800 },
  ]
}

/** Pause on the completed graph before the next run starts. */
export const RUN_HOLD_MS = 1200
