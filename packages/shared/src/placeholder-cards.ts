import { PLACEHOLDER_ANIMALS } from "./animal-catalog.js";
import type { Edge, Food, PathCardDef } from "./types.js";

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
 * Placeholder path catalog — synthetic geometry/values (45).
 * Animals: see animal-catalog.ts (fan art pack).
 */
export const PLACEHOLDER_PATHS: PathCardDef[] = Array.from({ length: 45 }, (_, i) => ({
  id: `path_${String(i + 1).padStart(2, "0")}`,
  kind: "path" as const,
  connections: CONN_PATTERNS[i % CONN_PATTERNS.length]!.slice() as Edge[],
  foods: FOOD_PATTERNS[i % FOOD_PATTERNS.length]!.slice() as Food[],
}));

export { PLACEHOLDER_ANIMALS };

export function cardDefById(id: string) {
  return (
    PLACEHOLDER_PATHS.find((c) => c.id === id) ??
    PLACEHOLDER_ANIMALS.find((c) => c.id === id)
  );
}
