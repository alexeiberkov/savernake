# Component inventory (fan remake)

Authority: product note from Aliaksei + `GAME_RULES.md` (scoring/placement).  
GAME_RULES does **not** specify numeric banks for water/lair tokens — soft banks of 15.

| Component | Count | Notes |
| --- | ---: | --- |
| Path cards | 45 | Draw pile; 3 dealt per round (Rooster / Armadillo / Goat) |
| Animal cards | 19 | Playable deck (advisors are board slots, not in deck) |
| Burrow / lair tokens | 15 | Soft bank; depletes; cannot place when empty |
| Water tokens | 15 | Soft bank; depletes; cannot place when empty |

UI: path deck stack thickness tracks remaining paths; face shows remaining rounds (ходов) + path count. Chip banks sit beside Armadillo (burrow) and Goat (water).

Constants: `@savernake/shared` → `component-counts.ts`.
