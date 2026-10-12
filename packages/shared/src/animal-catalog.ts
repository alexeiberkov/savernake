import type { AnimalCardDef, Edge, Food } from "./types.js";

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

const FOODS: Food[] = ["berry", "worm", "egg", "nut"];
const STARTS: Edge[] = ["N", "E", "S", "W"];

/** Synthetic stats — placeholders until physical verification. */
export const PLACEHOLDER_ANIMALS: AnimalCardDef[] = PLAYABLE_ANIMAL_SLUGS.map(
  (slug, i) => {
    const prefer = FOODS[i % 4]!;
    const secondary = FOODS[(i + 1) % 4]!;
    return {
      id: animalCardId(slug),
      kind: "animal" as const,
      foodValue: {
        berry: prefer === "berry" ? 2 : secondary === "berry" ? 1 : 0,
        worm: prefer === "worm" ? 2 : secondary === "worm" ? 1 : 0,
        egg: prefer === "egg" ? 2 : secondary === "egg" ? 1 : 0,
        nut: prefer === "nut" ? 2 : secondary === "nut" ? 1 : 0,
      },
      storage: 2 + (i % 4),
      animalPoints: ((i % 3) + 1) as 1 | 2 | 3,
      pathStart: STARTS[i % 4]!,
      artSlug: slug,
    };
  },
);
