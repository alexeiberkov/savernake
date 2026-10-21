import { cardDefById } from "./placeholder-cards.js";
import type {
  AnimalCardDef,
  Edge,
  Food,
  PathCardDef,
  PlacedCard,
  Rotation,
} from "./types.js";

const EDGE_DELTA: Record<Edge, { dr: number; dc: number; opp: Edge }> = {
  N: { dr: -1, dc: 0, opp: "S" },
  S: { dr: 1, dc: 0, opp: "N" },
  E: { dr: 0, dc: 1, opp: "W" },
  W: { dr: 0, dc: -1, opp: "E" },
};

const ROTATE_EDGE: Record<Rotation, Record<Edge, Edge>> = {
  0: { N: "N", E: "E", S: "S", W: "W" },
  90: { N: "E", E: "S", S: "W", W: "N" },
  180: { N: "S", E: "W", S: "N", W: "E" },
  270: { N: "W", E: "N", S: "E", W: "S" },
};

export function rotateEdge(edge: Edge, rotation: Rotation): Edge {
  return ROTATE_EDGE[rotation][edge];
}

export function connectionsAfterRotation(
  base: Edge[],
  rotation: Rotation,
): Set<Edge> {
  return new Set(base.map((e) => rotateEdge(e, rotation)));
}

function facingEdge(from: PlacedCard, to: PlacedCard): Edge | null {
  const dr = to.cell.r - from.cell.r;
  const dc = to.cell.c - from.cell.c;
  if (dr === -1 && dc === 0) return "N";
  if (dr === 1 && dc === 0) return "S";
  if (dr === 0 && dc === 1) return "E";
  if (dr === 0 && dc === -1) return "W";
  return null;
}

/** The other port of the trail that `entry` belongs to, and its foods in travel order. */
function segmentFromEntry(
  def: PathCardDef,
  rotation: Rotation,
  entry: Edge,
): { exit: Edge; foods: Food[] } | null {
  if (!def.segments?.length) return null;
  for (const seg of def.segments) {
    const e0 = rotateEdge(seg.edges[0], rotation);
    const e1 = rotateEdge(seg.edges[1], rotation);
    if (entry === e0) return { exit: e1, foods: seg.foods };
    if (entry === e1) return { exit: e0, foods: [...seg.foods].reverse() };
  }
  return null;
}

function exitsFrom(card: PlacedCard, entry: Edge | null): Edge[] {
  const def = cardDefById(card.cardId);
  if (!def) return [];
  if (def.kind === "animal") {
    return [rotateEdge(def.pathStart, card.rotation)];
  }
  if (def.segments?.length) {
    if (!entry) return [];
    const seg = segmentFromEntry(def, card.rotation, entry);
    return seg ? [seg.exit] : [];
  }
  const edges = [...connectionsAfterRotation(def.connections, card.rotation)];
  if (entry && !edges.includes(entry)) return [];
  return edges.filter((e) => e !== entry);
}

export function cellKey(r: number, c: number): string {
  return `${r},${c}`;
}

export function forestMap(forest: PlacedCard[]): Map<string, PlacedCard> {
  return new Map(forest.map((p) => [cellKey(p.cell.r, p.cell.c), p]));
}

/** Whether two orthogonally adjacent cards share a mutual trail connection. */
export function edgesConnect(
  a: PlacedCard,
  b: PlacedCard,
  fromA: Edge,
): boolean {
  const defA = cardDefById(a.cardId);
  const defB = cardDefById(b.cardId);
  if (!defA || !defB) return false;

  const aEdges =
    defA.kind === "path"
      ? connectionsAfterRotation(defA.connections, a.rotation)
      : new Set([rotateEdge(defA.pathStart, a.rotation)]);

  const bEdges =
    defB.kind === "path"
      ? connectionsAfterRotation(defB.connections, b.rotation)
      : new Set([rotateEdge(defB.pathStart, b.rotation)]);

  const opp = EDGE_DELTA[fromA].opp;
  return aEdges.has(fromA) && bEdges.has(opp);
}

