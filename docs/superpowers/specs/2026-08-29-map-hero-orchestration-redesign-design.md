# Nazmo.AI — Map Hero & Orchestration Flow Redesign

**Date:** 2026-08-29
**Status:** Approved for implementation

## Goal

Rebuild the Nazmo.AI landing page around two visuals that carry the product
story: a world map of real cloud regions that responds to the cursor, and an
animated orchestration flow that shows agents designing, pricing, and deploying
a service chain — pausing for human approval and healing itself on failure.

Add light/dark theming, and write waitlist signups to a Google Sheet.

The site stays a single static page. It remains marked "coming soon."

## Non-goals

- No backend service. The site is static files behind nginx.
- No CMS, no blog, no docs site, no pricing page.
- No visual-regression tooling.
- No real product data. Region coordinates are real; everything the
  orchestration flow displays is illustrative copy.

## Foundation decisions

### Map rendering: Canvas 2D, two layers

About 5,500 land dots plus ~220 region dots must rescale per frame under the
cursor. SVG cannot repaint 5,700 elements at 60fps. WebGL adds a dependency and
a fallback story for what is ultimately a background.

Every dot is rendered once at rest size into an offscreen canvas. Each frame
blits that base and repaints only the dots inside the cursor's influence radius
(~120 dots). Cost is constant regardless of map density. The base re-renders
only on resize or theme change.

### Dependencies: drop d3, keep Bootstrap

d3 is used only by `OrchestrationGraph`, which this work replaces. Everything it
provided — `d3.timer`, selections — is `requestAnimationFrame` and native
`SVGPathElement.getPointAtLength`. Removing it drops ~100KB from the bundle.

Bootstrap 5 stays. Version 5.3 ships native color modes via `data-bs-theme`,
which supplies most of the theme toggle, and it is only doing layout
scaffolding. Replacing it would mean rewriting markup for no gain.

New dev dependencies: `world-atlas` and `topojson-client` (build-time land dot
generation only, never shipped), and `vitest` for pure-logic tests.

### Waitlist: Google Apps Script Web App

A static site has nowhere to hold a service-account key. The user's blank sheet
gets a bound Apps Script with a `doPost` that appends a row; it is deployed as a
web app with "Execute as: Me" and "Who has access: Anyone". The site POSTs
form-encoded data to that URL.

The script is committed at `scripts/waitlist-appscript.gs` for the user to
paste. The deployment URL is supplied at build time as
`VITE_WAITLIST_ENDPOINT`.

**Known limitation:** the endpoint ships in the client bundle and is publicly
writable. Mitigations — honeypot field, minimum 2.5s form dwell time, and email
validation — are enforced client-side *and again inside the Apps Script*, since
client checks are trivially bypassed. This is acceptable for a beta waitlist and
not for anything sensitive. The URL can be rotated by redeploying the script.

## Architecture

```
src/
  data/
    cloudRegions.ts        ~220 real regions {provider, code, city, lat, lng}
    landDots.ts            generated: packed Int16 dot grid, ~12KB
    orchestrationFlow.ts   nodes, edges, timeline, copy
  theme/
    ThemeProvider.tsx      context + <html> attributes + localStorage
    tokens.css             light/dark custom-property sets
  components/
    map/
      DotMap.tsx           canvas host: resize, pointer, tooltip anchor
      dotField.ts          PURE: projection, falloff, hit-test bucketing
      renderDotMap.ts      PURE: base-layer and hot-layer draw functions
      RegionTooltip.tsx
    flow/
      OrchestrationFlow.tsx  SVG host
      flowRunner.ts          PURE: timeline reducer
      useFlowRunner.ts       rAF driver around the reducer
      FlowNode.tsx
      NodeDetailCard.tsx
    Hero.tsx  CoverageStrip.tsx  Features.tsx  HowItWorks.tsx
    HumanInTheLoop.tsx  EarlyAccess.tsx  Navbar.tsx  Footer.tsx
    ThemeToggle.tsx
  lib/
    waitlist.ts            PURE validation + submit
scripts/
  build-land-dots.mjs      one-time generator; output is committed
  waitlist-appscript.gs    paste into the bound Apps Script editor
```

Draw and timeline logic live in pure modules separate from their React hosts, so
magnification math and run choreography are testable without a DOM.

## Page order

1. Navbar — brand, links, theme toggle, CTA
2. Hero — full-bleed dot map behind headline, "coming soon" badge retained
3. Coverage strip — per-provider counts and the color legend
4. Features — existing 6-card section, copy rewritten
5. How it works — hosts the orchestration flow
6. Human in the loop — mock approval card
7. Early access — waitlist form
8. Footer

The old four-step "Design → Describe → Orchestrate → Observe" copy is deleted;
the flow graph tells that story. `BackgroundMusic` is left untouched.

## The dot map

**Projection.** Equirectangular: `x = (lng + 180) / 360`,
`y = (latMax - lat) / (latMax - latMin)`. Latitude clipped to 78°N–56°S, which
drops Antarctica and keeps Patagonia and New Zealand.

**Land dots.** Generated at build time by sampling Natural Earth 110m land
polygons on a 12px grid at a 1600px reference width, using `topojson-client` and
a point-in-polygon test. Output is committed as a packed Int16 array in
`landDots.ts`, so no geographic library is loaded at runtime.

**Region dots.** ~220 real regions across AWS, Azure, GCP, Alibaba Cloud,
Oracle OCI, and IBM Cloud, each with provider, region code, city, and
coordinates.

**Provider colors.** Six distinct hues, brand-adjacent but harmonized, each with
a per-theme lightness shift:

| Provider | Base hex |
| --- | --- |
| AWS | `#FF9900` |
| Azure | `#38BDF8` |
| GCP | `#34D399` |
| Alibaba Cloud | `#F472B6` |
| Oracle OCI | `#EF4444` |
| IBM Cloud | `#A78BFA` |

