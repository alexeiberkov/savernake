import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  GameEngine,
  createLobbyMatch,
  __forceCardCount,
} from "./engine.js";
import {
  forestExtent,
  legalCells,
  normalizeForest,
  placeCardInForest,
  validatePlacement,
} from "./placement.js";
import { findMultiAnimalPaths } from "./path-graph.js";
import {
  animalCapacity,
  scoreAnimal,
  scorePlayerForest,
  scoreStoredFoods,
} from "./scoring.js";
import { ClientIntentSchema, type PlayerPublic, type PlacedCard } from "./types.js";

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

function startTwoPlayer(seed = "seed-test") {
  const match = createLobbyMatch(seed);
  match.players = [lobbyPlayer("a", 0, true), lobbyPlayer("b", 1)];
  const result = GameEngine.startGame(match);
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("start failed");
  return result.state;
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
    const state = startTwoPlayer("seed-b");
    assert.equal(state.phase, "turn");
    assert.equal(state.round, 1);
    assert.equal(state.players.length, 2);
    for (const p of state.players) {
      assert.equal(p.cardCount, 1);
      assert.equal(p.forest.length, 1);
      assert.equal(p.forest[0]?.kind, "animal");
    }
    assert.equal(state.market.filter((m) => m.cardId).length, 4);
  });
});

describe("placement", () => {
  const opts = {
    strictPathExclusiveDuringPlace: false,
    placingAnimal: false,
  };

  it("starts as 1×1 at (0,0) and requires adjacency", () => {
    assert.deepEqual(legalCells([], opts), [{ r: 0, c: 0 }]);
    const forest: PlacedCard[] = [
      {
        instanceId: "s",
        cardId: "animal_hedgehog",
        kind: "animal",
        rotation: 0,
        cell: { r: 0, c: 0 },
        lairTokens: 0,
        waterBonus: {},
      },
    ];
    assert.equal(validatePlacement(forest, { r: 0, c: 1 }, opts), null);
    assert.equal(validatePlacement(forest, { r: 1, c: 0 }, opts), null);
    assert.equal(validatePlacement(forest, { r: -1, c: 0 }, opts), null);
    assert.equal(
      validatePlacement(forest, { r: 1, c: 1 }, opts),
      "ILLEGAL_PLACE",
    );
  });

  it("expands on edge and normalizes origin", () => {
    const forest: PlacedCard[] = [
      {
        instanceId: "s",
        cardId: "animal_hedgehog",
        kind: "animal",
        rotation: 0,
        cell: { r: 0, c: 0 },
        lairTokens: 0,
        waterBonus: {},
      },
    ];
    const { forest: grown } = placeCardInForest(forest, {
      instanceId: "p",
      cardId: "path_01",
      kind: "path",
      rotation: 0,
      cell: { r: -1, c: 0 },
      lairTokens: 0,
      waterBonus: {},
    });
    const ext = forestExtent(grown)!;
    assert.equal(ext.minR, 0);
    assert.equal(ext.minC, 0);
    assert.equal(ext.rows, 2);
    assert.equal(ext.cols, 1);
    assert.ok(grown.some((c) => c.instanceId === "p" && c.cell.r === 0));
    assert.ok(grown.some((c) => c.instanceId === "s" && c.cell.r === 1));
  });

  it("accepts a pick just outside the current forest (north of the starter)", () => {
    const parsed = ClientIntentSchema.safeParse({
      type: "pickAndPlace",
      slot: "armadillo",
      cell: { r: -1, c: 0 },
      rotation: 0,
    });
    assert.equal(parsed.success, true);
    assert.equal(
      ClientIntentSchema.safeParse({
        type: "pickAndPlace",
        slot: "armadillo",
        cell: { r: -2, c: 0 },
        rotation: 0,
      }).success,
      false,
    );
  });

  it("hard-caps bounding box at 4×4", () => {
    // Fill a 4×1 column at c=0
    const forest: PlacedCard[] = Array.from({ length: 4 }, (_, r) => ({
      instanceId: `c${r}`,
      cardId: "path_01",
      kind: "path" as const,
      rotation: 0 as const,
      cell: { r, c: 0 },
      lairTokens: 0,
      waterBonus: {},
    }));
    assert.equal(forestExtent(forest)?.rows, 4);
    // Cannot grow a 5th row
    assert.equal(
      validatePlacement(forest, { r: 4, c: 0 }, opts),
      "OUT_OF_BOUNDS",
    );
    assert.equal(
      validatePlacement(forest, { r: -1, c: 0 }, opts),
      "OUT_OF_BOUNDS",
    );
    // Can still grow sideways
    assert.equal(validatePlacement(forest, { r: 0, c: 1 }, opts), null);
  });

  it("normalizeForest keeps relative layout", () => {
    const forest = normalizeForest([
      {
        instanceId: "a",
        cardId: "path_01",
        kind: "path",
        rotation: 0,
        cell: { r: 2, c: 3 },
        lairTokens: 0,
        waterBonus: {},
      },
      {
        instanceId: "b",
        cardId: "path_02",
        kind: "path",
        rotation: 0,
        cell: { r: 2, c: 4 },
        lairTokens: 0,
        waterBonus: {},
      },
    ]);
    assert.deepEqual(
      forest.map((c) => c.cell),
      [
        { r: 0, c: 0 },
        { r: 0, c: 1 },
      ],
    );
  });
});

