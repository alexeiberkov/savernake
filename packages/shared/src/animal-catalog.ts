import type { AnimalCardDef, Edge, Food, FoodVp } from "./types.js";
import { ALL_FOODS } from "./types.js";

/**
 * Playable animal deck (19) — advisors (rooster/armadillo/goat/rabbit) are board
 * slots, not in this deck. Images live in web/public/animals/{slug}.png
 */
export type AnimalSlug =
  | "hedgehog"
  | "badger"
  | "beaver"
  | "fox"
  | "blue-jay"
  | "magpie"
  | "mole"
  | "raven"
  | "barn-owl"
  | "mouse"
  | "shrew"
  | "squirrel"
  | "woodpecker"
  | "chipmunk"
  | "titmouse"
  | "wildcat"
  | "pygmy-possum"
  | "chickadee"
  | "hamster";

export type AdvisorSlug = "rooster" | "armadillo" | "goat" | "rabbit";

export const ADVISOR_SLUGS: AdvisorSlug[] = [
  "rooster",
  "armadillo",
  "goat",
  "rabbit",
];

export const PLAYABLE_ANIMAL_SLUGS: AnimalSlug[] = [
  "hedgehog",
  "badger",
  "beaver",
  "fox",
  "blue-jay",
  "magpie",
  "mole",
  "raven",
  "barn-owl",
  "mouse",
  "shrew",
  "squirrel",
  "woodpecker",
  "chipmunk",
  "titmouse",
  "wildcat",
  "pygmy-possum",
  "chickadee",
  "hamster",
];

export function animalCardId(slug: AnimalSlug): string {
  return `animal_${slug.replace(/-/g, "_")}`;
}

export function slugFromAnimalCardId(cardId: string): string | null {
  if (!cardId.startsWith("animal_")) return null;
  return cardId.slice("animal_".length).replace(/_/g, "-");
}

/** Default initial den capacity until physical cards are verified. */
export const DEFAULT_ANIMAL_STORAGE = 3;

/**
 * Printed path-start is always the top edge of the card face (fox ref).
 * Rotation turns the whole card; engine uses pathStart + rotation.
 */
export const DEFAULT_PATH_START: Edge = "N";

/**
 * Printed food corners on the animal card face (fox reference / GAME_RULES).
 * Swap `foodValue` numbers later — corner positions stay fixed.
 */
export const ANIMAL_FOOD_CORNERS: { food: Food; corner: "tl" | "tr" | "bl" | "br" }[] =
  [
    { food: "berries", corner: "tl" },
    { food: "worms", corner: "tr" },
    { food: "eggs", corner: "bl" },
    { food: "nuts", corner: "br" },
  ];

/**
 * Placeholder product VP (0/1/2) until Aliaksei supplies real weights.
 * Pattern: ((animalIndex + foodIndex) % 3). Fox eggs forced to 2 (GAME_RULES §15).
 */
function placeholderFoodValue(i: number): Record<Food, FoodVp> {
  const values = {} as Record<Food, FoodVp>;
  for (let f = 0; f < ALL_FOODS.length; f++) {
    values[ALL_FOODS[f]!] = ((i + f) % 3) as FoodVp;
  }
  return values;
}

/** Synthetic stats — placeholders until physical verification / real product list. */
export const PLACEHOLDER_ANIMALS: AnimalCardDef[] = PLAYABLE_ANIMAL_SLUGS.map(
  (slug, i) => {
    const foodValue = placeholderFoodValue(i);
    // Fox eggs example (GAME_RULES §15): printed +2 → +3 with water token.
    if (slug === "fox") {
      foodValue.eggs = 2;
    }
    return {
      id: animalCardId(slug),
      kind: "animal" as const,
      foodValue,
      storage: DEFAULT_ANIMAL_STORAGE,
      animalPoints: ((i % 3) + 1) as 1 | 2 | 3,
      pathStart: DEFAULT_PATH_START,
      artSlug: slug,
    };
  },
);
