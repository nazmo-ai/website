# 2026-08-29 — Map hero & orchestration flow redesign

Rebuilt the landing page around two visuals that carry the product story: a
world map of real cloud regions that reacts to the cursor, and an animated
orchestration flow showing agents design → price → **human approval** → deploy →
monitor → self-heal. Added light/dark theming and wired the waitlist to Google
Sheets.

Design spec: [`docs/superpowers/specs/2026-08-29-map-hero-orchestration-redesign-design.md`](../docs/superpowers/specs/2026-08-29-map-hero-orchestration-redesign-design.md)

## Added

| Path | What |
| --- | --- |
| `src/data/cloudRegions.ts` | 204 real regions across AWS, Azure, GCP, Alibaba, Oracle, IBM |
| `src/data/landDots.ts` | Generated: 4,556 land dots, base64-packed Int16 (~25KB source) |
| `src/data/orchestrationFlow.ts` | Flow nodes, orthogonal edges, and the run choreography as data |
| `scripts/build-land-dots.mjs` | One-time land-dot generator from Natural Earth 110m |
| `scripts/waitlist-appscript.gs` | Apps Script `doPost` that appends signups to the sheet |
| `src/theme/tokens.css` | Light and dark token sets, including every colour the canvas paints |
| `src/theme/ThemeProvider.tsx` | Theme context, `localStorage`, `prefers-color-scheme` |
| `src/components/map/` | `DotMap`, pure `dotField` geometry, pure `renderDotMap` drawing, `RegionTooltip` |
| `src/components/flow/` | `OrchestrationFlow`, pure `flowRunner` reducer, `useFlowRunner`, `FlowNode`, `NodeDetailCard` |
| `src/components/CoverageStrip.tsx` | Per-provider region counts and the map colour legend |
| `src/components/HumanInTheLoop.tsx` | Mock approval card expanding on the gate |
| `src/components/ThemeToggle.tsx` | Navbar sun/moon switch |
| `src/lib/waitlist.ts` | Validation and submission |
| 4 test files | 66 Vitest cases over the pure logic |

## Changed

- `Hero` — full-bleed dot map behind the headline; new copy; "coming soon" kept
- `HowItWorks` — now hosts the orchestration flow; the old four-step copy is gone
- `Features` — same six-card grid, rewritten to the orchestrator story, inline SVG icons replacing emoji
- `EarlyAccess` — full form (email, name, company, use case) posting to Sheets, with idle/submitting/success/error states
- `Navbar` — theme toggle, scroll-aware background, `Approvals` link
- `index.css` — rewritten against the token system; hero, map, flow, approval-card, and waitlist styles added
- `index.html` — inline boot script sets the theme before first paint, so there is no flash

## Removed

- `src/components/OrchestrationGraph.tsx` — the d3 hero graph, superseded
- `d3` and `@types/d3` — the graph was their only consumer; `requestAnimationFrame`
  and native `SVGPathElement.getPointAtLength` cover what it did. Bundle dropped
  from ~450KB to 344KB (112KB gzipped).

## Decisions worth remembering

**Canvas 2D, two layers, not SVG or WebGL.** 4,556 land dots plus 204 region
dots have to rescale per frame under the cursor. SVG cannot repaint 4,760
elements at 60fps. The base layer is rendered once offscreen; each frame blits
it, punches out the influence disc with `destination-out`, and repaints only the
~120 dots inside. Flat per-frame cost.

**The destination-out punch is load-bearing.** Magnified dots are displaced
outward, so without erasing the base first, every dot leaves a rest-size ghost
behind it.

**Fit-to-width, not cover.** Cover-scaling was tried first and was wrong: hero
viewports are far squarer than the 2.7:1 map, so it cropped everything but a
vertical slice of Eurasia. Caught in browser QA, not in review.

**Bootstrap stays.** 5.3 ships native colour modes via `data-bs-theme`, which is
most of the theme switch for free, and it only does layout scaffolding here.

**Apps Script over a backend.** The site is static behind nginx, so there is
nowhere to hold a service-account key. Trade-off: the endpoint ships in the
bundle and is publicly writable. Honeypot, a 2.5s minimum dwell, and email
validation run client-side *and again in the script*, since the client checks
are trivially bypassed.

## Found in browser QA

Five things review would not have caught, fixed here:

1. **Cover-scaling cropped the map** to a vertical slice of Eurasia. Hero
   viewports are far squarer than the 2.7:1 map. Now fits to width, centred.
2. **Land dots were nearly invisible** at rest in both themes. Alpha raised
   (0.30 → 0.52 dark, 0.26 → 0.40 light) and radius 1.1 → 1.3px.
3. **The scrim smothered the Americas.** It ran flat across the left 34% at 0.82
   alpha. Now peaks lower and fades out by 56%.
4. **The escalation node never lit.** With faults on every third loop and
   escalation on the second fault, it first appeared ~90s in — long enough that
   it read as dead. Faults now land every other loop, alternating heal and
   escalate: first fault ~14s, first escalation ~45s.
5. **57px of horizontal overflow on mobile**, from four footer links in a
   non-wrapping flex row.

Verified in-browser: no console errors, theme toggles and persists, the approval
gate holds for exactly its 1.4s, the token animates, the failure branch fires,
hit-testing returns `us-east-1 · N. Virginia · AWS`, and neither 390px nor
1440px overflows.

## Follow-up

`VITE_WAITLIST_ENDPOINT` is unset, so the form renders in its disabled
"waitlist opens shortly" state. Setup steps are in `DEPLOY.md`; the endpoint
arrives once the Google Sheet is created.
