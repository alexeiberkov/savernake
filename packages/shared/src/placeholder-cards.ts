import type { AnimalCardDef, PathCardDef } from "./types.js";

/**
 * Placeholder catalog — synthetic geometry/values for scaffolding.
 * Replace with verified structured data later (not OCR of official cards).
 */
export const PLACEHOLDER_PATHS: PathCardDef[] = Array.from({ length: 12 }, (_, i) => ({
  id: `path_${String(i + 1).padStart(2, "0")}`,
  kind: "path" as const,
  connections: ([["N", "S"], ["E", "W"], ["N", "E"], ["S", "W"]] as const)[i % 4].slice() as PathCardDef["connections"],
  foods: ([["berry"], ["worm", "egg"], ["nut"], ["berry", "worm"]] as const)[i % 4].slice() as PathCardDef["foods"],
}));

export const PLACEHOLDER_ANIMALS: AnimalCardDef[] = [
  {
    id: "animal_01",
    kind: "animal",
    foodValue: { berry: 0, worm: 1, egg: 2, nut: 0 },
    storage: 3,
    animalPoints: 2,
    pathStart: "E",
  },
  {
    id: "animal_02",
    kind: "animal",
    foodValue: { berry: 1, worm: 1, egg: 0, nut: 1 },
    storage: 4,
    animalPoints: 1,
    pathStart: "S",
  },
  {
    id: "animal_03",
    kind: "animal",
    foodValue: { berry: 0, worm: 2, egg: 2, nut: 1 },
    storage: 2,
    animalPoints: 3,
    pathStart: "N",
  },
  {
    id: "animal_04",
    kind: "animal",
    foodValue: { berry: 2, worm: 0, egg: 1, nut: 0 },
    storage: 5,
    animalPoints: 1,
    pathStart: "W",
  },
];

export function cardDefById(id: string): PathCardDef | AnimalCardDef | undefined {
  return (
    PLACEHOLDER_PATHS.find((c) => c.id === id) ??
    PLACEHOLDER_ANIMALS.find((c) => c.id === id)
  );
}