export type PathConflict = {
  pathKey: string;
  animalInstanceIds: string[];
};

/**
 * Build path components reachable from each animal via trail links.
 * Animals on the same connected component share a path.
 */
export function findMultiAnimalPaths(forest: PlacedCard[]): PathConflict[] {
  const animals = forest.filter((c) => c.kind === "animal");
  const map = forestMap(forest);
  const animalToComponent = new Map<string, string>();
  const componentAnimals = new Map<string, string[]>();

  for (const animal of animals) {
    const visited = walkPathComponent(animal, map);
    const key = [...visited].sort().join("|") || animal.instanceId;
    animalToComponent.set(animal.instanceId, key);
    const list = componentAnimals.get(key) ?? [];
    list.push(animal.instanceId);
    componentAnimals.set(key, list);
  }

  const conflicts: PathConflict[] = [];
  for (const [pathKey, ids] of componentAnimals) {
    if (ids.length > 1) {
      conflicts.push({ pathKey, animalInstanceIds: ids });
    }
  }
  return conflicts;
}

/** Cards (by instanceId) in the trail component starting from an animal. */
export function walkPathComponent(
  animal: PlacedCard,
  map: Map<string, PlacedCard>,
): Set<string> {
  const visited = new Set<string>();
  const queue: { card: PlacedCard; entry: Edge | null }[] = [
    { card: animal, entry: null },
  ];
  visited.add(animal.instanceId);

  while (queue.length) {
    const { card: cur, entry } = queue.shift()!;
    for (const edge of exitsFrom(cur, entry)) {
      const { dr, dc, opp } = EDGE_DELTA[edge];
      const neighbor = map.get(cellKey(cur.cell.r + dr, cur.cell.c + dc));
      if (!neighbor || visited.has(neighbor.instanceId)) continue;
      if (!edgesConnect(cur, neighbor, edge)) continue;
      visited.add(neighbor.instanceId);
      queue.push({ card: neighbor, entry: opp });
    }
  }
  return visited;
}

/** Trail-linked orthogonal neighbors of a card. */
export function trailNeighbors(
  card: PlacedCard,
  map: Map<string, PlacedCard>,
): PlacedCard[] {
  const out: PlacedCard[] = [];
  for (const edge of ["N", "E", "S", "W"] as Edge[]) {
    const { dr, dc } = EDGE_DELTA[edge];
    const neighbor = map.get(cellKey(card.cell.r + dr, card.cell.c + dc));
    if (neighbor && edgesConnect(card, neighbor, edge)) {
      out.push(neighbor);
    }
  }
  return out;
}

/**
 * GAME_RULES §8 / §27: a path must stay a single non-branching line.
 * - Path card printed with >2 ports → branch/cross geometry
 * - Path card with >2 trail neighbors after place → branch
 * - Animal with >1 trail neighbor → illegal topology
 */
export function pathTopologyViolation(
  forest: PlacedCard[],
): "BRANCH" | "CROSS" | null {
  const map = forestMap(forest);
  for (const card of forest) {
    const def = cardDefById(card.cardId);
    if (!def) continue;
    const deg = trailNeighbors(card, map).length;
    if (def.kind === "animal") {
      if (deg > 1) return "BRANCH";
      continue;
    }
    if (def.segments?.length) {
      const seen = new Set<Edge>();
      for (const seg of def.segments) {
        if (seg.edges.length > 2) {
          return seg.edges.length > 3 ? "CROSS" : "BRANCH";
        }
        for (const edge of seg.edges) {
          if (seen.has(edge)) return "BRANCH";
          seen.add(edge);
        }
      }
      continue;
    }
    if (def.connections.length > 2) {
      return def.connections.length > 3 ? "CROSS" : "BRANCH";
    }
    if (deg > 2) return "BRANCH";
  }
  return null;
}

/**
 * Foods encountered walking outward from the animal along its polyline trail
 * (GAME_RULES §10 / §28) — unique next edge, not BFS.
 */
