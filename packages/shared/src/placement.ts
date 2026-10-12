import { cellKey, findMultiAnimalPaths, forestMap } from "./path-graph.js";
import type { Cell, PlacedCard } from "./types.js";

const ORTHO = [
  { dr: -1, dc: 0 },
  { dr: 1, dc: 0 },
  { dr: 0, dc: -1 },
  { dr: 0, dc: 1 },
];

export type PlaceError = "OUT_OF_BOUNDS" | "ILLEGAL_PLACE";

export function validatePlacement(
  forest: PlacedCard[],
  cell: Cell,
  opts: { strictPathExclusiveDuringPlace: boolean; placingAnimal: boolean },
): PlaceError | null {
  if (cell.r < 0 || cell.r > 3 || cell.c < 0 || cell.c > 3) {
    return "OUT_OF_BOUNDS";
  }
  const map = forestMap(forest);
  if (map.has(cellKey(cell.r, cell.c))) {
    return "ILLEGAL_PLACE";
  }
  if (forest.length === 0) {
    return null;
  }
  const adjacent = ORTHO.some(({ dr, dc }) =>
    map.has(cellKey(cell.r + dr, cell.c + dc)),
  );
  if (!adjacent) return "ILLEGAL_PLACE";

  if (opts.strictPathExclusiveDuringPlace && opts.placingAnimal) {
    const probe: PlacedCard = {
      instanceId: "__probe__",
      cardId: "animal_hedgehog",
      kind: "animal",
      rotation: 0,
      cell,
      lairTokens: 0,
      waterBonus: {},
    };
    const conflicts = findMultiAnimalPaths([...forest, probe]);
    if (conflicts.some((c) => c.animalInstanceIds.includes("__probe__"))) {
      return "ILLEGAL_PLACE";
    }
  }
  return null;
}

export function legalCells(
  forest: PlacedCard[],
  opts: { strictPathExclusiveDuringPlace: boolean; placingAnimal: boolean },
): Cell[] {
  const cells: Cell[] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!validatePlacement(forest, { r, c }, opts)) {
        cells.push({ r, c });
      }
    }
  }
  return cells;
}
