# Rules gap analysis — Savernake vs GAME_RULES.md

Authoritative source: repo `/agent/GAME_RULES.md` (synced from Project store).  
Inspected: `packages/shared` engine, placement, path-graph, scoring, catalog; web market/forest UI.  
Date: 2026-10-12. **Written before code changes.**

Legend: **matches** / **differs** / **missing** / **wrong assumption** / **unhandled edge**.

---

## Setup

| Topic | Status | Notes |
|-------|--------|-------|
| Separate animal + path decks | **matches** | Shuffled separately in `startGame` |
| Each player starts with 1 animal | **matches** | Starter placed face-up in forest |
| Starter may be rotated before place | **missing** (online) | Engine auto-places at rotation 0; no lobby rotate step. Flagged — keep safest existing until UI added |
| First-player marker | **matches** | `firstPlayerSeat` + Rooster transfer |
| Score markers | **matches** | Cosmetic / end scores only |

---

## Market / selection

| Topic | Status | Notes |
|-------|--------|-------|
| 4 helper slots | **matches** | rooster, armadillo, goat, rabbit |
| Fill: 3 path + 1 animal (rabbit) | **matches** | `refillMarket` |
| No mid-round refill | **matches** | Slot cleared; refill only `endRound` / start |
| Leftovers discarded EOR | **matches** | Remaining market → discard |

---

## Turn / round

| Topic | Status | Notes |
|-------|--------|-------|
| Clockwise from first-player | **matches** | Seat order from `firstPlayerSeat` |
| One pick+place+bonus per player/round | **matches** | `actedSeatsThisRound` |
| Next round starts with marker owner | **matches** | `turnSeat = firstPlayerSeat` after refill |

---

## Placement

| Topic | Status | Notes |
|-------|--------|-------|
| Orthogonal adjacency | **matches** | Diagonal rejected |
| Rotation 0/90/180/270 | **matches** | Paths + animals |
| Must place into own forest | **matches** | |
| Path need not continue neighbor trail | **matches** | No connection required on place |
| Dead ends OK | **matches** | |
| No branching on place (§8, §27) | **missing** | Not validated; catalog is 2-port but placement never checks trail degree ≤2 |
| No crossing on place (§8, §27) | **missing** | Same — no geometry/degree check |

---

## Forest size

| Topic | Status | Notes |
|-------|--------|-------|
| Max 4×4 bbox | **matches** | Growing grid + hard cap |
| Grow in any direction | **matches** | Normalize origin after place |
| End game at 16 cards | **matches** | |

---

## Path connectivity

| Topic | Status | Notes |
|-------|--------|-------|
| Trail via mutual edge ports | **matches** | `edgesConnect` |
| Animal uses own pathStart | **matches** | |
| Food walk “along path in order” | **differs** | `foodsAlongAnimalPath` uses BFS queue — for a polyline should walk the unique next edge (order can be wrong at junctions) |

---

## Branching / crossing

| Topic | Status | Notes |
|-------|--------|-------|
| Branch forbidden | **missing** | Need reject if any path card gets trail-degree > 2 after place |
| Cross forbidden | **missing** / **ambiguous** | With 2-port card model, crossing ≈ invalid degree/geometry; enforce degree rule; flag full geometric cross as unmodeled |

---

## Animals

| Topic | Status | Notes |
|-------|--------|-------|
| Multi-animal on path during play OK | **matches** | `strictPathExclusiveDuringPlace: false` |
| Resolve to one animal before score | **matches** | `conflictResolve` phase |
| Discarded animals score 0 | **matches** | Removed from forest |

---

## Food

| Topic | Status | Notes |
|-------|--------|-------|
| Types berries/worms/eggs/nuts | **matches** | Enum aligned |
| Only own continuous path | **matches** | |
| Capacity truncates food list | **matches** | `stored = along.slice(0, capacity)` |
| Animal-specific VP | **matches** | `foodValue` per animal |

---

## Burrow

| Topic | Status | Notes |
|-------|--------|-------|
| baseBurrowCapacity | **matches** | `storage` (default 3 placeholder) |
| Armadillo +1 capacity | **matches** | `lairTokens` |

---

## Helpers

| Topic | Status | Notes |
|-------|--------|-------|
| Rooster → first-player marker | **matches** | Immediate seat transfer |
| Rooster +1 VP at end | **matches** | `firstPlayerBonus` |
| Rooster unused → marker stays | **matches** | |
| Armadillo cave on own animal | **matches** | |
| Goat water on one food corner | **matches** | One droplet per food type |
| Water +1 per collected symbol | **matches** | `scoreStoredFoods` |
| Rabbit = animal card only | **matches** | No extra token |

---

## End-round / end-game

| Topic | Status | Notes |
|-------|--------|-------|
| Discard leftover market | **matches** | |
| Refill then FP starts | **matches** | |
| End at 16 each → conflicts → score | **matches** | |

---

## Scoring

| Topic | Status | Notes |
|-------|--------|-------|
| animalScore = base + food | **matches** | |
| Water effective value per symbol | **matches** | |
| playerScore + FP bonus | **matches** | |
| Tie-break near FP marker | **matches** | `pickWinner` |

---

## 2p advanced (§23)

| Topic | Status | Notes |
|-------|--------|-------|
| 8×4 / 4×8, 2 starters, 2 cards/round | **missing** | Not implemented — out of standard mode; leave gated/unimplemented |

---

## Planned code changes (from this analysis)

1. Linear food walk along polyline (fix BFS order).
2. Placement validation: reject branch/cross via trail-degree rules (§27.4–5).
3. Automated compliance tests for the user’s minimum list.
4. No 2p-advanced implementation in this pass.
5. Starter rotation: document as remaining issue (no gameplay invent).