export function foodsAlongAnimalPath(animal: PlacedCard, forest: PlacedCard[]): Food[] {
  const def = cardDefById(animal.cardId) as AnimalCardDef | undefined;
  if (!def || def.kind !== "animal") return [];

  const map = forestMap(forest);
  const startEdge = rotateEdge(def.pathStart, animal.rotation);
  const { dr, dc } = EDGE_DELTA[startEdge];
  const first = map.get(cellKey(animal.cell.r + dr, animal.cell.c + dc));
  if (!first || !edgesConnect(animal, first, startEdge)) return [];

  const foods: Food[] = [];
  let prev: PlacedCard = animal;
  let cur: PlacedCard | undefined = first;
  const visited = new Set<string>([animal.instanceId]);

  while (cur) {
    if (visited.has(cur.instanceId)) break;
    visited.add(cur.instanceId);

    if (cur.kind === "animal") break;
    const curDef = cardDefById(cur.cardId);
    if (curDef?.kind !== "path") break;

    const entry = facingEdge(cur, prev);
    const seg = entry ? segmentFromEntry(curDef, cur.rotation, entry) : null;
    if (seg) {
      foods.push(...seg.foods);
      const { dr, dc } = EDGE_DELTA[seg.exit];
      const next = map.get(cellKey(cur.cell.r + dr, cur.cell.c + dc));
      if (!next || next.kind !== "path" || !edgesConnect(cur, next, seg.exit)) break;
      prev = cur;
      cur = next;
      continue;
    }

    foods.push(...curDef.foods);
    const onward: PlacedCard[] = trailNeighbors(cur, map).filter(
      (n) => n.instanceId !== prev.instanceId && n.kind === "path",
    );
    if (onward.length !== 1) break; // dead end or branch — stop
    prev = cur;
    cur = onward[0];
  }
  return foods;
}

export function pathDef(cardId: string): PathCardDef | undefined {
  const d = cardDefById(cardId);
  return d?.kind === "path" ? d : undefined;
}

/**
 * Path cards in traversal order from the animal outward along its trail.
 * Mirrors foodsAlongAnimalPath but returns PlacedCard[] instead of Food[].
 */
export function pathCardsAlongAnimalPath(
  animal: PlacedCard,
  forest: PlacedCard[],
): PlacedCard[] {
  const def = cardDefById(animal.cardId) as AnimalCardDef | undefined;
  if (!def || def.kind !== "animal") return [];

  const map = forestMap(forest);
  const startEdge = rotateEdge(def.pathStart, animal.rotation);
  const { dr, dc } = EDGE_DELTA[startEdge];
  const first = map.get(cellKey(animal.cell.r + dr, animal.cell.c + dc));
  if (!first || !edgesConnect(animal, first, startEdge)) return [];

  const cards: PlacedCard[] = [];
  let prev: PlacedCard = animal;
  let cur: PlacedCard | undefined = first;
  const visited = new Set<string>([animal.instanceId]);

  while (cur) {
    if (visited.has(cur.instanceId)) break;
    visited.add(cur.instanceId);
    if (cur.kind === "animal") break;
    const curDef = cardDefById(cur.cardId);
    if (curDef?.kind !== "path") break;
    cards.push(cur);

    const entry = facingEdge(cur, prev);
    const seg = entry ? segmentFromEntry(curDef, cur.rotation, entry) : null;
    if (seg) {
      const { dr: dr2, dc: dc2 } = EDGE_DELTA[seg.exit];
      const next = map.get(cellKey(cur.cell.r + dr2, cur.cell.c + dc2));
      if (!next || next.kind !== "path" || !edgesConnect(cur, next, seg.exit)) break;
      prev = cur;
      cur = next;
      continue;
    }

    const onward: PlacedCard[] = trailNeighbors(cur, map).filter(
      (n) => n.instanceId !== prev.instanceId && n.kind === "path",
    );
    if (onward.length !== 1) break;
    prev = cur;
    cur = onward[0];
  }
  return cards;
}
