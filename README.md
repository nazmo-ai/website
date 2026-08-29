# Nazmo.AI — Website

**Nazmo.AI | Poetry in Cloud | Orchestrating Cloud Poetry**

Nazmo.AI lets you design, connect, and run multi-cloud service chains on a
visual canvas. Describe your intent in plain language, let AI wire the
services together, and skip Infrastructure-as-Code entirely. Nazmo is
currently in private beta.

This repository contains the marketing/landing site for Nazmo.AI — a
single-page site built with React, TypeScript, and Bootstrap, fronted by an
interactive world map of live cloud regions and an animated orchestration
graph.

## What Nazmo.AI does

- **Intent becomes architecture** — describe the outcome in plain language and
  Nazmo resolves it into a concrete service chain.
- **Placement across every cloud** — each service lands on the provider and
  region that fits, weighed on residency, latency, and availability.
- **Cost modelled before commit** — the whole topology is priced, with the delta
  against what you run today, before a resource exists.
- **Approvals that actually block** — the run stops at a gate; a person signs off
  on the design and the spend, and the decision is recorded.
- **Deploy without writing IaC** — approved topologies are provisioned in
  dependency order and rolled back together on failure.
- **Self-healing at runtime** — faults are localised and repaired with the
  smallest fix; what cannot be fixed is escalated to a human.

The run shown on the site is: **intent → chain design → placement → cost →
human approval → deploy → monitor → self-heal or escalate.**

## Site structure

- `Hero` — headline over a full-bleed dot map of 204 real cloud regions that
  magnifies under the cursor
- `CoverageStrip` — per-provider region counts and the map colour legend
- `Features` — the six capabilities above
- `HowItWorks` — the animated orchestration graph, including the approval gate
  and the failure branch
- `HumanInTheLoop` — an example approval request: design, cost delta, blast radius
- `EarlyAccess` — waitlist signup for the private beta
- `Footer` / `Navbar` — navigation, branding, light/dark toggle

## Tech stack

- [React](https://react.dev/) 19 + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) for dev/build tooling
- [Bootstrap](https://getbootstrap.com/) 5 for layout and native colour modes
- Canvas 2D for the hero map, hand-rolled SVG for the orchestration graph
- [Vitest](https://vitest.dev/) for the pure-logic tests

## Develop

```bash
npm install
npm run dev
```

## Test

```bash
npm test
```

## Build

```bash
npm run build
```

See [DEPLOY.md](DEPLOY.md) for full setup, type-checking, Docker, and
deployment instructions.

## License

See [LICENSE](LICENSE).
