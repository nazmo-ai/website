# Nazmo.AI — Website

**Nazmo.AI | Poetry in Cloud | Orchestrating Cloud Poetry**

Nazmo.AI lets you design, connect, and run multi-cloud service chains on a
visual canvas. Describe your intent in plain language, let AI wire the
services together, and skip Infrastructure-as-Code entirely. Nazmo is
currently in private beta.

This repository contains the marketing/landing site for Nazmo.AI — a
single-page site built with React, TypeScript, Bootstrap, and a D3.js hero
visualization of the orchestration graph.

## What Nazmo.AI does

- **Visual chain builder** — drag, drop, and connect cloud services on a
  graphical canvas; the diagram is the architecture.
- **AI-powered orchestration** — describe the outcome you want and Nazmo.AI
  assembles, configures, and wires the service chain for you.
- **Zero IaC required** — no Terraform, no YAML, no boilerplate scripts;
  Nazmo generates and manages the underlying infrastructure automatically.
- **Multi-cloud native** — orchestrate services across AWS, Azure, GCP, and
  beyond from a single canvas.
- **Live chain monitoring** — watch requests and data flow through the chain
  in real time, with observability built into the graph itself.
- **One-click deploy** — turn a visual design into a running, connected
  service chain instantly, then iterate on the same canvas.

The product flow shown on the site is: **Design → Describe → Orchestrate →
Observe** — from an empty canvas to a live, observable service chain without
writing infrastructure code.

## Site structure

- `Hero` — headline, pitch, and the animated orchestration graph
- `Features` — the six core capabilities above
- `HowItWorks` — the four-step Design/Describe/Orchestrate/Observe flow
- `EarlyAccess` — waitlist signup for the private beta
- `Footer` / `Navbar` — site navigation and branding

## Tech stack

- [React](https://react.dev/) 19 + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) for dev/build tooling
- [Bootstrap](https://getbootstrap.com/) 5 for layout and components
- [D3.js](https://d3js.org/) for the hero orchestration graph visualization

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

See [DEPLOY.md](DEPLOY.md) for full setup, type-checking, Docker, and
deployment instructions.

## License

See [LICENSE](LICENSE).
