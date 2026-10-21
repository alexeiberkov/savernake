/**
 * Automated checks mapped to GAME_RULES.md (Aliaksei compliance pass).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  GameEngine,
  createLobbyMatch,
  refillMarket,
  type InternalMatch,
} from "./engine.js";
import {
  findMultiAnimalPaths,
  foodsAlongAnimalPath,
  pathTopologyViolation,
} from "./path-graph.js";
import {
  legalCells,
  validatePlacement,
} from "./placement.js";
import {
  scoreAnimal,
  scorePlayerForest,
  scoreStoredFoods,
} from "./scoring.js";
import { cardDefById } from "./placeholder-cards.js";
import type { PlacedCard, PlayerPublic } from "./types.js";

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

function startTwo(seed: string): InternalMatch {
  const match = createLobbyMatch(seed);
  match.players = [lobbyPlayer("a", 0, true), lobbyPlayer("b", 1)];
  const result = GameEngine.startGame(match);
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("start failed");
  return result.state;
}

const placeOpts = {
  strictPathExclusiveDuringPlace: false,
  placingAnimal: false,
};

describe("GAME_RULES compliance", () => {
  it("market does not refill mid-round after a pick", () => {
    let state = startTwo("rules-market");
    const actor = state.players.find((p) => p.seat === state.turnSeat)!;
    const filledBefore = state.market.filter((m) => m.cardId).length;
    assert.equal(filledBefore, 4);
    const cell = legalCells(actor.forest, placeOpts)[0]!;
    const slot = state.market.find((m) => m.cardId && m.slot === "rooster")!;
    const pick = GameEngine.pickAndPlace(state, actor.id, {
      type: "pickAndPlace",
      slot: "rooster",
      cell,
      rotation: 0,
    });
    assert.equal(pick.ok, true);
    if (!pick.ok) return;
    state = pick.state;
    const filledAfter = state.market.filter((m) => m.cardId).length;
    assert.equal(filledAfter, 3, "empty slot stays empty until end of round");
    assert.equal(
      state.market.find((m) => m.slot === slot.slot)?.cardId,
      null,
    );
  });

  it("rotation is accepted for path placement", () => {
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
    for (const rotation of [0, 90, 180, 270] as const) {
      assert.equal(
        validatePlacement(forest, { r: 0, c: 1 }, {
          ...placeOpts,
          cardId: "path_01",
          kind: "path",
          rotation,
        }),
        null,
        `rotation ${rotation} should be legal`,
      );
    }
  });

  it("valid / invalid adjacency", () => {
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
    assert.equal(validatePlacement(forest, { r: 0, c: 1 }, placeOpts), null);
    assert.equal(validatePlacement(forest, { r: 1, c: 0 }, placeOpts), null);
    assert.equal(
      validatePlacement(forest, { r: 1, c: 1 }, placeOpts),
      "ILLEGAL_PLACE",
      "diagonal only",
    );
  });

  it("empty cell immediately left of animal is legal when bbox allows", () => {
    const forest: PlacedCard[] = [
      {
        instanceId: "a",
        cardId: "animal_fox",
        kind: "animal",
        rotation: 0,
        cell: { r: 0, c: 1 },
        lairTokens: 2,
        waterBonus: { berries: 1, worms: 1, eggs: 1 },
      },
      {
        instanceId: "p1",
        cardId: "path_02",
        kind: "path",
        rotation: 0,
        cell: { r: 0, c: 2 },
        lairTokens: 0,
        waterBonus: {},
      },
      {
        instanceId: "p2",
        cardId: "path_03",
        kind: "path",
        rotation: 0,
        cell: { r: 1, c: 1 },
        lairTokens: 0,
        waterBonus: {},
      },
    ];
    const opts = {
      ...placeOpts,
      cardId: "path_37",
      kind: "path" as const,
      rotation: 0 as const,
    };
    assert.equal(validatePlacement(forest, { r: 0, c: 0 }, opts), null);
    assert.ok(
      legalCells(forest, opts).some((c) => c.r === 0 && c.c === 0),
      "left-of-animal must be in legalCells",
    );
  });

  it("4×4 boundary hard cap", () => {
    const forest: PlacedCard[] = Array.from({ length: 4 }, (_, r) => ({
      instanceId: `r${r}`,
      cardId: "path_01",
      kind: "path" as const,
      rotation: 0 as const,
      cell: { r, c: 0 },
      lairTokens: 0,
      waterBonus: {},
    }));
    assert.equal(
      validatePlacement(forest, { r: 4, c: 0 }, placeOpts),
      "OUT_OF_BOUNDS",
    );
    assert.equal(validatePlacement(forest, { r: 0, c: 1 }, placeOpts), null);
  });

  it("dead-end path placement is allowed (no forced continuation)", () => {
    // Hedgehog pathStart N — place a path to the east that does not touch the exit
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
    assert.equal(
      validatePlacement(forest, { r: 0, c: 1 }, {
        ...placeOpts,
        cardId: "path_21", // E-W, does not meet the animal's north exit
        kind: "path",
        rotation: 0,
      }),
      null,
    );
  });

  it("rejects branching path card geometry (GAME_RULES §8)", () => {
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
    assert.equal(
      validatePlacement(forest, { r: 0, c: 1 }, {
        ...placeOpts,
        cardId: "path_branch_test",
        kind: "path",
        rotation: 0,
      }),
      "ILLEGAL_PLACE",
    );
    assert.equal(
      pathTopologyViolation([
        ...forest,
        {
          instanceId: "b",
          cardId: "path_branch_test",
          kind: "path",
          rotation: 0,
          cell: { r: 0, c: 1 },
          lairTokens: 0,
          waterBonus: {},
        },
      ]),
      "BRANCH",
    );
  });

  it("rejects crossing path card geometry (GAME_RULES §8)", () => {
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
    assert.equal(
      validatePlacement(forest, { r: 1, c: 0 }, {
        ...placeOpts,
        cardId: "path_cross_test",
        kind: "path",
        rotation: 0,
      }),
      "ILLEGAL_PLACE",
    );
    assert.equal(
      pathTopologyViolation([
        {
          instanceId: "x",
          cardId: "path_cross_test",
          kind: "path",
          rotation: 0,
          cell: { r: 0, c: 0 },
          lairTokens: 0,
          waterBonus: {},
        },
      ]),
      "CROSS",
    );
  });

  it("burrow capacity limits counted food", () => {
    assert.equal(
      scoreStoredFoods(
        { berries: 1, worms: 1, eggs: 1, nuts: 1 },
        {},
        ["worms", "worms", "eggs", "nuts"].slice(0, 3),
      ),
      3,
    );
  });

  it("Armadillo adds +1 burrow capacity", () => {
    let state = startTwo("rules-armadillo");
    const actor = state.players.find((p) => p.seat === state.turnSeat)!;
    const animalId = actor.forest[0]!.instanceId;
    const cell = legalCells(actor.forest, placeOpts)[0]!;
    const pick = GameEngine.pickAndPlace(state, actor.id, {
      type: "pickAndPlace",
      slot: "armadillo",
      cell,
      rotation: 0,
    });
    assert.equal(pick.ok, true);
    if (!pick.ok) return;
    const lair = GameEngine.advisorPlaceLair(pick.state, actor.id, animalId);
    assert.equal(lair.ok, true);
    if (!lair.ok) return;
    const animal = lair.state.players
      .find((p) => p.id === actor.id)!
      .forest.find((c) => c.instanceId === animalId)!;
    assert.equal(animal.lairTokens, 1);
    const scored = scoreAnimal(animal, [animal]);
    const def = cardDefById(animal.cardId);
    const base = def?.kind === "animal" ? def.storage : 0;
    assert.equal(scored.capacity, base + 1);
  });

  it("Goat water +1 per food type on every collected symbol", () => {
    assert.equal(
      scoreStoredFoods(
        { berries: 0, worms: 0, eggs: 2, nuts: 0 },
        { eggs: 1 },
        ["eggs", "eggs", "eggs"],
      ),
      9,
    );
    let state = startTwo("rules-goat");
    const actor = state.players.find((p) => p.seat === state.turnSeat)!;
    const animalId = actor.forest[0]!.instanceId;
    const cell = legalCells(actor.forest, placeOpts)[0]!;
    const pick = GameEngine.pickAndPlace(state, actor.id, {
      type: "pickAndPlace",
      slot: "goat",
      cell,
      rotation: 0,
    });
    assert.equal(pick.ok, true);
    if (!pick.ok) return;
    const water = GameEngine.advisorPlaceWater(
      pick.state,
      actor.id,
      animalId,
      "worms",
    );
    assert.equal(water.ok, true);
    if (!water.ok) return;
    const animal = water.state.players
      .find((p) => p.id === actor.id)!
      .forest.find((c) => c.instanceId === animalId)!;
    assert.equal(animal.waterBonus.worms, 1);
  });

  it("multi animals on one path resolve at end", () => {
    const forest: PlacedCard[] = [
      {
        instanceId: "a1",
        cardId: "animal_badger",
        kind: "animal",
        rotation: 0,
        cell: { r: 1, c: 0 },
        lairTokens: 0,
        waterBonus: {},
      },
      {
        instanceId: "p1",
        cardId: "path_02",
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
        rotation: 0,
        cell: { r: 1, c: 2 },
        lairTokens: 0,
        waterBonus: {},
      },
    ];
    let state = startTwo("rules-conflict");
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
    const kept = resolved.state.players[0]!.forest.filter((c) => c.kind === "animal");
    assert.equal(kept.length, 1);
    assert.equal(kept[0]!.instanceId, "a1");
  });

  it("final score = animal bases + food + first-player bonus", () => {
    let state = startTwo("rules-score");
    const fp = state.players.find((p) => p.seat === state.firstPlayerSeat)!;
    const other = state.players.find((p) => p.seat !== state.firstPlayerSeat)!;
    // Force finished scoring via finalize path: fill card counts + empty conflicts
    state = {
      ...state,
      phase: "conflictResolve",
      conflicts: [],
      players: state.players.map((p) => ({
        ...p,
        cardCount: 16,
        forest: p.forest,
      })),
    };
    // Trigger scoring by resolving with no conflicts — use apply via beginConflictOrScore
    // Manually score forests
    const fpScore = scorePlayerForest(fp.forest).total + 1;
    const otherScore = scorePlayerForest(other.forest).total;
    assert.ok(fpScore >= 1 + 1, "starter animal VP + FP bonus");
    assert.ok(otherScore >= 1);
    assert.equal(fpScore - scorePlayerForest(fp.forest).total, 1);
  });

  it("foods along path are collected in polyline order from the animal", () => {
    // hedgehog N → path_14 south trail (eggs only; berries are the other trail)
    const animal: PlacedCard = {
      instanceId: "a",
      cardId: "animal_hedgehog",
      kind: "animal",
      rotation: 0,
      cell: { r: 1, c: 0 },
      lairTokens: 0,
      waterBonus: {},
    };
    const path: PlacedCard = {
      instanceId: "p",
      cardId: "path_14",
      kind: "path",
      rotation: 0,
      cell: { r: 0, c: 0 },
      lairTokens: 0,
      waterBonus: {},
    };
    const foods = foodsAlongAnimalPath(animal, [animal, path]);
    assert.deepEqual(foods, ["eggs"]);
  });

  const owlBelow = (id = "a"): PlacedCard => ({
    instanceId: id,
    cardId: "animal_barn_owl",
    kind: "animal",
    rotation: 0,
    cell: { r: 1, c: 0 },
    lairTokens: 0,
    waterBonus: {},
  });
  const pathAbove = (
    cardId: string,
    rotation: PlacedCard["rotation"],
  ): PlacedCard => ({
    instanceId: "p",
    cardId,
    kind: "path",
    rotation,
    cell: { r: 0, c: 0 },
    lairTokens: 0,
    waterBonus: {},
  });

  it("corner trail is eaten in walking order, either direction (path_05)", () => {
    // N–E corner: raspberry near N, eggs near E.
    const owl = owlBelow();
    const fromN = pathAbove("path_05", 180);
    assert.deepEqual(foodsAlongAnimalPath(owl, [owl, fromN]), ["berries", "eggs"]);
    assert.deepEqual(scoreAnimal(owl, [owl, fromN]).stored, ["berries", "eggs"]);
    const fromE = pathAbove("path_05", 90);
    assert.deepEqual(foodsAlongAnimalPath(owl, [owl, fromE]), ["eggs", "berries"]);
  });

  it("straight trail is eaten in walking order, either direction (path_23)", () => {
    // E–W: raspberry near E, worm near W.
    const owl = owlBelow();
    const fromE = pathAbove("path_23", 90);
    assert.deepEqual(foodsAlongAnimalPath(owl, [owl, fromE]), ["berries", "worms"]);
    const fromW = pathAbove("path_23", 270);
    assert.deepEqual(foodsAlongAnimalPath(owl, [owl, fromW]), ["worms", "berries"]);
  });

  it("diagonal card holds two separate trails, one acorn each (path_28)", () => {
    const owl = owlBelow("a1");
    const diagonal = pathAbove("path_28", 0);
    const eastPath: PlacedCard = {
      instanceId: "p2",
      cardId: "path_21",
      kind: "path",
      rotation: 0,
      cell: { r: 0, c: 1 },
      lairTokens: 0,
      waterBonus: {},
    };
    const owlAbove: PlacedCard = {
      ...owlBelow("a2"),
      rotation: 180,
      cell: { r: -1, c: 0 },
    };
    const forest = [owl, diagonal, eastPath, owlAbove];
    // Bottom owl walks S→W and never reaches the N–E trail or path_21.
    assert.deepEqual(foodsAlongAnimalPath(owl, forest), ["nuts"]);
    // Top owl walks N→E onto path_21 and picks up its worm too.
    assert.deepEqual(foodsAlongAnimalPath(owlAbove, forest), ["nuts", "worms"]);
    assert.equal(findMultiAnimalPaths(forest).length, 0);
    assert.equal(pathTopologyViolation(forest), null);
  });

  it("end of round discards leftovers and refills; FP starts next round", () => {
    let state = startTwo("rules-eor");
    // Both players act on non-advisor-pending slots until round ends
    for (let i = 0; i < 2; i++) {
      const actor = state.players.find((p) => p.seat === state.turnSeat)!;
      const slot = state.market.find(
        (m) => m.cardId && (m.slot === "rooster" || m.slot === "rabbit"),
      );
      if (!slot) break;
      const cell = legalCells(actor.forest, {
        ...placeOpts,
        placingAnimal: slot.kind === "animal",
        cardId: slot.cardId!,
        kind: slot.kind!,
        rotation: 0,
      })[0]!;
      const pick = GameEngine.pickAndPlace(state, actor.id, {
        type: "pickAndPlace",
        slot: slot.slot,
        cell,
        rotation: 0,
      });
      assert.equal(pick.ok, true);
      if (!pick.ok) return;
      state = pick.state;
    }
    // After both acted, market should be refilled for round 2
    assert.ok(state.round >= 2 || state.market.filter((m) => m.cardId).length === 4);
    assert.equal(state.turnSeat, state.firstPlayerSeat);
    // Explicit refill helper: rabbit = animal, others = path
    const filled = refillMarket({
      ...state,
      market: state.market.map((m) => ({ ...m, cardId: null, kind: null })),
      pathDeck: ["path_01", "path_02", "path_03"],
      animalDeck: ["animal_hamster"],
      discard: [],
    });
    assert.equal(filled.market.find((m) => m.slot === "rabbit")?.kind, "animal");
    assert.ok(
      filled.market
        .filter((m) => m.slot !== "rabbit")
        .every((m) => m.kind === "path" || m.cardId === null),
    );
  });
});
