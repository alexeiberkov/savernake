/**
 * Physical / fan-project component inventory (Aliaksei product spec).
 * GAME_RULES.md does not pin bank sizes for water/lair tokens — soft banks of 15.
 */

export const PATH_DECK_SIZE = 45;
export const ANIMAL_DECK_SIZE = 19;
/** Soft bank — depletes; cannot place when empty. */
export const WATER_TOKEN_BANK = 15;
/** Soft bank — depletes; cannot place when empty (per-animal count still unlimited). */
export const LAIR_TOKEN_BANK = 15;
/** Forest size that ends the game (each player). */
export const FOREST_TARGET_CARDS = 16;
/** Path cards dealt to Rooster / Armadillo / Goat each round. */
export const PATHS_PER_ROUND = 3;

/** Remaining full rounds until forests hit target (players stay in sync). */
export function remainingRoundsFromForests(
  players: { cardCount: number }[],
): number {
  if (!players.length) return FOREST_TARGET_CARDS;
  const minCards = Math.min(...players.map((p) => p.cardCount));
  return Math.max(0, FOREST_TARGET_CARDS - minCards);
}

/** How many future market refills the path draw pile can still support. */
export function remainingRoundsFromPathDeck(pathDeckSize: number): number {
  return Math.ceil(Math.max(0, pathDeckSize) / PATHS_PER_ROUND);
}
