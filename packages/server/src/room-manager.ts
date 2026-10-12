import { customAlphabet } from "nanoid";
import {
  GameEngine,
  createLobbyMatch,
  toPublicMatch,
  type InternalMatch,
  type MatchState,
  type PlayerPublic,
  type RoomSnapshot,
} from "@savernake/shared";

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
  sessions: Map<string, SeatSession>; // playerId -> session
  resumeIndex: Map<string, string>; // resumeToken -> playerId
  match: InternalMatch;
};

function publicPlayers(room: Room): PlayerPublic[] {
  return room.match.players;
}

export class RoomManager {
  private rooms = new Map<string, Room>();

  createRoom(displayName: string): { room: Room; snapshot: RoomSnapshot; resumeToken: string } {
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

    const room: Room = {
      code,
      createdAt: Date.now(),
      hostId: playerId,
      sessions: new Map([
        [playerId, { playerId, resumeToken, socketId: null }],
      ]),
      resumeIndex: new Map([[resumeToken, playerId]]),
      match,
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

  bindSocket(code: string, playerId: string, socketId: string): Room | null {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return null;
    const session = room.sessions.get(playerId);
    if (!session) return null;
    session.socketId = socketId;
    room.match.players = room.match.players.map((p) =>
      p.id === playerId ? { ...p, connected: true } : p,
    );
    return room;
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

  startGame(code: string, playerId: string):
    | { ok: true; room: Room; match: MatchState }
    | { ok: false; error: string } {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };
    if (room.hostId !== playerId) return { ok: false, error: "NOT_HOST" };
    const result = GameEngine.startGame(room.match);
    if (!result.ok) return { ok: false, error: result.error };
    room.match = result.state;
    return { ok: true, room, match: toPublicMatch(room.match) };
  }

  rename(code: string, playerId: string, name: string): Room | null {
    const room = this.rooms.get(code.toUpperCase());
    if (!room || room.match.phase !== "lobby") return null;
    room.match.players = room.match.players.map((p) =>
      p.id === playerId ? { ...p, name: name.trim().slice(0, 24) || p.name } : p,
    );
    return room;
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
    };
  }

  // silence unused in stub builds
  debugPlayerCount(room: Room): number {
    return publicPlayers(room).length;
  }
}
