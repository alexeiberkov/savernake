import type {
  AdvisorSlot,
  EngineResult,
  MatchState,
  MarketSlot,
  Phase,
} from "./types.js";
import { PLACEHOLDER_ANIMALS, PLACEHOLDER_PATHS } from "./placeholder-cards.js";

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
    [arr[i], arr[j]] = [arr[j], arr[i]];
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

/**
 * Pure engine stub: lobby → dealing → empty turn table with refilled market.
 * Full pick/place/score logic lands in later turns.
 */
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
    };

    next = refillMarket(next);
    next = { ...next, phase: "turn" };
    return { ok: true, state: next };
  }

  /** No-op stub for future actions — keeps API stable. */
  static assertPhase(match: InternalMatch, phase: Phase): EngineResult<InternalMatch> {
    if (match.phase !== phase) {
      return { ok: false, error: "WRONG_PHASE", message: `Expected ${phase}` };
    }
    return { ok: true, state: match };
  }
}

export function refillMarket(match: InternalMatch): InternalMatch {
  const pathDeck = [...match.pathDeck];
  const animalDeck = [...match.animalDeck];
  const market: MarketSlot[] = ADVISOR_ORDER.map((slot) => {
    if (slot === "rabbit") {
      const cardId = animalDeck.shift() ?? null;
      return { slot, cardId, kind: cardId ? ("animal" as const) : null };
    }
    const cardId = pathDeck.shift() ?? null;
    return { slot, cardId, kind: cardId ? ("path" as const) : null };
  });
  return { ...match, market, pathDeck, animalDeck, phase: "roundRefill" };
}
