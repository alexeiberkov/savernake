import type { AnimalCardDef, Edge, Food, FoodVp } from "./types.js";

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

/**
 * Printed path-start is always the top edge of the card face (fox ref).
 * Rotation turns the whole card; engine uses pathStart + rotation.
 */
export const DEFAULT_PATH_START: Edge = "N";

/**
 * Printed food corners on the animal card face.
 * Raspberry top-left, worm top-right, eggs bottom-left, acorn bottom-right.
 */
export const ANIMAL_FOOD_CORNERS: { food: Food; corner: "tl" | "tr" | "bl" | "br" }[] =
  [
    { food: "berries", corner: "tl" },
    { food: "worms", corner: "tr" },
    { food: "eggs", corner: "bl" },
    { food: "nuts", corner: "br" },
  ];

type PrintedAnimal = {
  /** VP for berries, worms, eggs, nuts — the four corner flowers. The face draws these; they are not printed on the art. */
  food: [FoodVp, FoodVp, FoodVp, FoodVp];
  /** Red leaf: the animal’s own VP. */
  animalPoints: 1 | 2 | 3;
  /** Number under the stone cairn: starting den capacity. The face draws this; it is not printed on the art. */
  storage: number;
};

/** Read from the physical animal cards (corner flowers, leaf, cairn). */
const PRINTED: Record<AnimalSlug, PrintedAnimal> = {
  hedgehog: { food: [2, 1, 1, 2], animalPoints: 3, storage: 0 },
  badger: { food: [1, 2, 2, 1], animalPoints: 3, storage: 0 },
  beaver: { food: [2, 0, 0, 2], animalPoints: 2, storage: 2 },
  fox: { food: [0, 1, 2, 0], animalPoints: 2, storage: 3 },
  "blue-jay": { food: [1, 1, 1, 1], animalPoints: 2, storage: 2 },
  magpie: { food: [0, 0, 1, 0], animalPoints: 1, storage: 5 },
  mole: { food: [0, 2, 0, 0], animalPoints: 1, storage: 4 },
  raven: { food: [0, 1, 2, 1], animalPoints: 2, storage: 3 },
  "barn-owl": { food: [0, 1, 1, 0], animalPoints: 1, storage: 4 },
  mouse: { food: [0, 1, 0, 1], animalPoints: 1, storage: 4 },
  shrew: { food: [1, 1, 0, 0], animalPoints: 1, storage: 4 },
  squirrel: { food: [0, 0, 0, 1], animalPoints: 1, storage: 5 },
  woodpecker: { food: [0, 0, 0, 2], animalPoints: 1, storage: 4 },
  chipmunk: { food: [1, 0, 0, 2], animalPoints: 2, storage: 3 },
  titmouse: { food: [1, 0, 1, 0], animalPoints: 1, storage: 4 },
  wildcat: { food: [0, 0, 2, 0], animalPoints: 1, storage: 4 },
  "pygmy-possum": { food: [1, 1, 2, 0], animalPoints: 2, storage: 2 },
  chickadee: { food: [1, 0, 0, 0], animalPoints: 1, storage: 5 },
  hamster: { food: [1, 1, 0, 1], animalPoints: 2, storage: 3 },
};

export const PLACEHOLDER_ANIMALS: AnimalCardDef[] = PLAYABLE_ANIMAL_SLUGS.map(
  (slug) => {
    const printed = PRINTED[slug];
    const [berries, worms, eggs, nuts] = printed.food;
    return {
      id: animalCardId(slug),
      kind: "animal" as const,
      foodValue: { berries, worms, eggs, nuts },
      storage: printed.storage,
      animalPoints: printed.animalPoints,
      pathStart: DEFAULT_PATH_START,
      artSlug: slug,
    };
  },
);