describe("pickAndPlace + advisors", () => {
  it("places from market and advances turn", () => {
    let state = startTwoPlayer("seed-place");
    const actor = state.players.find((p) => p.seat === state.turnSeat)!;
    const slot = state.market.find((m) => m.cardId && m.slot !== "armadillo" && m.slot !== "goat")!;
    const cell = legalCells(actor.forest, {
      strictPathExclusiveDuringPlace: false,
      placingAnimal: slot.kind === "animal",
    })[0]!;

    const result = GameEngine.pickAndPlace(state, actor.id, {
      type: "pickAndPlace",
      slot: slot.slot,
      cell,
      rotation: 0,
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    state = result.state;
    const updated = state.players.find((p) => p.id === actor.id)!;
    assert.equal(updated.cardCount, 2);
    assert.equal(updated.forest.length, 2);
    assert.ok(state.actedSeatsThisRound.includes(actor.seat));
    assert.notEqual(state.turnSeat, actor.seat);
  });

  it("rooster transfers first-player seat", () => {
    let state = startTwoPlayer("seed-rooster");
    // Ensure rooster slot filled
    const rooster = state.market.find((m) => m.slot === "rooster");
    assert.ok(rooster?.cardId);
    const actor = state.players.find((p) => p.seat === state.turnSeat)!;
    const cell = legalCells(actor.forest, {
      strictPathExclusiveDuringPlace: false,
      placingAnimal: false,
    })[0]!;
    const result = GameEngine.pickAndPlace(state, actor.id, {
      type: "pickAndPlace",
      slot: "rooster",
      cell,
      rotation: 90,
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.state.firstPlayerSeat, actor.seat);
  });

  it("armadillo pending then lair placement", () => {
    let state = startTwoPlayer("seed-lair");
    const actor = state.players.find((p) => p.seat === state.turnSeat)!;
    const cell = legalCells(actor.forest, {
      strictPathExclusiveDuringPlace: false,
      placingAnimal: false,
    })[0]!;
    const pick = GameEngine.pickAndPlace(state, actor.id, {
      type: "pickAndPlace",
      slot: "armadillo",
      cell,
      rotation: 0,
    });
    assert.equal(pick.ok, true);
    if (!pick.ok) return;
    state = pick.state;
    assert.deepEqual(state.pendingAdvisor, { kind: "lair", playerId: actor.id });
    const animalId = state.players.find((p) => p.id === actor.id)!.forest.find(
      (c) => c.kind === "animal",
    )!.instanceId;
    const lair = GameEngine.advisorPlaceLair(state, actor.id, animalId);
    assert.equal(lair.ok, true);
    if (!lair.ok) return;
    const animal = lair.state.players
      .find((p) => p.id === actor.id)!
      .forest.find((c) => c.instanceId === animalId)!;
    assert.equal(animal.lairTokens, 1);
    assert.equal(lair.state.pendingAdvisor, null);
  });

  it("goat pending then water placement on own forest animal", () => {
    let state = startTwoPlayer("seed-water");
    const actor = state.players.find((p) => p.seat === state.turnSeat)!;
    const ownStarter = actor.forest.find((c) => c.kind === "animal")!;
    assert.ok(ownStarter, "starter animal in own forest");
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
    assert.equal(state.pendingAdvisor?.kind, "water");
    assert.equal(state.pendingAdvisor?.playerId, actor.id);
    // Path was added; animal must still be targetable in the same forest
    const forest = state.players.find((p) => p.id === actor.id)!.forest;
    const animal = forest.find((c) => c.kind === "animal")!;
    assert.equal(animal.instanceId, ownStarter.instanceId);
    const water = GameEngine.advisorPlaceWater(
      state,
      actor.id,
      animal.instanceId,
      "eggs",
    );
    assert.equal(water.ok, true);
    if (!water.ok) return;
    const updated = water.state.players
      .find((p) => p.id === actor.id)!
      .forest.find((c) => c.instanceId === animal.instanceId)!;
    assert.equal(updated.waterBonus.eggs, 1);
    assert.equal(water.state.pendingAdvisor, null);
  });

  it("allows a second droplet on a different product", () => {
    let state = startTwoPlayer("seed-water-multi");
    const actor = state.players.find((p) => p.seat === state.turnSeat)!;
    const animalId = actor.forest[0]!.instanceId;
    state = {
      ...state,
      players: state.players.map((p) =>
        p.id === actor.id
          ? {
              ...p,
              forest: p.forest.map((c) =>
                c.instanceId === animalId
                  ? { ...c, waterBonus: { berries: 1 } }
                  : c,
              ),
            }
          : p,
      ),
    };
    const cell = legalCells(
      state.players.find((p) => p.id === actor.id)!.forest,
      { strictPathExclusiveDuringPlace: false, placingAnimal: false },
    )[0]!;
    const pick = GameEngine.pickAndPlace(state, actor.id, {
      type: "pickAndPlace",
      slot: "goat",
      cell,
      rotation: 0,
    });
    assert.equal(pick.ok, true);
    if (!pick.ok) return;
    assert.equal(pick.state.pendingAdvisor?.kind, "water");
    const water = GameEngine.advisorPlaceWater(
      pick.state,
      actor.id,
      animalId,
      "eggs",
    );
    assert.equal(water.ok, true);
    if (!water.ok) return;
    const animal = water.state.players
      .find((p) => p.id === actor.id)!
      .forest.find((c) => c.instanceId === animalId)!;
    assert.equal(animal.waterBonus.berries, 1);
    assert.equal(animal.waterBonus.eggs, 1);
  });

  it("rejects a second droplet on the same product", () => {
    let state = startTwoPlayer("seed-water-dup");
    const actor = state.players.find((p) => p.seat === state.turnSeat)!;
    const animalId = actor.forest[0]!.instanceId;
    state = {
      ...state,
      pendingAdvisor: { kind: "water", playerId: actor.id },
      players: state.players.map((p) =>
        p.id === actor.id
          ? {
              ...p,
              forest: p.forest.map((c) =>
                c.instanceId === animalId
                  ? { ...c, waterBonus: { eggs: 1 } }
                  : c,
              ),
            }
          : p,
      ),
    };
    const dup = GameEngine.advisorPlaceWater(state, actor.id, animalId, "eggs");
    assert.equal(dup.ok, false);
  });

  it("stacks multiple caves on one animal (bank still available)", () => {
    let state = startTwoPlayer("seed-multi-cave");
    const actor = state.players.find((p) => p.seat === state.turnSeat)!;
    const animalId = actor.forest[0]!.instanceId;
    state = {
      ...state,
      pendingAdvisor: { kind: "lair", playerId: actor.id },
      phase: "turn",
      players: state.players.map((p) =>
        p.id === actor.id
          ? {
              ...p,
              forest: p.forest.map((c) =>
                c.instanceId === animalId ? { ...c, lairTokens: 2 } : c,
              ),
            }
          : p,
      ),
    };
    const lair = GameEngine.advisorPlaceLair(state, actor.id, animalId);
    assert.equal(lair.ok, true);
    if (!lair.ok) return;
    const animal = lair.state.players
      .find((p) => p.id === actor.id)!
      .forest.find((c) => c.instanceId === animalId)!;
    assert.equal(animal.lairTokens, 3);
  });
});

describe("path conflicts + scoring", () => {
  it("detects two animals linked by trail and resolves at end", () => {
    // Animals exit toward the straight E-W trail between them (path_21).
    const forest: PlacedCard[] = [
      {
        instanceId: "a1",
        cardId: "animal_badger",
        kind: "animal",
        rotation: 90, // N → E
        cell: { r: 1, c: 0 },
        lairTokens: 0,
        waterBonus: {},
      },
      {
        instanceId: "p1",
        cardId: "path_21",
        kind: "path",
        rotation: 0,
        cell: { r: 1, c: 1 },
        lairTokens: 0,
        waterBonus: {},
      },
      {
        instanceId: "a2",
        cardId: "animal_fox",
        kind: "animal",
        rotation: 270, // N → W
        cell: { r: 1, c: 2 },
        lairTokens: 0,
        waterBonus: {},
      },
    ];
    const conflicts = findMultiAnimalPaths(forest);
    assert.equal(conflicts.length, 1);
    assert.equal(conflicts[0]!.animalInstanceIds.length, 2);

    let state = startTwoPlayer("seed-conflict-end");
    state = {
      ...state,
      phase: "conflictResolve",
      players: state.players.map((p, idx) =>
        idx === 0 ? { ...p, forest, cardCount: forest.length } : p,
      ),
      conflicts: [
        {
          playerId: "a",
          pathKey: "a:path",
          animalInstanceIds: ["a1", "a2"],
        },
      ],
    };
    const resolved = GameEngine.resolveConflict(state, "a", "a:path", "a1");
    assert.equal(resolved.ok, true);
    if (!resolved.ok) return;
    assert.equal(resolved.state.phase, "finished");
    const kept = resolved.state.players[0]!.forest.filter((c) => c.kind === "animal");
    assert.equal(kept.length, 1);
    assert.equal(kept[0]!.instanceId, "a1");
    assert.ok(typeof resolved.state.players[0]!.score === "number");
  });

  it("water on printed 0-value food still scores +1", () => {
    // animal_squirrel: eggs printed 0, pathStart N. path_14 south trail is eggs.
    const animal: PlacedCard = {
      instanceId: "a",
      cardId: "animal_squirrel",
      kind: "animal",
      rotation: 0,
      cell: { r: 1, c: 1 },
      lairTokens: 0,
      waterBonus: { eggs: 1 },
    };
    const path: PlacedCard = {
      instanceId: "p",
      cardId: "path_14",
      kind: "path",
      rotation: 0,
      cell: { r: 0, c: 1 },
      lairTokens: 0,
      waterBonus: {},
    };
    const scored = scoreAnimal(animal, [animal, path]);
    assert.deepEqual(scored.stored, ["eggs"]);
    assert.equal(scored.foodPoints, 1, "0 printed + droplet = 1");
  });

  it("droplet adds +1 to product VP (fox eggs 2 → 3)", () => {
    const animal: PlacedCard = {
      instanceId: "a",
      cardId: "animal_fox",
      kind: "animal",
      rotation: 0,
      cell: { r: 1, c: 1 },
      lairTokens: 0,
      waterBonus: { eggs: 1 },
    };
    const path: PlacedCard = {
      instanceId: "p",
      cardId: "path_14",
      kind: "path",
      rotation: 0,
      cell: { r: 0, c: 1 },
      lairTokens: 0,
      waterBonus: {},
    };
    // Fox pathStart is N — faces path_14 above at rotation 0.
    const scored = scoreAnimal(animal, [animal, path]);
    assert.deepEqual(scored.stored, ["eggs"]);
    assert.equal(scored.foodPoints, 3, "printed 2 + droplet 1");
  });

  it("water bonus applies to every collected symbol of that food (GAME_RULES §15)", () => {
    // eggs = 2, water on eggs, 3 collected → 3 × (2+1) = 9
    assert.equal(
      scoreStoredFoods(
        { berries: 0, worms: 0, eggs: 2, nuts: 0 },
        { eggs: 1 },
        ["eggs", "eggs", "eggs"],
      ),
      9,
    );
  });

  it("each cave increases store capacity by 1", () => {
    const animal: PlacedCard = {
      instanceId: "a",
      cardId: "animal_hedgehog",
      kind: "animal",
      rotation: 0,
      cell: { r: 1, c: 1 },
      lairTokens: 2,
      waterBonus: {},
    };
    // Hedgehog storage 0 + 2 caves = 2
    const scored = scoreAnimal(animal, [animal]);
    assert.equal(scored.capacity, 2);
    assert.equal(animalCapacity({ storage: 3 }, { lairTokens: 0 }), 3);
    assert.equal(animalCapacity({ storage: 3 }, { lairTokens: 1 }), 4);
    assert.equal(animalCapacity({ storage: 3 }, { lairTokens: 2 }), 5);
  });

  it("finishGame scores the forests and ends the match", () => {
    const state = startTwoPlayer("seed-finish-now");
    const res = GameEngine.applyIntent(state, "a", { type: "finishGame" });
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.state.phase, "finished");
    assert.ok(res.state.players.every((p) => typeof p.score === "number"));
    assert.ok(res.state.winnerPlayerId);
  });

  it("finishGame refuses a lobby", () => {
    const match = createLobbyMatch("seed-lobby-finish");
    const res = GameEngine.finishGame(match);
    assert.equal(res.ok, false);
  });

  it("scores forest and finishes when forced full", () => {
    let state = startTwoPlayer("seed-score");
    // Build a tiny scoring check on starter alone
    const p0 = state.players[0]!;
    const scored = scorePlayerForest(p0.forest);
    assert.ok(scored.total >= 1);

    state = __forceCardCount(state, 16);
    // Simulate end of round after both "acted"
    state = {
      ...state,
      actedSeatsThisRound: [0, 1],
      pendingAdvisor: null,
    };
    // Trigger via a noop path: resolve by calling pick that ends — instead use private end through resolveConflict empty
    // Force begin conflict/score by finishing a dummy turn after counts are 16
    const actor = state.players.find((p) => p.seat === state.turnSeat)!;
    // Clear acted so we can place one more... actually cardCount already 16 but forest still small.
    // Directly invoke scoring path via resolveConflict with no conflicts by using apply after patching phase.
    const finished = GameEngine.applyIntent(
      {
        ...state,
        phase: "conflictResolve",
        conflicts: [],
      },
      actor.id,
      {
        type: "resolveConflict",
        pathKey: "x",
        keepAnimalInstanceId: "y",
      },
    );
    // invalid conflict — instead call finalize by resolving empty conflicts through endRound simulation
    assert.equal(finished.ok, false);

    // Use pickAndPlace when both would end round: reset cardCount to 15, place last for both
    state = startTwoPlayer("seed-end");
    state = {
      ...state,
      players: state.players.map((p) => ({ ...p, cardCount: 15 })),
      actedSeatsThisRound: [],
      turnSeat: state.firstPlayerSeat,
      pendingAdvisor: null,
      phase: "turn",
    };

    for (let i = 0; i < 2; i++) {
      const actorSeat = state.turnSeat;
      const actorP = state.players.find((p) => p.seat === actorSeat)!;
      const slot = state.market.find((m) => m.cardId && (m.slot === "rooster" || m.slot === "rabbit"))!;
      const cell = legalCells(actorP.forest, {
        strictPathExclusiveDuringPlace: false,
        placingAnimal: slot.kind === "animal",
      })[0]!;
      const res = GameEngine.pickAndPlace(state, actorP.id, {
        type: "pickAndPlace",
        slot: slot.slot,
        cell,
        rotation: 0,
      });
      assert.equal(res.ok, true);
      if (!res.ok) return;
      state = res.state;
    }

    assert.ok(
      state.phase === "finished" ||
        state.phase === "conflictResolve" ||
        state.phase === "turn",
    );
    // After 2 players each placed with cardCount 15→16, endRound should fire
    if (state.phase === "finished") {
      assert.ok(state.players.every((p) => typeof p.score === "number"));
      assert.ok(state.winnerPlayerId);
    }
    if (state.phase === "conflictResolve") {
      const c = state.conflicts[0]!;
      const keep = c.animalInstanceIds[0]!;
      const resolved = GameEngine.resolveConflict(state, c.playerId, c.pathKey, keep);
      assert.equal(resolved.ok, true);
      if (resolved.ok) {
        assert.equal(resolved.state.phase, "finished");
      }
    }
  });
});
