import { customAlphabet } from "nanoid";
import {
  ClientIntentSchema,
  GameEngine,
  autoPlayCurrentTurn,
  createLobbyMatch,
  defaultRoomSettings,
  mulberry32,
  normalizeDebug,
  normalizeTurnTimerSeconds,
  toPublicMatch,
  type AutoPlayNotice,
  type ClientIntent,
  type InternalMatch,
  type MatchState,
  type PlayerPublic,
  type RoomSettings,
  type RoomSnapshot,
} from "@savernake/shared";

// re-export hash helper via local mulberry — engine exports shuffle; use Date seed
function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const roomCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);
const tokenId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 24);

export type SeatSession = {
  playerId: string;
  resumeToken: string;
  socketId: string | null;
};

export type Room = {
  code: string;
  createdAt: number;
  hostId: string;
  sessions: Map<string, SeatSession>;
  resumeIndex: Map<string, string>;
  match: InternalMatch;
  settings: RoomSettings;
  turnDeadlineMs: number | null;
  lastAutoPlayNotice: AutoPlayNotice | null;
  timerHandle: ReturnType<typeof setTimeout> | null;
  autoPlaySeq: number;
};

export type TimerBroadcast = (room: Room) => void;

export class RoomManager {
  private rooms = new Map<string, Room>();
  private onTimerFire: TimerBroadcast | null = null;

  setTimerBroadcast(cb: TimerBroadcast) {
    this.onTimerFire = cb;
  }

  createRoom(
    displayName: string,
    turnTimerSeconds?: unknown,
    debug?: unknown,
  ): { room: Room; snapshot: RoomSnapshot; resumeToken: string } {
    let code = roomCode();
    while (this.rooms.has(code)) code = roomCode();

    const playerId = tokenId();
    const resumeToken = tokenId();
    const match = createLobbyMatch(`${code}-${Date.now()}`);
    const player: PlayerPublic = {
      id: playerId,
      name: displayName.trim().slice(0, 24) || "Host",
      seat: 0,
      isHost: true,
      connected: true,
      cardCount: 0,
      forest: [],
    };
    match.players = [player];
    const debugOn = normalizeDebug(debug);
    if (debugOn) {
      match.players.push({
        id: tokenId(),
        name: "Computer",
        seat: 1,
        isHost: false,
        isBot: true,
        connected: true,
        cardCount: 0,
        forest: [],
      });
    }

    const room: Room = {
      code,
      createdAt: Date.now(),
      hostId: playerId,
      sessions: new Map([[playerId, { playerId, resumeToken, socketId: null }]]),
      resumeIndex: new Map([[resumeToken, playerId]]),
      match,
      settings: {
        turnTimerSeconds: debugOn
          ? 0
          : turnTimerSeconds === undefined
            ? defaultRoomSettings().turnTimerSeconds
            : normalizeTurnTimerSeconds(turnTimerSeconds),
        debug: debugOn,
      },
      turnDeadlineMs: null,
      lastAutoPlayNotice: null,
      timerHandle: null,
      autoPlaySeq: 0,
    };
    this.rooms.set(code, room);
    return {
      room,
      resumeToken,
      snapshot: this.snapshot(room, playerId),
    };
  }

  joinRoom(
    code: string,
    displayName: string,
  ):
    | { ok: true; room: Room; snapshot: RoomSnapshot; resumeToken: string }
    | { ok: false; error: string } {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };
    if (room.match.phase !== "lobby") return { ok: false, error: "GAME_STARTED" };
    if (room.match.players.length >= 4) return { ok: false, error: "ROOM_FULL" };