**Rest state.** Land dots r≈1.1px at 0.35 alpha (dark) / 0.28 (light). Region
dots r≈2.2px at full color with a slow staggered breathing pulse.

**Magnification.** Smoothstep falloff over a 130px radius:

```
f = max(0, 1 - dist / R)
e = f * f * (3 - 2f)
scale   = 1 + 2.2 * e          (land)   /  1 + 3.2 * e  (region)
alpha  += 0.55 * e
offset  = 4px * e  outward along cursor→dot
```

Cursor position is lerped 0.15/frame toward the true pointer so the field trails
fluidly rather than snapping. When the pointer leaves, the radius decays to zero
rather than cutting.

The outward offset does double duty: us-east-1 and western Europe are dense
enough that region dots overlap at rest, and magnification spreads the cluster
apart exactly when the user is trying to read it.

**Hit testing.** Region dots are bucketed into a 40px uniform grid. A pointer
within 8px of a region dot opens a tooltip reading `eu-central-1 · Frankfurt ·
AWS`.

**Adaptations.**
- Coarse pointer (touch): magnification is meaningless, so a slow ripple sweeps
  the map every 12s instead.
- `prefers-reduced-motion`: static render — no pulse, no sweep, no cursor lerp.
  Magnification is retained because it is user-driven, but applies instantly.

**Legibility.** A scrim behind the headline column guarantees text contrast
regardless of dot density behind it.

## The orchestration flow

Ten nodes. Agent nodes are rounded cards; the two human nodes get a distinct
ring treatment so handoffs read at a glance.

```
Intent → Chain design → Placement → Cost estimate → ◈ Approval → Deploy
                                                                   │
                                     ┌─────────────────────────────┘
                                     ▼
                                Monitoring ─▶ Failure detect ─▶ Remediate ─┐
                                     ▲                              │      │
                                     └──────────────────────────────┘      ▼
                                                                  ◈ Escalate
```

`◈` marks a human node. Coordinates are hand-authored with orthogonal
connectors; there is no force layout, so the graph never reflows into something
unreadable.

**Run cycle (~14s).** A token travels the edges. Each node lights on arrival,
shows a micro-status line (`12 services wired`, `$1,840/mo est.`), then
check-marks. At the approval gate the token visibly halts — amber pulse,
"waiting for approval", ~1.4s — then clears and continues.

Every third loop takes the failure branch: the edge turns red, failure detection
lights, remediation runs and loops back into Deploy. Occasionally remediation
fails and the escalation node lights instead.

**Interaction.** Hovering a node pauses the run and opens a detail card anchored
to it — title, what the agent does, its inputs and outputs. Leaving resumes from
the paused position.

**Implementation.** A single SVG. Edges are `<path>` elements with orthogonal
`d` strings; the token position comes from `getPointAtLength` on the active
edge, updated in `requestAnimationFrame`. Node state lives in a reducer driven
by a timeline array in `orchestrationFlow.ts` — changing the story means editing
data, not animation code.

**Adaptations.** Mobile uses an alternate coordinate set from the same node
data, laid out vertically. `prefers-reduced-motion` renders the completed
end-state with no token; hover cards still work.

## Remaining sections

**Coverage strip.** Per-provider region counts that count up on reveal, plus the
color legend decoding the map. Counts are derived from `cloudRegions.ts`, so the
strip and the map cannot disagree.

**Features.** Existing six-card grid and markup retained; copy rewritten to the
orchestrator story — intent-to-chain design, multi-cloud placement, cost
modelling, governed approvals, one-click deploy, self-healing.

**Human in the loop.** A mock approval card showing proposed architecture,
monthly cost with delta, and blast radius, with Approve / Request changes
buttons. Decorative and non-functional, but fully styled with hover states.

**Early access.** Fields: email (required), name, company, optional use-case
select. States: idle / submitting / success / error, with inline messaging; on
success the form is replaced by a confirmation.

If `VITE_WAITLIST_ENDPOINT` is unset at build time, the form renders disabled
with "waitlist opening soon", so the site never ships a form that silently drops
emails.

## Theme system

`<html>` carries both `data-bs-theme` (Bootstrap's native color mode) and
`data-theme` (our own token layer). The navbar toggle persists the choice to
`localStorage` under `nz-theme`.

With no stored choice, the theme follows `prefers-color-scheme` and reacts live
to OS changes. Once the user picks explicitly, that choice wins until cleared.

An inline script in `index.html` sets the attributes before first paint, so
there is no flash of the wrong theme.

Canvas and SVG read their colors from CSS custom properties via
`getComputedStyle` and re-render the base layer on theme change.

## Error handling

- Canvas context creation fails → render a static SVG world silhouette instead.
- Region and dot data are local modules, so there is no fetch to fail.
- Waitlist network error → inline error with retry; never a dead end. An opaque
  response is treated as success, since Apps Script responses may not be
  readable cross-origin.
- Every animation tears down its `requestAnimationFrame` handle, resize
  observer, and pointer listeners on unmount.

## Testing

The repo has no test setup today. Vitest is added for pure logic only:

- `dotField.ts` — projection math, smoothstep falloff, hit-test bucketing
- `flowRunner.ts` — timeline reducer transitions, including the gate pause and
  the failure branch
- `waitlist.ts` — email validation, honeypot and dwell-time rejection

No DOM or visual tests. Manual QA matrix: light/dark × desktop/mobile ×
reduced-motion.

## Open item

The user will supply a blank Google Sheet at the end of implementation. Until
then `VITE_WAITLIST_ENDPOINT` stays unset and the form renders in its disabled
"waitlist opening soon" state.
