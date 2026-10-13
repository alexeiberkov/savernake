import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ANIMAL_DECK_SIZE,
  FOREST_TARGET_CARDS,
  LAIR_TOKEN_BANK,
  PATH_DECK_SIZE,
  PATHS_PER_ROUND,
  WATER_TOKEN_BANK,
  remainingRoundsFromForests,
  remainingRoundsFromPathDeck,
} from "./component-counts.js";
import { PLACEHOLDER_ANIMALS, PLAYABLE_ANIMAL_SLUGS } from "./animal-catalog.js";
import {
  GameEngine,
  createLobbyMatch,
  toPublicMatch,
  type InternalMatch,
} from "./engine.js";
import { legalCells } from "./placement.js";
import { PLACEHOLDER_PATHS } from "./placeholder-cards.js";

function startTwoPlayer(seed: string): InternalMatch {
  let match = createLobbyMatch(seed);
  match = {
    ...match,
    players: [
      {
        id: "a",
        name: "A",
        seat: 0,
        isHost: true,
        connected: true,
        cardCount: 0,
        forest: [],
      },
      {
        id: "b",
        name: "B",
        seat: 1,
        isHost: false,
        connected: true,
        cardCount: 0,
        forest: [],
      },
    ],
  };
  const started = GameEngine.startGame(match);
  assert.equal(started.ok, true);
  if (!started.ok) throw new Error("start failed");
  return started.state;
}

describe("component inventory", () => {
  it("locks path deck 45 and animal deck 19", () => {
    assert.equal(PLACEHOLDER_PATHS.length, PATH_DECK_SIZE);
    assert.equal(PLACEHOLDER_ANIMALS.length, ANIMAL_DECK_SIZE);
    assert.equal(PLAYABLE_ANIMAL_SLUGS.length, ANIMAL_DECK_SIZE);
    assert.equal(PATH_DECK_SIZE, 45);
    assert.equal(ANIMAL_DECK_SIZE, 19);
  });

  it("starts with water/lair soft banks of 15", () => {
    assert.equal(WATER_TOKEN_BANK, 15);
    assert.equal(LAIR_TOKEN_BANK, 15);
    const state = startTwoPlayer("seed-banks");
    assert.equal(state.waterSupply, 15);
    assert.equal(state.lairSupply, 15);
    const pub = toPublicMatch(state);
    assert.equal(pub.deckSizes.waterSupply, 15);
    assert.equal(pub.deckSizes.lairSupply, 15);
    assert.equal(pub.deckSizes.pathDeck, PATH_DECK_SIZE - PATHS_PER_ROUND);
    assert.equal(
      pub.deckSizes.animalDeck,
      ANIMAL_DECK_SIZE - 2 /* starters */ - 1 /* rabbit market */,
    );
  });

  it("cannot place water when bank empty", () => {
    let state = startTwoPlayer("seed-water-empty");
    const actor = state.players.find((p) => p.seat === state.turnSeat)!;
    const animalId = actor.forest[0]!.instanceId;
    state = {
      ...state,
      waterSupply: 0,
      pendingAdvisor: { kind: "water", playerId: actor.id },
      phase: "turn",
    };
    const water = GameEngine.advisorPlaceWater(
      state,
      actor.id,
      animalId,
      "eggs",
    );
    assert.equal(water.ok, false);
  });

  it("cannot place lair when bank empty", () => {
    let state = startTwoPlayer("seed-lair-empty");
    const actor = state.players.find((p) => p.seat === state.turnSeat)!;
    const animalId = actor.forest[0]!.instanceId;
    state = {
      ...state,
      lairSupply: 0,
      pendingAdvisor: { kind: "lair", playerId: actor.id },
      phase: "turn",
    };
    const lair = GameEngine.advisorPlaceLair(state, actor.id, animalId);
    assert.equal(lair.ok, false);
  });

  it("armadillo skip pending when lair bank empty", () => {
    let state = startTwoPlayer("seed-armadillo-skip");
    const actor = state.players.find((p) => p.seat === state.turnSeat)!;
    const pathSlot = state.market.find((m) => m.slot === "armadillo");
    assert.ok(pathSlot?.cardId);
    const cell = legalCells(actor.forest, {
      strictPathExclusiveDuringPlace: false,
      placingAnimal: false,
    })[0]!;
    state = { ...state, lairSupply: 0 };
    const pick = GameEngine.pickAndPlace(state, actor.id, {
      type: "pickAndPlace",
      slot: "armadillo",
      cell,
      rotation: 0,
    });
    assert.equal(pick.ok, true);
    if (!pick.ok) return;
    assert.equal(pick.state.pendingAdvisor, null);
    assert.equal(pick.state.lairSupply, 0);
  });

  it("depletes lair bank on place", () => {
    let state = startTwoPlayer("seed-lair-deplete");
    const actor = state.players.find((p) => p.seat === state.turnSeat)!;
    const animalId = actor.forest[0]!.instanceId;
    state = {
      ...state,
      pendingAdvisor: { kind: "lair", playerId: actor.id },
      phase: "turn",
      lairSupply: 15,
    };
    const lair = GameEngine.advisorPlaceLair(state, actor.id, animalId);
    assert.equal(lair.ok, true);
    if (!lair.ok) return;
    assert.equal(lair.state.lairSupply, 14);
  });

  it("computes remaining rounds from forests and path pile", () => {
    assert.equal(remainingRoundsFromForests([{ cardCount: 1 }, { cardCount: 1 }]), 15);
    assert.equal(
      remainingRoundsFromForests([{ cardCount: FOREST_TARGET_CARDS }]),
      0,
    );
    assert.equal(remainingRoundsFromPathDeck(45), 15);
    assert.equal(remainingRoundsFromPathDeck(3), 1);
    assert.equal(remainingRoundsFromPathDeck(0), 0);
  });
});
