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

/**
 * GAME_RULES §15 / §20: water raises that food’s value by +1 for **every**
 * collected symbol of that type (not a one-time +1 to the total).
 */
export function scoreStoredFoods(
  foodValue: Record<Food, number>,
  waterBonus: Partial<Record<Food, 0 | 1>>,
  stored: Food[],
): number {
  let foodPoints = 0;
  for (const food of stored) {
    const base = foodValue[food] ?? 0;
    const droplet = (waterBonus[food] ?? 0) > 0 ? 1 : 0;
    foodPoints += base + droplet;
  }
  return foodPoints;
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
  const foodPoints = scoreStoredFoods(def.foodValue, animal.waterBonus, stored);

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

/** Returns the sole winner's id, or undefined if scores are tied (draw). */
export function pickWinner(
  players: PlayerPublic[],
  _firstPlayerSeat: number,
): string | undefined {
  if (!players.length) return undefined;
  const max = Math.max(...players.map((p) => p.score ?? 0));
  const tied = players.filter((p) => (p.score ?? 0) === max);
  return tied.length === 1 ? tied[0]!.id : undefined;
}
