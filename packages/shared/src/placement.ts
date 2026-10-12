import {
  cellKey,
  findMultiAnimalPaths,
  forestMap,
  pathTopologyViolation,
} from "./path-graph.js";
import type { Cell, PlacedCard, Rotation } from "./types.js";

const ORTHO = [
  { dr: -1, dc: 0 },
  { dr: 1, dc: 0 },
  { dr: 0, dc: -1 },
  { dr: 0, dc: 1 },
];

export const MAX_FOREST = 4;

export type PlaceError = "OUT_OF_BOUNDS" | "ILLEGAL_PLACE";

export type PlaceOpts = {
  strictPathExclusiveDuringPlace: boolean;
  placingAnimal: boolean;
  /** Card being placed — enables trail topology checks (GAME_RULES §27). */
  cardId?: string;
  rotation?: Rotation;
  kind?: "path" | "animal";
};

export type ForestExtent = {
  minR: number;
  maxR: number;
  minC: number;
  maxC: number;
  rows: number;
  cols: number;
};

export function forestExtent(forest: PlacedCard[]): ForestExtent | null {
  if (!forest.length) return null;
  let minR = Infinity;
  let maxR = -Infinity;
  let minC = Infinity;
  let maxC = -Infinity;
  for (const card of forest) {
    minR = Math.min(minR, card.cell.r);
    maxR = Math.max(maxR, card.cell.r);
    minC = Math.min(minC, card.cell.c);
    maxC = Math.max(maxC, card.cell.c);
  }
  return {
    minR,
    maxR,
    minC,
    maxC,
    rows: maxR - minR + 1,
    cols: maxC - minC + 1,
  };
}

/** Shift forest so the occupied bbox starts at (0,0). */
export function normalizeForest(forest: PlacedCard[]): PlacedCard[] {
  const ext = forestExtent(forest);
  if (!ext) return forest;
  if (ext.minR === 0 && ext.minC === 0) return forest;
  return forest.map((card) => ({
    ...card,
    cell: { r: card.cell.r - ext.minR, c: card.cell.c - ext.minC },
  }));
}

function spanExceedsMax(cells: Cell[]): boolean {
  if (!cells.length) return false;
  let minR = Infinity;
  let maxR = -Infinity;
  let minC = Infinity;
  let maxC = -Infinity;
  for (const cell of cells) {
    minR = Math.min(minR, cell.r);
    maxR = Math.max(maxR, cell.r);
    minC = Math.min(minC, cell.c);
    maxC = Math.max(maxC, cell.c);
  }
  return maxR - minR + 1 > MAX_FOREST || maxC - minC + 1 > MAX_FOREST;
}

/**
 * Growing 4×4 forest (GAME_RULES §6–§7):
 * adjacency, bbox ≤ 4×4, optional trail topology for the card being placed.
 */
export function validatePlacement(
  forest: PlacedCard[],
  cell: Cell,
  opts: PlaceOpts,
): PlaceError | null {
  const map = forestMap(forest);
  if (map.has(cellKey(cell.r, cell.c))) {
    return "ILLEGAL_PLACE";
  }

  if (forest.length === 0) {
    return cell.r === 0 && cell.c === 0 ? null : "ILLEGAL_PLACE";
  }

  const occupied = forest.map((c) => c.cell);
  if (spanExceedsMax([...occupied, cell])) {
    return "OUT_OF_BOUNDS";
  }

  const adjacent = ORTHO.some(({ dr, dc }) =>
    map.has(cellKey(cell.r + dr, cell.c + dc)),
  );
  if (!adjacent) return "ILLEGAL_PLACE";

  if (opts.cardId && opts.kind && opts.rotation !== undefined) {
    const probe: PlacedCard = {
      instanceId: "__probe__",
      cardId: opts.cardId,
      kind: opts.kind,
      rotation: opts.rotation,
      cell,
      lairTokens: 0,
      waterBonus: {},
    };
    const probeForest = [...forest, probe];
    if (pathTopologyViolation(probeForest)) {
      return "ILLEGAL_PLACE";
    }
  }

  if (opts.strictPathExclusiveDuringPlace && opts.placingAnimal) {
    const probe: PlacedCard = {
      instanceId: "__probe_animal__",
      cardId: opts.cardId ?? "animal_hedgehog",
      kind: "animal",
      rotation: opts.rotation ?? 0,
      cell,
      lairTokens: 0,
      waterBonus: {},
    };
    const conflicts = findMultiAnimalPaths([...forest, probe]);
    if (conflicts.some((c) => c.animalInstanceIds.includes("__probe_animal__"))) {
      return "ILLEGAL_PLACE";
    }
  }
  return null;
}

function candidateCells(forest: PlacedCard[]): Cell[] {
  if (!forest.length) return [{ r: 0, c: 0 }];
  const ext = forestExtent(forest)!;
  const cells: Cell[] = [];
  const r0 = ext.minR - (ext.rows < MAX_FOREST ? 1 : 0);
  const r1 = ext.maxR + (ext.rows < MAX_FOREST ? 1 : 0);
  const c0 = ext.minC - (ext.cols < MAX_FOREST ? 1 : 0);
  const c1 = ext.maxC + (ext.cols < MAX_FOREST ? 1 : 0);
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      cells.push({ r, c });
    }
  }
  return cells;
}

export function legalCells(forest: PlacedCard[], opts: PlaceOpts): Cell[] {
  return candidateCells(forest).filter(
    (cell) => validatePlacement(forest, cell, opts) === null,
  );
}

export function placeCardInForest(
  forest: PlacedCard[],
  card: Omit<PlacedCard, "cell"> & { cell: Cell },
): { forest: PlacedCard[]; placed: PlacedCard } {
  const next = normalizeForest([...forest, card as PlacedCard]);
  const placed = next.find((c) => c.instanceId === card.instanceId)!;
  return { forest: next, placed };
}
