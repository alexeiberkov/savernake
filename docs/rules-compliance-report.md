# Rules compliance report

**Authority:** `/agent/GAME_RULES.md` (+ Project store copy). Directive: `/agent/Cursor.md`.  
**PR:** https://github.com/alexeiberkov/savernake/pull/1 · branch `cursor/savernake-scaffold-f1dd`  
**Gap analysis:** [`rules-gap-analysis.md`](./rules-gap-analysis.md)

---

## Rules compliance

| Area | Result |
|------|--------|
| Setup (decks, starter animal, FP marker) | Compliant (starter rotation still auto-0 online — see Remaining) |
| Market 3 path + 1 animal; no mid-round refill; EOR discard | Compliant |
| Turn/round; next round starts with FP owner | Compliant |
| Placement: adjacency, rotation, dead ends OK, no forced continuation | Compliant |
| Forest max 4×4 growing bbox | Compliant |
| Path topology: reject branch/cross card geometry; trail degree ≤2 | Compliant (added) |
| Multi-animal path: allow during play, resolve before score | Compliant |
| Food along own polyline + burrow capacity | Compliant (linear walk fixed) |
| Animal-specific food VP; water +1 per symbol; armadillo +1 capacity | Compliant |
| Rooster marker +1 VP end; Rabbit = animal card | Compliant |
| Scoring formula + tie-break | Compliant |
| 2p advanced (§23) | Not implemented (standard mode only) |

---

## Files changed

| File | Change |
|------|--------|
| `packages/shared/src/path-graph.ts` | Linear food walk; `pathTopologyViolation` / `trailNeighbors` |
| `packages/shared/src/placement.ts` | Topology check on place; `PlaceOpts` carries card/rotation |
| `packages/shared/src/placeholder-cards.ts` | Test-only branch/cross path defs (not in decks) |
| `packages/shared/src/engine.ts` | Pass card identity into placement validation |
| `packages/shared/src/auto-play.ts` | Same for legal-cell enumeration |
| `packages/shared/src/rules-compliance.test.ts` | New GAME_RULES compliance suite |
| `packages/web/src/pages/RoomPage.tsx` | Legal cells use selected card + rotation |
| `docs/rules-gap-analysis.md` (store) | Pre-change gap analysis |
| `docs/rules-compliance-report.md` (store) | This report |

---

## Tests

```text
pnpm test  →  36 pass (0 fail)
  including GAME_RULES compliance (14 cases):
  market no mid-round refill; rotation; adjacency; 4×4; dead ends;
  branch reject; cross reject; capacity; Armadillo; Goat water;
  multi-animal resolve; FP bonus; polyline food; EOR refill
pnpm typecheck / pnpm build → green
```

---

## Remaining issues

1. **Starter animal rotation (§3)** — rules allow rotate before first place; online auto-places rotation 0. No invented lobby step this pass.
2. **Geometric crossing** — enforced via illegal port counts (3 = branch, 4 = cross) and trail degree >2. Full pixel-geometry cross not modeled (placeholder cards are 1–2 port polylines).
3. **2p advanced mode (§23)** — not implemented; standard 4×4 only.
4. **Physical card catalog** — stats/geometry still placeholders until box verification.
5. **Water / burrow token supply (15 each)** — not specified in GAME_RULES.md; soft banks deplete and block placement when empty (see `docs/component-inventory.md`).