    const playerId = tokenId();
    const resumeToken = tokenId();
    const seat = room.match.players.length;
    const player: PlayerPublic = {
      id: playerId,
      name: displayName.trim().slice(0, 24) || `Player ${seat + 1}`,
      seat,
      isHost: false,
      connected: true,
      cardCount: 0,
      forest: [],
    };
    room.match.players = [...room.match.players, player];
    room.sessions.set(playerId, { playerId, resumeToken, socketId: null });
    room.resumeIndex.set(resumeToken, playerId);
    return {
      ok: true,
      room,
      resumeToken,
      snapshot: this.snapshot(room, playerId),
    };
  }

  resume(
    code: string,
    resumeToken: string,
    socketId: string,
  ):
    | { ok: true; room: Room; snapshot: RoomSnapshot; playerId: string }
    | { ok: false; error: string } {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };
    const playerId = room.resumeIndex.get(resumeToken);
    if (!playerId) return { ok: false, error: "INVALID_TOKEN" };
    const session = room.sessions.get(playerId);
    if (!session) return { ok: false, error: "INVALID_TOKEN" };
    session.socketId = socketId;
    room.match.players = room.match.players.map((p) =>
      p.id === playerId ? { ...p, connected: true } : p,
    );
    return { ok: true, room, playerId, snapshot: this.snapshot(room, playerId) };
  }

  markDisconnected(socketId: string): Room | null {
    for (const room of this.rooms.values()) {
      for (const session of room.sessions.values()) {
        if (session.socketId === socketId) {
          session.socketId = null;
          room.match.players = room.match.players.map((p) =>
            p.id === session.playerId ? { ...p, connected: false } : p,
          );
          return room;
        }
      }
    }
    return null;
  }

  setTurnTimer(
    code: string,
    playerId: string,
    seconds: unknown,
  ):
    | { ok: true; room: Room }
    | { ok: false; error: string } {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };
    if (room.hostId !== playerId) return { ok: false, error: "NOT_HOST" };
    if (room.match.phase !== "lobby") return { ok: false, error: "GAME_STARTED" };
    room.settings = {
      ...room.settings,
      turnTimerSeconds: room.settings.debug
        ? 0
        : normalizeTurnTimerSeconds(seconds),
    };
    return { ok: true, room };
  }

  startGame(
    code: string,
    playerId: string,
  ):
    | { ok: true; room: Room; match: MatchState }
    | { ok: false; error: string } {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };
    if (room.hostId !== playerId) return { ok: false, error: "NOT_HOST" };
    const result = GameEngine.startGame(room.match);
    if (!result.ok) return { ok: false, error: result.error };
    room.match = result.state;
    room.lastAutoPlayNotice = null;
    if (room.settings.debug) {
      this.fastForwardRounds(room, 6); // silently play rounds 1-5, start at round 6
    }
    this.armTurnTimer(room);
    return { ok: true, room, match: toPublicMatch(room.match) };
  }

  restartGame(
    code: string,
  ):
    | { ok: true; room: Room; match: MatchState }
    | { ok: false; error: string } {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };
    if (room.match.phase !== "finished") return { ok: false, error: "WRONG_PHASE" };

    this.clearTimer(room);

    const freshMatch = createLobbyMatch(`${room.code}-${Date.now()}`);
    freshMatch.players = room.match.players.map((p) => ({
      id: p.id,
      name: p.name,
      seat: p.seat,
      isHost: p.isHost,
      ...(p.isBot ? { isBot: true as const } : {}),
      connected: p.connected,
      cardCount: 0,
      forest: [],
    }));

    room.match = freshMatch;
    room.turnDeadlineMs = null;
    room.lastAutoPlayNotice = null;

    return { ok: true, room, match: toPublicMatch(room.match) };
  }

  /** Play all turns up to (but not including) targetRound synchronously. Debug only. */
  private fastForwardRounds(room: Room, targetRound: number) {
    const MAX_STEPS = 300;
    let steps = 0;
    while (
      room.match.phase === "turn" &&
      room.match.round < targetRound &&
      steps < MAX_STEPS
    ) {
      steps += 1;
      room.autoPlaySeq += 1;
      const rand = mulberry32(
        hashSeed(
          `${room.match.seed}:prefill:${room.match.round}:${room.match.turnSeat}:${steps}`,
        ),
      );
      const r = autoPlayCurrentTurn(room.match, rand);
      if (!r.ok) break;
      room.match = r.state;
    }
  }

  applyIntent(
    code: string,
    playerId: string,
    raw: unknown,
  ):
    | { ok: true; room: Room; match: MatchState }
    | { ok: false; error: string } {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };
    const parsed = ClientIntentSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: "INVALID_INTENT" };
    const intent = parsed.data as ClientIntent;
    if (intent.type === "startGame") {
      return this.startGame(code, playerId);
    }
    if (intent.type === "finishGame" && !room.settings.debug) {
      return { ok: false, error: "NOT_DEBUG" };
    }
    if (intent.type === "restartGame") {
      return this.restartGame(code);
    }
    if (intent.type === "setTurnTimer") {
      const r = this.setTurnTimer(code, playerId, intent.seconds);
      if (!r.ok) return r;
      return { ok: true, room: r.room, match: toPublicMatch(r.room.match) };
    }
    const beforeSeat = room.match.turnSeat;
    const beforePhase = room.match.phase;
    const beforePending = room.match.pendingAdvisor?.kind ?? null;
    const beforeRound = room.match.round;
    const result = GameEngine.applyIntent(room.match, playerId, intent);
    if (!result.ok) return { ok: false, error: result.error };
    room.match = result.state;
    const turned =
      room.match.turnSeat !== beforeSeat ||
      room.match.phase !== beforePhase ||
      (room.match.pendingAdvisor?.kind ?? null) !== beforePending ||
      room.match.round !== beforeRound;
    if (turned || intent.type === "pickAndPlace" || intent.type.startsWith("advisor")) {
      this.armTurnTimer(room);
    }
    return { ok: true, room, match: toPublicMatch(room.match) };
  }

  /** Called when turn deadline fires (server-authoritative). */
  fireTurnTimeout(code: string): Room | null {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return null;
    if (room.match.phase !== "turn") {
      this.clearTimer(room);
      room.turnDeadlineMs = null;
      return room;
    }
    if (
      room.turnDeadlineMs != null &&
      Date.now() + 50 < room.turnDeadlineMs
    ) {
      // Spurious early fire — re-arm
      this.armTurnTimer(room);
      return room;
    }

    const actor = room.match.players.find((p) => p.seat === room.match.turnSeat);
    room.autoPlaySeq += 1;
    const rand = mulberry32(
      hashSeed(
        `${room.match.seed}:auto:${room.match.round}:${room.match.turnSeat}:${room.autoPlaySeq}`,
      ),
    );
    const result = autoPlayCurrentTurn(room.match, rand);
    if (!result.ok) {
      // No legal move — clear timer and leave state
      this.clearTimer(room);
      room.turnDeadlineMs = null;
      return room;
    }
    room.match = result.state;
    if (actor) {
      room.lastAutoPlayNotice = {
        playerId: actor.id,
        name: actor.name,
        atMs: Date.now(),
      };
    }
    this.armTurnTimer(room);
    return room;
  }

  private botShouldAct(room: Room): boolean {
    if (!room.settings.debug) return false;
    const { match } = room;
    const botIds = new Set(match.players.filter((p) => p.isBot).map((p) => p.id));
    if (!botIds.size) return false;
    if (match.phase === "turn") {
      if (match.pendingAdvisor) return botIds.has(match.pendingAdvisor.playerId);
      const actor = match.players.find((p) => p.seat === match.turnSeat);
      return Boolean(
        actor?.isBot && !match.actedSeatsThisRound.includes(actor.seat),
      );
    }
    if (match.phase === "conflictResolve") {
      return match.conflicts.some((c) => botIds.has(c.playerId));
    }
    return false;
  }

  /** One computer action: its turn, its advisor, or one of its path conflicts. */
  playBotTurn(code: string): Room | null {
    const room = this.rooms.get(code.toUpperCase());
    if (!room || !this.botShouldAct(room)) return room ?? null;

    const bot = room.match.players.find((p) => p.isBot);
    if (!bot) return room;
    room.autoPlaySeq += 1;
    const rand = mulberry32(
      hashSeed(
        `${room.match.seed}:bot:${room.match.round}:${room.match.turnSeat}:${room.autoPlaySeq}`,
      ),
    );

    if (room.match.phase === "conflictResolve") {
      const conflict = room.match.conflicts.find((c) => c.playerId === bot.id);
      const keep = conflict
        ? conflict.animalInstanceIds[
            Math.floor(rand() * conflict.animalInstanceIds.length)
          ]
        : undefined;
      if (!conflict || !keep) {
        this.clearTimer(room);
        return room;
      }
      const resolved = GameEngine.resolveConflict(
        room.match,
        bot.id,
        conflict.pathKey,
        keep,
      );
      if (!resolved.ok) {
        this.clearTimer(room);
        return room;
      }
      room.match = resolved.state;
      this.armTurnTimer(room);
      return room;
    }

    const result = autoPlayCurrentTurn(room.match, rand);
    if (!result.ok) {
      this.clearTimer(room);
      room.turnDeadlineMs = null;
      return room;
    }
    room.match = result.state;
    this.armTurnTimer(room);
    return room;
  }

  armTurnTimer(room: Room) {
    this.clearTimer(room);
    if (this.botShouldAct(room)) {
      room.turnDeadlineMs = null;
      const code = room.code;
      room.timerHandle = setTimeout(() => {
        const updated = this.playBotTurn(code);
        if (updated && this.onTimerFire) this.onTimerFire(updated);
      }, 700);
      return;
    }
    if (room.settings.debug) {
      room.turnDeadlineMs = null;
      return;
    }
    const secs = room.settings.turnTimerSeconds;
    if (secs <= 0 || room.match.phase !== "turn") {
      room.turnDeadlineMs = null;
      return;
    }
    const ms = secs * 1000;
    room.turnDeadlineMs = Date.now() + ms;
    const code = room.code;
    room.timerHandle = setTimeout(() => {
      const updated = this.fireTurnTimeout(code);
      if (updated && this.onTimerFire) this.onTimerFire(updated);
    }, ms);
  }

  clearTimer(room: Room) {
    if (room.timerHandle) {
      clearTimeout(room.timerHandle);
      room.timerHandle = null;
    }
  }

  get(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  snapshot(room: Room, youPlayerId: string | null): RoomSnapshot {
    return {
      roomCode: room.code,
      sharePath: `/r/${room.code}`,
      maxPlayers: 4,
      hostId: room.hostId,
      youPlayerId,
      match: toPublicMatch(room.match),
      settings: { ...room.settings },
      turnDeadlineMs: room.turnDeadlineMs,
      lastAutoPlayNotice: room.lastAutoPlayNotice
        ? { ...room.lastAutoPlayNotice }
        : null,
    };
  }
}
