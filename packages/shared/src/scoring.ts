import { cardDefById } from "./placeholder-cards.js";
import { foodsAlongAnimalPath } from "./path-graph.js";
import type {
  AnimalCardDef,
  Food,
  PlacedCard,
  PlayerPublic,
} from "./types.js";
import { ALL_FOODS } from "./types.js";

export type AnimalScoreBreakdown = {
  instanceId: string;
  cardId: string;
  animalPoints: number;
  foodPoints: number;
  capacity: number;
  stored: Food[];
};

/** Capacity = initial den storage + number of caves on the animal. */
export function animalCapacity(
  def: Pick<AnimalCardDef, "storage">,
  animal: Pick<PlacedCard, "lairTokens">,
): number {
  return def.storage + animal.lairTokens;
}

/** Foods on this animal that do not yet have a droplet. */
export function openWaterFoods(animal: PlacedCard): Food[] {
  return ALL_FOODS.filter((food) => (animal.waterBonus[food] ?? 0) < 1);
}

export function playerHasWaterTarget(player: {
  forest: PlacedCard[];
}): boolean {
  return player.forest.some(
    (c) => c.kind === "animal" && openWaterFoods(c).length > 0,
  );
}

export function scoreAnimal(
  animal: PlacedCard,
  forest: PlacedCard[],
): AnimalScoreBreakdown {
  const def = cardDefById(animal.cardId) as AnimalCardDef | undefined;
  if (!def || def.kind !== "animal") {
    return {
      instanceId: animal.instanceId,
      cardId: animal.cardId,
      animalPoints: 0,
      foodPoints: 0,
      capacity: 0,
      stored: [],
    };
  }

  const capacity = animalCapacity(def, animal);
  const along = foodsAlongAnimalPath(animal, forest);
  const stored = along.slice(0, capacity);
  let foodPoints = 0;
  for (const food of stored) {
    const base = def.foodValue[food] ?? 0;
    const droplet = (animal.waterBonus[food] ?? 0) > 0 ? 1 : 0;
    foodPoints += base + droplet;
  }

  return {
    instanceId: animal.instanceId,
    cardId: animal.cardId,
    animalPoints: def.animalPoints,
    foodPoints,
    capacity,
    stored,
  };
}

export function scorePlayerForest(forest: PlacedCard[]): {
  total: number;
  animals: AnimalScoreBreakdown[];
} {
  const animals = forest.filter((c) => c.kind === "animal");
  const breakdowns = animals.map((a) => scoreAnimal(a, forest));
  const total = breakdowns.reduce(
    (sum, b) => sum + b.animalPoints + b.foodPoints,
    0,
  );
  return { total, animals: breakdowns };
}

/** Tie-break: among tied, closest clockwise after first-player seat. */
export function pickWinner(
  players: PlayerPublic[],
  firstPlayerSeat: number,
): string | undefined {
  if (!players.length) return undefined;
  const max = Math.max(...players.map((p) => p.score ?? 0));
  const tied = players.filter((p) => (p.score ?? 0) === max);
  if (tied.length === 1) return tied[0]!.id;

  let best: PlayerPublic | undefined;
  let bestDist = Infinity;
  for (const p of tied) {
    const dist = (p.seat - firstPlayerSeat + players.length) % players.length;
    if (dist < bestDist) {
      bestDist = dist;
      best = p;
    }
  }
  return best?.id;
}
