import { cardDefById } from "./placeholder-cards.js";
import { foodsAlongAnimalPath } from "./path-graph.js";
import type { AnimalCardDef, Food, PlacedCard, PlayerPublic } from "./types.js";

export type AnimalScoreBreakdown = {
  instanceId: string;
  cardId: string;
  animalPoints: number;
  foodPoints: number;
  stored: Food[];
};

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
      stored: [],
    };
  }

  const capacity = def.storage + animal.lairTokens;
  const along = foodsAlongAnimalPath(animal, forest);
  const stored = along.slice(0, capacity);
  let foodPoints = 0;
  for (const food of stored) {
    const base = def.foodValue[food] ?? 0;
    const bonus = animal.waterBonus[food] ?? 0;
    foodPoints += base + bonus;
  }

  return {
    instanceId: animal.instanceId,
    cardId: animal.cardId,
    animalPoints: def.animalPoints,
    foodPoints,
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
    // "Closest to first player in turn order" — prefer smallest positive distance after FP
    // dist 0 means the FP holder themselves among ties
    if (dist < bestDist) {
      bestDist = dist;
      best = p;
    }
  }
  return best?.id;
}
