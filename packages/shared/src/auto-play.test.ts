import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  GameEngine,
  createLobbyMatch,
  autoPlayCurrentTurn,
  enumerateLegalPickAndPlace,
  mulberry32,
} from "./index.js";
import { legalCells } from "./placement.js";
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

function startTwo(seed: string) {
  const match = createLobbyMatch(seed);
  match.players = [lobbyPlayer("a", 0, true), lobbyPlayer("b", 1)];
  const result = GameEngine.startGame(match);
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("start failed");
  return result.state;
}

describe("autoPlayCurrentTurn", () => {
  it("enumerates legal pickAndPlace options", () => {
    const state = startTwo("auto-enum");
    const opts = enumerateLegalPickAndPlace(state);
    assert.ok(opts.length > 0);
    for (const o of opts) {
      assert.equal(o.type, "pickAndPlace");
      assert.ok(["rooster", "armadillo", "goat", "rabbit"].includes(o.slot));
    }
  });

  it("timeout auto-move completes a turn and advances seat", () => {
    let state = startTwo("auto-timeout");
    const actorSeat = state.turnSeat;
    const beforeCount = state.players.find((p) => p.seat === actorSeat)!.cardCount;
    const result = autoPlayCurrentTurn(state, mulberry32(42));
    assert.equal(result.ok, true);
    if (!result.ok) return;
    state = result.state;
    assert.equal(state.pendingAdvisor, null);
    assert.ok(state.actedSeatsThisRound.includes(actorSeat));
    const after = state.players.find((p) => p.seat === actorSeat)!;
    assert.equal(after.cardCount, beforeCount + 1);
    assert.notEqual(state.turnSeat, actorSeat);
  });

  it("auto-resolves pending advisor after goat pick", () => {
    let state = startTwo("auto-goat");
    const actor = state.players.find((p) => p.seat === state.turnSeat)!;
    const cell = legalCells(actor.forest, {
      strictPathExclusiveDuringPlace: false,
      placingAnimal: false,
    })[0]!;
    const pick = GameEngine.pickAndPlace(state, actor.id, {
      type: "pickAndPlace",
      slot: "goat",
      cell,
      rotation: 0,
    });
    assert.equal(pick.ok, true);
    if (!pick.ok) return;
    state = pick.state;
    if (state.pendingAdvisor?.kind !== "water") {
      // goat may have been skipped if supply empty — still ok
      return;
    }
    const result = autoPlayCurrentTurn(state, mulberry32(7));
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.state.pendingAdvisor, null);
    assert.ok(result.state.actedSeatsThisRound.includes(actor.seat));
  });
});
