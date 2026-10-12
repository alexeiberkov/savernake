import type { AnimalCardDef, Edge, Food, PathCardDef } from "./types.js";

const CONN_PATTERNS: Edge[][] = [
  ["N", "S"],
  ["E", "W"],
  ["N", "E"],
  ["S", "W"],
  ["N", "W"],
  ["S", "E"],
];

const FOOD_PATTERNS: Food[][] = [
  ["berry"],
  ["worm"],
  ["egg"],
  ["nut"],
  ["berry", "worm"],
  ["egg", "nut"],
  ["worm", "egg"],
  ["berry", "nut"],
  ["worm", "nut", "egg"],
];

/**
 * Placeholder catalog — synthetic geometry/values (45 path + 19 animal).
 * Not derived from official card scans; replace with verified data later.
 */
export const PLACEHOLDER_PATHS: PathCardDef[] = Array.from({ length: 45 }, (_, i) => ({
  id: `path_${String(i + 1).padStart(2, "0")}`,
  kind: "path" as const,
  connections: CONN_PATTERNS[i % CONN_PATTERNS.length]!.slice() as Edge[],
  foods: FOOD_PATTERNS[i % FOOD_PATTERNS.length]!.slice() as Food[],
}));

const FOODS: Food[] = ["berry", "worm", "egg", "nut"];
const STARTS: Edge[] = ["N", "E", "S", "W"];

export const PLACEHOLDER_ANIMALS: AnimalCardDef[] = Array.from({ length: 19 }, (_, i) => {
  const prefer = FOODS[i % 4]!;
  const secondary = FOODS[(i + 1) % 4]!;
  return {
    id: `animal_${String(i + 1).padStart(2, "0")}`,
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
  };
});

export function cardDefById(id: string): PathCardDef | AnimalCardDef | undefined {
  return (
    PLACEHOLDER_PATHS.find((c) => c.id === id) ??
    PLACEHOLDER_ANIMALS.find((c) => c.id === id)
  );
}
