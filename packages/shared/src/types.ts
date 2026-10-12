import { z } from "zod";

/** Food types from GAME_RULES.md §10 / FoodType. */
export const FoodSchema = z.enum(["berries", "worms", "eggs", "nuts"]);
export type Food = z.infer<typeof FoodSchema>;

/** Printed VP for one product on an animal (before droplet). */
export const FoodVpSchema = z.union([z.literal(0), z.literal(1), z.literal(2)]);
export type FoodVp = z.infer<typeof FoodVpSchema>;

export const ALL_FOODS: Food[] = ["berries", "worms", "eggs", "nuts"];

export const RotationSchema = z.union([
  z.literal(0),
  z.literal(90),
  z.literal(180),
  z.literal(270),
]);
export type Rotation = z.infer<typeof RotationSchema>;

export const EdgeSchema = z.enum(["N", "E", "S", "W"]);
export type Edge = z.infer<typeof EdgeSchema>;

export const AdvisorSlotSchema = z.enum([
  "rooster",
  "armadillo",
  "goat",
  "rabbit",
]);
export type AdvisorSlot = z.infer<typeof AdvisorSlotSchema>;

export const PhaseSchema = z.enum([
  "lobby",
  "dealing",
  "roundRefill",
  "turn",
  "betweenRounds",
  "conflictResolve",
  "scoring",
  "finished",
]);
export type Phase = z.infer<typeof PhaseSchema>;

export type CardKind = "path" | "animal";

export type PathCardDef = {
  id: string;
  kind: "path";
  connections: Edge[];
  foods: Food[];
};

export type AnimalCardDef = {
  id: string;
  kind: "animal";
  /**
   * VP for each of the 4 product types this animal eats (0 / 1 / 2).
   * Placeholder food ids until the real product list arrives.
   */
  foodValue: Record<Food, FoodVp>;
  /** Initial burrow/den capacity (max products stored before caves). */
  storage: number;
  /** Animal’s own printed VP. */
  animalPoints: 1 | 2 | 3;
  pathStart: Edge;
  /** ASCII slug for `/animals/{slug}.png` art (fan pack). */
  artSlug?: string;
};

export type CardDef = PathCardDef | AnimalCardDef;

export type Cell = { r: number; c: number };

export type PlacedCard = {
  instanceId: string;
  cardId: string;
  kind: CardKind;
  rotation: Rotation;
  cell: Cell;
  /** Cave / пещерка count — each +1 capacity; unlimited per animal. */
  lairTokens: number;
  /**
   * Droplet / капелька per product: at most one per food on this animal.
   * Value is 1 when present (boosts that product’s VP by +1 when scored).
   */
  waterBonus: Partial<Record<Food, 0 | 1>>;
};

export type PlayerPublic = {
  id: string;
  name: string;
  seat: number;
  isHost: boolean;
  connected: boolean;
  cardCount: number;
  forest: PlacedCard[];
  score?: number;
};

export type MarketSlot = {
  slot: AdvisorSlot;
  cardId: string | null;
  kind: CardKind | null;
};

export type PendingAdvisor =
  | { kind: "lair"; playerId: string }
  | { kind: "water"; playerId: string };

export type ConflictPending = {
  playerId: string;
  pathKey: string;
  animalInstanceIds: string[];
};

export type MatchState = {
  phase: Phase;
  seed: string;
  round: number;
  turnSeat: number;
  firstPlayerSeat: number;
  market: MarketSlot[];
  players: PlayerPublic[];
  /** Seats that already took a card this round. */
  actedSeatsThisRound: number[];
  pendingAdvisor: PendingAdvisor | null;
  conflicts: ConflictPending[];
  winnerPlayerId?: string;
  strictPathExclusiveDuringPlace: boolean;
};

export type AutoPlayNotice = {
  playerId: string;
  name: string;
  atMs: number;
};

export type RoomSnapshot = {
  roomCode: string;
  sharePath: string;
  maxPlayers: number;
  hostId: string;
  youPlayerId: string | null;
  match: MatchState;
  /** Room settings (timer etc.) — same for all joiners. */
  settings: {
    /** 0 = off; else seconds. Default 60. */
    turnTimerSeconds: number;
  };
  /** Epoch ms when current turn expires; null if no timer / not in turn. */
  turnDeadlineMs: number | null;
  /** Brief notice after server auto-played a turn. */
  lastAutoPlayNotice: AutoPlayNotice | null;
};

export const ClientIntentSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("setDisplayName"), name: z.string().min(1).max(24) }),
  z.object({ type: z.literal("startGame") }),
  z.object({
    type: z.literal("setTurnTimer"),
    seconds: z.number().int().min(0).max(300),
  }),
  z.object({
    type: z.literal("pickAndPlace"),
    slot: AdvisorSlotSchema,
    cell: z.object({
      r: z.number().int().min(0).max(3),
      c: z.number().int().min(0).max(3),
    }),
    rotation: RotationSchema,
  }),
  z.object({
    type: z.literal("advisorPlaceLair"),
    animalInstanceId: z.string(),
  }),
  z.object({
    type: z.literal("advisorPlaceWater"),
    animalInstanceId: z.string(),
    food: FoodSchema,
  }),
  z.object({
    type: z.literal("resolveConflict"),
    pathKey: z.string(),
    keepAnimalInstanceId: z.string(),
  }),
]);
export type ClientIntent = z.infer<typeof ClientIntentSchema>;

export type EngineErrorCode =
  | "NOT_IN_LOBBY"
  | "NOT_HOST"
  | "NOT_ENOUGH_PLAYERS"
  | "TOO_MANY_PLAYERS"
  | "NOT_YOUR_TURN"
  | "WRONG_PHASE"
  | "SLOT_EMPTY"
  | "ILLEGAL_PLACE"
  | "OUT_OF_BOUNDS"
  | "INVALID_TARGET"
  | "ADVISOR_PENDING"
  | "UNKNOWN_ACTION";

export type EngineResult<T> =
  | { ok: true; state: T }
  | { ok: false; error: EngineErrorCode; message: string };
