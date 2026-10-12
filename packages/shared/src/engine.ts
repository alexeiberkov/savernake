import { cardDefById, PLACEHOLDER_ANIMALS, PLACEHOLDER_PATHS } from "./placeholder-cards.js";
import { findMultiAnimalPaths } from "./path-graph.js";
import { validatePlacement } from "./placement.js";
import { pickWinner, scorePlayerForest } from "./scoring.js";
import type {
  AdvisorSlot,
  ClientIntent,
  EngineResult,
  MatchState,
  MarketSlot,
  Phase,
  PlacedCard,
} from "./types.js";

const ADVISOR_ORDER: AdvisorSlot[] = ["rooster", "armadillo", "goat", "rabbit"];

export type InternalMatch = MatchState & {
  pathDeck: string[];
  animalDeck: string[];
  discard: string[];
  lairSupply: number;
  waterSupply: number;
};

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function shuffleInPlace<T>(arr: T[], seed: string): T[] {
  const rand = mulberry32(hashSeed(seed));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export function emptyMarket(): MarketSlot[] {
  return ADVISOR_ORDER.map((slot) => ({
    slot,
    cardId: null,
    kind: null,
  }));
}

export function createLobbyMatch(seed: string): InternalMatch {
  return {
    phase: "lobby",
    seed,
    round: 0,
    turnSeat: 0,
    firstPlayerSeat: 0,
    market: emptyMarket(),
    players: [],
    actedSeatsThisRound: [],
    pendingAdvisor: null,
    conflicts: [],
    strictPathExclusiveDuringPlace: false,
    pathDeck: [],
    animalDeck: [],
    discard: [],
    lairSupply: 15,
    waterSupply: 15,
  };
}

export function toPublicMatch(match: InternalMatch): MatchState {
  const {
    pathDeck: _p,
    animalDeck: _a,
    discard: _d,
    lairSupply: _l,
    waterSupply: _w,
    ...pub
  } = match;
  return pub;
}

function drawFrom(
  deck: string[],
  discard: string[],
  seed: string,
  tag: string,
): { cardId: string | null; deck: string[]; discard: string[] } {
  let d = [...deck];
  let disc = [...discard];
  if (!d.length && disc.length) {
    d = shuffleInPlace(disc, `${seed}:reshuffle:${tag}`);
    disc = [];
  }
  const cardId = d.shift() ?? null;
  return { cardId, deck: d, discard: disc };
}

export function refillMarket(match: InternalMatch): InternalMatch {
  let pathDeck = [...match.pathDeck];
  let animalDeck = [...match.animalDeck];
  let discard = [...match.discard];

  const market: MarketSlot[] = ADVISOR_ORDER.map((slot) => {
    if (slot === "rabbit") {
      const drawn = drawFrom(animalDeck, discard, match.seed, `animal-${match.round}`);
      animalDeck = drawn.deck;
      discard = drawn.discard;
      return {
        slot,
        cardId: drawn.cardId,
        kind: drawn.cardId ? ("animal" as const) : null,
      };
    }
    const drawn = drawFrom(pathDeck, discard, match.seed, `path-${match.round}-${slot}`);
    pathDeck = drawn.deck;
    discard = drawn.discard;
    return {
      slot,
      cardId: drawn.cardId,
      kind: drawn.cardId ? ("path" as const) : null,
    };
  });

  return {
    ...match,
    market,
    pathDeck,
    animalDeck,
    discard,
    phase: "roundRefill",
    actedSeatsThisRound: [],
    pendingAdvisor: null,
  };
}

/** Count water tokens already placed on a player's animals (max 1 allowed). */
export function playerWaterCount(player: { forest: PlacedCard[] }): number {
  let n = 0;
  for (const card of player.forest) {
    for (const v of Object.values(card.waterBonus)) {
      if ((v ?? 0) > 0) n += 1;
    }
  }
  return n;
}

function advanceTurn(match: InternalMatch): InternalMatch {
  const n = match.players.length;
  if (match.actedSeatsThisRound.length >= n) {
    return endRound(match);
  }
  let seat = match.turnSeat;
  for (let i = 0; i < n; i++) {
    seat = (seat + 1) % n;
    if (!match.actedSeatsThisRound.includes(seat)) {
      return { ...match, turnSeat: seat, phase: "turn", pendingAdvisor: null };
    }
  }
  return endRound(match);
}

function endRound(match: InternalMatch): InternalMatch {
  if (match.players.every((p) => p.cardCount >= 16)) {
    return beginConflictOrScore(match);
  }

  let next: InternalMatch = {
    ...match,
    phase: "betweenRounds",
    discard: [
      ...match.discard,
      ...match.market.filter((m) => m.cardId).map((m) => m.cardId!),
    ],
    market: emptyMarket(),
  };

  next = {
    ...next,
    round: next.round + 1,
  };
  next = refillMarket(next);
  next = {
    ...next,
    turnSeat: next.firstPlayerSeat,
    phase: "turn",
    actedSeatsThisRound: [],
    pendingAdvisor: null,
  };
  return next;
}

function beginConflictOrScore(match: InternalMatch): InternalMatch {
  const conflicts = match.players.flatMap((p) =>
    findMultiAnimalPaths(p.forest).map((c) => ({
      playerId: p.id,
      pathKey: `${p.id}:${c.pathKey}`,
      animalInstanceIds: c.animalInstanceIds,
    })),
  );

  if (conflicts.length) {
    return { ...match, phase: "conflictResolve", conflicts, pendingAdvisor: null };
  }
  return finalizeScores(match);
}

function finalizeScores(match: InternalMatch): InternalMatch {
  const players = match.players.map((p) => {
    const { total } = scorePlayerForest(p.forest);
    const roosterBonus = p.seat === match.firstPlayerSeat ? 1 : 0;
    return { ...p, score: total + roosterBonus };
  });
  const winnerPlayerId = pickWinner(players, match.firstPlayerSeat);
  return {
    ...match,
    phase: "finished",
    players,
    winnerPlayerId,
    conflicts: [],
    pendingAdvisor: null,
  };
}

function finishTurnAfterAdvisor(match: InternalMatch, seat: number): InternalMatch {
  const acted = [...new Set([...match.actedSeatsThisRound, seat])];
  let next: InternalMatch = {
    ...match,
    actedSeatsThisRound: acted,
    pendingAdvisor: null,
  };
  if (acted.length >= next.players.length) {
    return endRound(next);
  }
  return advanceTurn(next);
}

export class GameEngine {
  static startGame(match: InternalMatch): EngineResult<InternalMatch> {
    if (match.phase !== "lobby") {
      return { ok: false, error: "NOT_IN_LOBBY", message: "Game already started" };
    }
    if (match.players.length < 2) {
      return { ok: false, error: "NOT_ENOUGH_PLAYERS", message: "Need at least 2 players" };
    }
    if (match.players.length > 4) {
      return { ok: false, error: "TOO_MANY_PLAYERS", message: "Max 4 players" };
    }

    const pathDeck = shuffleInPlace(
      PLACEHOLDER_PATHS.map((c) => c.id),
      `${match.seed}:path`,
    );
    const animalDeck = shuffleInPlace(
      PLACEHOLDER_ANIMALS.map((c) => c.id),
      `${match.seed}:animal`,
    );

    const firstPlayerSeat = Math.floor(
      mulberry32(hashSeed(`${match.seed}:first`))() * match.players.length,
    );

    const players = match.players.map((p, seat) => {
      const starterId = animalDeck.shift();
      if (!starterId) {
        throw new Error("Not enough placeholder animals for seats");
      }
      return {
        ...p,
        seat,
        forest: [
          {
            instanceId: `${p.id}:starter`,
            cardId: starterId,
            kind: "animal" as const,
            rotation: 0 as const,
            cell: { r: 1, c: 1 },
            lairTokens: 0,
            waterBonus: {},
          },
        ],
        cardCount: 1,
      };
    });

    let next: InternalMatch = {
      ...match,
      phase: "dealing",
      pathDeck,
      animalDeck,
      discard: [],
      players,
      firstPlayerSeat,
      turnSeat: firstPlayerSeat,
      round: 1,
      actedSeatsThisRound: [],
      pendingAdvisor: null,
      conflicts: [],
    };

    next = refillMarket(next);
    next = { ...next, phase: "turn", turnSeat: firstPlayerSeat };
    return { ok: true, state: next };
  }

  static pickAndPlace(
    match: InternalMatch,
    playerId: string,
    intent: Extract<ClientIntent, { type: "pickAndPlace" }>,
  ): EngineResult<InternalMatch> {
    if (match.phase !== "turn") {
      return { ok: false, error: "WRONG_PHASE", message: "Not in turn phase" };
    }
    if (match.pendingAdvisor) {
      return { ok: false, error: "ADVISOR_PENDING", message: "Resolve advisor first" };
    }

    const player = match.players.find((p) => p.id === playerId);
    if (!player) {
      return { ok: false, error: "NOT_YOUR_TURN", message: "Unknown player" };
    }
    if (player.seat !== match.turnSeat) {
      return { ok: false, error: "NOT_YOUR_TURN", message: "Not your turn" };
    }
    if (match.actedSeatsThisRound.includes(player.seat)) {
      return { ok: false, error: "NOT_YOUR_TURN", message: "Already acted this round" };
    }

    const marketSlot = match.market.find((m) => m.slot === intent.slot);
    if (!marketSlot?.cardId || !marketSlot.kind) {
      return { ok: false, error: "SLOT_EMPTY", message: "Slot empty" };
    }

    const placeErr = validatePlacement(player.forest, intent.cell, {
      strictPathExclusiveDuringPlace: match.strictPathExclusiveDuringPlace,
      placingAnimal: marketSlot.kind === "animal",
    });
    if (placeErr === "OUT_OF_BOUNDS") {
      return { ok: false, error: "OUT_OF_BOUNDS", message: "Outside 4×4" };
    }
    if (placeErr) {
      return { ok: false, error: "ILLEGAL_PLACE", message: "Illegal placement" };
    }

    const placed: PlacedCard = {
      instanceId: `${playerId}:${marketSlot.cardId}:${player.cardCount}`,
      cardId: marketSlot.cardId,
      kind: marketSlot.kind,
      rotation: intent.rotation,
      cell: intent.cell,
      lairTokens: 0,
      waterBonus: {},
    };

    const players = match.players.map((p) =>
      p.id === playerId
        ? {
            ...p,
            forest: [...p.forest, placed],
            cardCount: p.cardCount + 1,
          }
        : p,
    );

    const market = match.market.map((m) =>
      m.slot === intent.slot ? { ...m, cardId: null, kind: null } : m,
    );

    let next: InternalMatch = {
      ...match,
      players,
      market,
    };

    // Advisor hooks
    if (intent.slot === "rooster") {
      next = { ...next, firstPlayerSeat: player.seat };
      return { ok: true, state: finishTurnAfterAdvisor(next, player.seat) };
    }
    if (intent.slot === "rabbit") {
      return { ok: true, state: finishTurnAfterAdvisor(next, player.seat) };
    }
    if (intent.slot === "armadillo") {
      if (next.lairSupply <= 0) {
        return { ok: true, state: finishTurnAfterAdvisor(next, player.seat) };
      }
      return {
        ok: true,
        state: {
          ...next,
          pendingAdvisor: { kind: "lair", playerId },
          phase: "turn",
        },
      };
    }
    if (intent.slot === "goat") {
      const updatedPlayer = next.players.find((p) => p.id === playerId)!;
      // Fan rule: at most 1 water token per player for the whole game.
      if (next.waterSupply <= 0 || playerWaterCount(updatedPlayer) >= 1) {
        return { ok: true, state: finishTurnAfterAdvisor(next, player.seat) };
      }
      return {
        ok: true,
        state: {
          ...next,
          pendingAdvisor: { kind: "water", playerId },
          phase: "turn",
        },
      };
    }

    return { ok: true, state: finishTurnAfterAdvisor(next, player.seat) };
  }

  static advisorPlaceLair(
    match: InternalMatch,
    playerId: string,
    animalInstanceId: string,
  ): EngineResult<InternalMatch> {
    if (match.phase !== "turn" || match.pendingAdvisor?.kind !== "lair") {
      return { ok: false, error: "WRONG_PHASE", message: "No lair pending" };
    }
    if (match.pendingAdvisor.playerId !== playerId) {
      return { ok: false, error: "NOT_YOUR_TURN", message: "Not your advisor" };
    }
    const player = match.players.find((p) => p.id === playerId);
    if (!player) {
      return { ok: false, error: "INVALID_TARGET", message: "No player" };
    }
    const target = player.forest.find(
      (c) => c.instanceId === animalInstanceId && c.kind === "animal",
    );
    if (!target) {
      return { ok: false, error: "INVALID_TARGET", message: "Need an animal" };
    }

    const players = match.players.map((p) =>
      p.id === playerId
        ? {
            ...p,
            forest: p.forest.map((c) =>
              c.instanceId === animalInstanceId
                ? { ...c, lairTokens: c.lairTokens + 1 }
                : c,
            ),
          }
        : p,
    );

    const next: InternalMatch = {
      ...match,
      players,
      lairSupply: Math.max(0, match.lairSupply - 1),
      pendingAdvisor: null,
    };
    return { ok: true, state: finishTurnAfterAdvisor(next, player.seat) };
  }

  static advisorPlaceWater(
    match: InternalMatch,
    playerId: string,
    animalInstanceId: string,
    food: import("./types.js").Food,
  ): EngineResult<InternalMatch> {
    if (match.phase !== "turn" || match.pendingAdvisor?.kind !== "water") {
      return { ok: false, error: "WRONG_PHASE", message: "No water pending" };
    }
    if (match.pendingAdvisor.playerId !== playerId) {
      return { ok: false, error: "NOT_YOUR_TURN", message: "Not your advisor" };
    }
    const player = match.players.find((p) => p.id === playerId);
    if (!player) {
      return { ok: false, error: "INVALID_TARGET", message: "No player" };
    }
    if (playerWaterCount(player) >= 1) {
      return {
        ok: false,
        error: "INVALID_TARGET",
        message: "Player already placed their one water token",
      };
    }
    const target = player.forest.find(
      (c) => c.instanceId === animalInstanceId && c.kind === "animal",
    );
    if (!target) {
      return { ok: false, error: "INVALID_TARGET", message: "Need an animal" };
    }
    // Water on a printed 0-value food still grants +1 (locked product rule).

    const players = match.players.map((p) =>
      p.id === playerId
        ? {
            ...p,
            forest: p.forest.map((c) =>
              c.instanceId === animalInstanceId
                ? {
                    ...c,
                    waterBonus: { [food]: 1 },
                  }
                : c,
            ),
          }
        : p,
    );

    const next: InternalMatch = {
      ...match,
      players,
      waterSupply: Math.max(0, match.waterSupply - 1),
      pendingAdvisor: null,
    };
    return { ok: true, state: finishTurnAfterAdvisor(next, player.seat) };
  }

  static resolveConflict(
    match: InternalMatch,
    playerId: string,
    pathKey: string,
    keepAnimalInstanceId: string,
  ): EngineResult<InternalMatch> {
    if (match.phase !== "conflictResolve") {
      return { ok: false, error: "WRONG_PHASE", message: "Not resolving conflicts" };
    }
    const conflict = match.conflicts.find(
      (c) => c.playerId === playerId && c.pathKey === pathKey,
    );
    if (!conflict) {
      return { ok: false, error: "INVALID_TARGET", message: "Unknown conflict" };
    }
    if (!conflict.animalInstanceIds.includes(keepAnimalInstanceId)) {
      return { ok: false, error: "INVALID_TARGET", message: "Keep must be on path" };
    }

    const drop = new Set(
      conflict.animalInstanceIds.filter((id) => id !== keepAnimalInstanceId),
    );

    const players = match.players.map((p) => {
      if (p.id !== playerId) return p;
      const forest = p.forest.filter((c) => !drop.has(c.instanceId));
      return { ...p, forest, cardCount: forest.length };
    });

    const conflicts = match.conflicts.filter(
      (c) => !(c.playerId === playerId && c.pathKey === pathKey),
    );

    let next: InternalMatch = { ...match, players, conflicts };
    if (!conflicts.length) {
      next = finalizeScores(next);
    }
    return { ok: true, state: next };
  }

  static applyIntent(
    match: InternalMatch,
    playerId: string,
    intent: ClientIntent,
  ): EngineResult<InternalMatch> {
    switch (intent.type) {
      case "startGame":
        return GameEngine.startGame(match);
      case "pickAndPlace":
        return GameEngine.pickAndPlace(match, playerId, intent);
      case "advisorPlaceLair":
        return GameEngine.advisorPlaceLair(match, playerId, intent.animalInstanceId);
      case "advisorPlaceWater":
        return GameEngine.advisorPlaceWater(
          match,
          playerId,
          intent.animalInstanceId,
          intent.food,
        );
      case "resolveConflict":
        return GameEngine.resolveConflict(
          match,
          playerId,
          intent.pathKey,
          intent.keepAnimalInstanceId,
        );
      case "setDisplayName":
        return {
          ok: true,
          state: {
            ...match,
            players: match.players.map((p) =>
              p.id === playerId
                ? { ...p, name: intent.name.trim().slice(0, 24) || p.name }
                : p,
            ),
          },
        };
      default:
        return { ok: false, error: "UNKNOWN_ACTION", message: "Unknown" };
    }
  }

  static assertPhase(match: InternalMatch, phase: Phase): EngineResult<InternalMatch> {
    if (match.phase !== phase) {
      return { ok: false, error: "WRONG_PHASE", message: `Expected ${phase}` };
    }
    return { ok: true, state: match };
  }
}

/** Test helper: force forests full to exercise end-game. */
export function __forceCardCount(match: InternalMatch, count: number): InternalMatch {
  return {
    ...match,
    players: match.players.map((p) => ({ ...p, cardCount: count })),
  };
}

export function __debugCardDef(id: string) {
  return cardDefById(id);
}
