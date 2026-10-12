import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GameEngine, createLobbyMatch } from "./engine.js";
import type { PlayerPublic } from "./types.js";

function lobbyPlayer(id: string, seat: number, host = false): PlayerPublic {
  return {
    id,
    name: `P${seat}`,
    seat,
    isHost: host,
    connected: true,
    cardCount: 0,
    forest: [],
  };
}

describe("GameEngine.startGame", () => {
  it("rejects fewer than 2 players", () => {
    const match = createLobbyMatch("seed-a");
    match.players = [lobbyPlayer("a", 0, true)];
    const result = GameEngine.startGame(match);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, "NOT_ENOUGH_PLAYERS");
  });

  it("deals starters and opens turn with market", () => {
    const match = createLobbyMatch("seed-b");
    match.players = [
      lobbyPlayer("a", 0, true),
      lobbyPlayer("b", 1),
    ];
    const result = GameEngine.startGame(match);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.state.phase, "turn");
    assert.equal(result.state.round, 1);
    assert.equal(result.state.players.length, 2);
    for (const p of result.state.players) {
      assert.equal(p.cardCount, 1);
      assert.equal(p.forest.length, 1);
      assert.equal(p.forest[0]?.kind, "animal");
    }
    const filled = result.state.market.filter((m) => m.cardId);
    assert.equal(filled.length, 4);
    assert.equal(result.state.market.find((m) => m.slot === "rabbit")?.kind, "animal");
  });
});
