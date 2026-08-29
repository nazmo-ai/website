# 2026-08-29 — Co-located regions were invisible on the hero map

Follow-up to [the map hero redesign](2026-08-29-map-hero-orchestration-redesign.md).

## The bug

Reported: *"The dots when they overlap on same location, I can see only one data
center instead of all others on that location."*

Correct, and worse than it looked. The dataset has 204 regions at only **107
distinct coordinates** — London, Frankfurt and Tokyo each host six providers at
*identical* lat/lng, and after proximity clustering there are just **78 visually
distinct spots**. Every region beyond the first at a spot was painted directly
underneath its neighbours and could never be seen or hovered.

The magnification from the original build did not help. Displacement is derived
from the cursor-to-dot vector, so dots at the same coordinate receive the same
displacement and stay perfectly stacked no matter how close the cursor gets.

## The fix

**Cluster and fan.** Regions whose projected positions fall within 7px are
grouped, then arranged on a small rosette around the shared anchor. The rosette
is tight at rest and blooms to ~3× under the cursor, which is what finally makes
the magnification reveal something instead of just enlarging one dot.

**Only the nearest metro blooms.** At hero scale Frankfurt, Zurich, Milan and
Paris sit ~11px apart with 4-6 providers each; opening every rosette at once
turned western Europe into a coloured smear.

**The tooltip lists the whole cluster.** This is the part that actually resolves
the complaint. Hovering Frankfurt now names all six providers at once, so nobody
has to thread a cursor between individual petals to enumerate what is there.
Single-region spots keep the original one-line form.

Rendering and hit-testing share one `regionRenderPosition` function, so aiming
at a dot hits that dot. The hit test falls back to the nearest metro within 18px,
because a bloomed rosette leaves its own centre vacant — without the fallback,
pointing straight at the dot you originally aimed for would select nothing.

## Two things the first attempt got wrong

**Focus hysteresis backfired.** I added stickiness so a rosette would not
collapse while the user reached for one of its petals. It meant approaching
Singapore from the west locked focus onto Kuala Lumpur 11px away and held it —
Singapore's tooltip never opened. Once the tooltip listed whole clusters, petal
threading was unnecessary, so the hysteresis had no remaining benefit and was
removed. Nearest-metro is simpler and more predictable.

**The tooltip ran off the right edge at Sydney.** Long codes like
`australia-southeast1` pushed the card to 273px against an assumed 232px. Capped
at 16rem with the clamp sized to match, and codes now ellipsise.

## Verified

| | Before | After |
| --- | --- | --- |
| Nameable spots | 78 | — |
| Distinct region codes nameable | ~78 | **187 of 192** |

Swept 12 metros from a neutral approach: Frankfurt 6, London 6, Tokyo 6,
Singapore 5, Mumbai 6, São Paulo 6, Sydney 5, Hong Kong 7, N. Virginia 4,
Stockholm 3, Cape Town 2, and Oslo correctly showing the single-region form.
Nothing clipped at any viewport edge, no console errors, 390px still free of
horizontal overflow, 78 tests green.

The 5 unnamed codes are clusters whose anchors fall outside the visible canvas at
1440×900, not overlap failures.
