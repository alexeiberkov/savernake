import { GameEngine, type InternalMatch } from "./engine.js";
import { legalCells } from "./placement.js";
import { openWaterFoods } from "./scoring.js";
import type {
  AdvisorSlot,
  ClientIntent,
  EngineResult,
  Rotation,
} from "./types.js";

const ROTATIONS: Rotation[] = [0, 90, 180, 270];

export type PickPlaceOption = Extract<ClientIntent, { type: "pickAndPlace" }>;

function pickUniform<T>(items: T[], rand: () => number): T | undefined {
  if (!items.length) return undefined;
  return items[Math.floor(rand() * items.length)]!;
}

/** Enumerate every legal pickAndPlace for the current turn player. */
export function enumerateLegalPickAndPlace(
  match: InternalMatch,
): PickPlaceOption[] {
  if (match.phase !== "turn" || match.pendingAdvisor) return [];
  const player = match.players.find((p) => p.seat === match.turnSeat);
  if (!player) return [];
  if (match.actedSeatsThisRound.includes(player.seat)) return [];

  const options: PickPlaceOption[] = [];
  for (const slot of match.market) {
    if (!slot.cardId || !slot.kind) continue;
    for (const rotation of ROTATIONS) {
      const cells = legalCells(player.forest, {
        strictPathExclusiveDuringPlace: match.strictPathExclusiveDuringPlace,
        placingAnimal: slot.kind === "animal",
        cardId: slot.cardId,
        kind: slot.kind,
        rotation,
      });
      for (const cell of cells) {
        options.push({
          type: "pickAndPlace",
          slot: slot.slot as AdvisorSlot,
          cell,
          rotation,
        });
      }
    }
  }
  return options;
}

function resolvePendingAdvisor(
  match: InternalMatch,
  rand: () => number,
): EngineResult<InternalMatch> {
  const pending = match.pendingAdvisor;
  if (!pending) return { ok: true, state: match };
  const player = match.players.find((p) => p.id === pending.playerId);
  if (!player) {
    return { ok: false, error: "INVALID_TARGET", message: "No player for advisor" };
  }
  const animals = player.forest.filter((c) => c.kind === "animal");
  if (!animals.length) {
    return { ok: false, error: "INVALID_TARGET", message: "No animals" };
  }

  if (pending.kind === "lair") {
    const animal = pickUniform(animals, rand)!;
    return GameEngine.advisorPlaceLair(match, player.id, animal.instanceId);
  }

  const candidates = animals.flatMap((animal) =>
    openWaterFoods(animal).map((food) => ({
      animalInstanceId: animal.instanceId,
      food,
    })),
  );
  const choice = pickUniform(candidates, rand);
  if (!choice) {
    return { ok: false, error: "INVALID_TARGET", message: "No open water slots" };
  }
  return GameEngine.advisorPlaceWater(
    match,
    player.id,
    choice.animalInstanceId,
    choice.food,
  );
}

/**
 * Fully advance the current player's turn with a uniform-random legal action.
 * Resolves pending advisor first; otherwise pickAndPlace then any resulting advisor.
 */
export function autoPlayCurrentTurn(
  match: InternalMatch,
  rand: () => number,
): EngineResult<InternalMatch> {
  if (match.phase !== "turn") {
    return { ok: false, error: "WRONG_PHASE", message: "Not in turn phase" };
  }

  if (match.pendingAdvisor) {
    return resolvePendingAdvisor(match, rand);
  }

  const options = enumerateLegalPickAndPlace(match);
  const choice = pickUniform(options, rand);
  if (!choice) {
    return { ok: false, error: "ILLEGAL_PLACE", message: "No legal auto moves" };
  }

  const player = match.players.find((p) => p.seat === match.turnSeat);
  if (!player) {
    return { ok: false, error: "NOT_YOUR_TURN", message: "No turn player" };
  }

  let result = GameEngine.pickAndPlace(match, player.id, choice);
  if (!result.ok) return result;

  if (result.state.pendingAdvisor) {
    result = resolvePendingAdvisor(result.state, rand);
  }
  return result;
}
