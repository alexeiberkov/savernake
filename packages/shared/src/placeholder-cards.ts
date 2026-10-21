import type { PathCardDef } from "./types.js";
import { PLACEHOLDER_ANIMALS } from "./animal-catalog.js";

/**
 * Physical path deck (45). Each segment is one trail between two edges.
 * Foods are listed from edges[0] toward edges[1]. A diagonal card is two
 * separate trails, not a crossing.
 */
export const PLACEHOLDER_PATHS: PathCardDef[] = [
  {
    id: "path_01",
    kind: "path",
    connections: ["N", "E"],
    foods: ["worms", "berries"],
    segments: [{ edges: ["N", "E"], foods: ["worms", "berries"] }],
  },
  {
    id: "path_02",
    kind: "path",
    connections: ["N", "E", "S", "W"],
    foods: ["worms", "worms"],
    segments: [{ edges: ["N", "E"], foods: ["worms"] }, { edges: ["S", "W"], foods: ["worms"] }],
  },
  {
    id: "path_03",
    kind: "path",
    connections: ["N", "E"],
    foods: ["nuts"],
    segments: [{ edges: ["N", "E"], foods: ["nuts"] }],
  },
  {
    id: "path_04",
    kind: "path",
    connections: ["N", "E"],
    foods: ["nuts", "worms"],
    segments: [{ edges: ["N", "E"], foods: ["nuts", "worms"] }],
  },
  {
    id: "path_05",
    kind: "path",
    connections: ["N", "E"],
    foods: ["berries", "eggs"],
    segments: [{ edges: ["N", "E"], foods: ["berries", "eggs"] }],
  },
  {
    id: "path_06",
    kind: "path",
    connections: ["E", "W"],
    foods: ["eggs", "eggs"],
    segments: [{ edges: ["E", "W"], foods: ["eggs", "eggs"] }],
  },
  {
    id: "path_07",
    kind: "path",
    connections: ["N", "E", "S", "W"],
    foods: ["berries", "berries"],
    segments: [{ edges: ["N", "E"], foods: ["berries"] }, { edges: ["S", "W"], foods: ["berries"] }],
  },
  {
    id: "path_08",
    kind: "path",
    connections: ["N", "E"],
    foods: ["eggs"],
    segments: [{ edges: ["N", "E"], foods: ["eggs"] }],
  },
  {
    id: "path_09",
    kind: "path",
    connections: ["N", "E", "S", "W"],
    foods: ["nuts", "worms"],
    segments: [{ edges: ["N", "E"], foods: ["nuts"] }, { edges: ["S", "W"], foods: ["worms"] }],
  },
  {
    id: "path_10",
    kind: "path",
    connections: ["E", "W"],
    foods: ["nuts", "nuts"],
    segments: [{ edges: ["E", "W"], foods: ["nuts", "nuts"] }],
  },
  {
    id: "path_11",
    kind: "path",
    connections: ["N", "E"],
    foods: ["berries"],
    segments: [{ edges: ["N", "E"], foods: ["berries"] }],
  },
  {
    id: "path_12",
    kind: "path",
    connections: ["N", "S"],
    foods: ["berries", "berries"],
    segments: [{ edges: ["N", "S"], foods: ["berries", "berries"] }],
  },
  {
    id: "path_13",
    kind: "path",
    connections: ["E", "W"],
    foods: ["worms", "berries"],
    segments: [{ edges: ["E", "W"], foods: ["worms", "berries"] }],
  },
  {
    id: "path_14",
    kind: "path",
    connections: ["N", "E", "S", "W"],
    foods: ["berries", "eggs"],
    segments: [{ edges: ["N", "E"], foods: ["berries"] }, { edges: ["S", "W"], foods: ["eggs"] }],
  },
  {
    id: "path_15",
    kind: "path",
    connections: ["N", "W"],
    foods: ["berries", "nuts"],
    segments: [{ edges: ["N", "W"], foods: ["berries", "nuts"] }],
  },
  {
    id: "path_16",
    kind: "path",
    connections: ["N", "E", "S", "W"],
    foods: ["berries", "berries"],
    segments: [{ edges: ["N", "E"], foods: ["berries"] }, { edges: ["S", "W"], foods: ["berries"] }],
  },
  {
    id: "path_17",
    kind: "path",
    connections: ["N", "E"],
    foods: ["eggs", "worms"],
    segments: [{ edges: ["N", "E"], foods: ["eggs", "worms"] }],
  },
  {
    id: "path_18",
    kind: "path",
    connections: ["N", "E"],
    foods: ["worms", "eggs"],
    segments: [{ edges: ["N", "E"], foods: ["worms", "eggs"] }],
  },
  {
    id: "path_19",
    kind: "path",
    connections: ["N", "E", "S", "W"],
    foods: ["worms", "worms"],
    segments: [{ edges: ["N", "E"], foods: ["worms"] }, { edges: ["S", "W"], foods: ["worms"] }],
  },
  {
    id: "path_20",
    kind: "path",
    connections: ["N", "E"],
    foods: ["worms"],
    segments: [{ edges: ["N", "E"], foods: ["worms"] }],
  },
  {
    id: "path_21",
    kind: "path",
    connections: ["E", "W"],
    foods: ["worms"],
    segments: [{ edges: ["E", "W"], foods: ["worms"] }],
  },
  {
    id: "path_22",
    kind: "path",
    connections: ["E", "W"],
    foods: ["nuts"],
    segments: [{ edges: ["E", "W"], foods: ["nuts"] }],
  },
  {
    id: "path_23",
    kind: "path",
    connections: ["E", "W"],
    foods: ["berries", "worms"],
    segments: [{ edges: ["E", "W"], foods: ["berries", "worms"] }],
  },
  {
    id: "path_24",
    kind: "path",
    connections: ["N", "E"],
    foods: ["worms", "nuts"],
    segments: [{ edges: ["N", "E"], foods: ["worms", "nuts"] }],
  },
  {
    id: "path_25",
    kind: "path",
    connections: ["N", "E", "S", "W"],
    foods: ["nuts", "berries", "eggs", "worms"],
    segments: [{ edges: ["N", "E"], foods: ["nuts", "berries"] }, { edges: ["S", "W"], foods: ["eggs", "worms"] }],
  },
  {
    id: "path_26",
    kind: "path",
    connections: ["N", "E", "S", "W"],
    foods: ["eggs", "eggs"],
    segments: [{ edges: ["N", "E"], foods: ["eggs"] }, { edges: ["S", "W"], foods: ["eggs"] }],
  },
  {
    id: "path_27",
    kind: "path",
    connections: ["N", "E"],
    foods: ["nuts", "eggs"],
    segments: [{ edges: ["N", "E"], foods: ["nuts", "eggs"] }],
  },
  {
    id: "path_28",
    kind: "path",
    connections: ["N", "E", "S", "W"],
    foods: ["nuts", "nuts"],
    segments: [{ edges: ["N", "E"], foods: ["nuts"] }, { edges: ["S", "W"], foods: ["nuts"] }],
  },
  {
    id: "path_29",
    kind: "path",
    connections: ["N", "E"],
    foods: ["eggs", "berries"],
    segments: [{ edges: ["N", "E"], foods: ["eggs", "berries"] }],
  },
  {
    id: "path_30",
    kind: "path",
    connections: ["N", "E", "S", "W"],
    foods: ["berries", "worms"],
    segments: [{ edges: ["N", "E"], foods: ["berries"] }, { edges: ["S", "W"], foods: ["worms"] }],
  },
  {
    id: "path_31",
    kind: "path",
    connections: ["E", "W"],
    foods: ["eggs"],
    segments: [{ edges: ["E", "W"], foods: ["eggs"] }],
  },
  {
    id: "path_32",
    kind: "path",
    connections: ["E", "W"],
    foods: ["nuts", "berries"],
    segments: [{ edges: ["E", "W"], foods: ["nuts", "berries"] }],
  },
  {
    id: "path_33",
    kind: "path",
    connections: ["E", "W"],
    foods: ["berries"],
    segments: [{ edges: ["E", "W"], foods: ["berries"] }],
  },
  {
    id: "path_34",
    kind: "path",
    connections: ["N", "E", "S", "W"],
    foods: ["eggs", "nuts"],
    segments: [{ edges: ["N", "E"], foods: ["eggs"] }, { edges: ["S", "W"], foods: ["nuts"] }],
  },
  {
    id: "path_35",
    kind: "path",
    connections: ["E", "W"],
    foods: ["eggs", "nuts"],
    segments: [{ edges: ["E", "W"], foods: ["eggs", "nuts"] }],
  },
  {
    id: "path_36",
    kind: "path",
    connections: ["E", "W"],
    foods: ["eggs", "nuts"],
    segments: [{ edges: ["E", "W"], foods: ["eggs", "nuts"] }],
  },
  {
    id: "path_37",
    kind: "path",
    connections: ["N", "E", "S", "W"],
    foods: ["nuts", "nuts"],
    segments: [{ edges: ["N", "E"], foods: ["nuts"] }, { edges: ["S", "W"], foods: ["nuts"] }],
  },
  {
    id: "path_38",
    kind: "path",
    connections: ["E", "W"],
    foods: ["nuts", "berries"],
    segments: [{ edges: ["E", "W"], foods: ["nuts", "berries"] }],
  },
  {
    id: "path_39",
    kind: "path",
    connections: ["E", "W"],
    foods: ["eggs", "worms"],
    segments: [{ edges: ["E", "W"], foods: ["eggs", "worms"] }],
  },
  {
    id: "path_40",
    kind: "path",
    connections: ["E", "W"],
    foods: ["worms", "eggs"],
    segments: [{ edges: ["E", "W"], foods: ["worms", "eggs"] }],
  },
  {
    id: "path_41",
    kind: "path",
    connections: ["N", "E"],
    foods: ["berries", "nuts"],
    segments: [{ edges: ["N", "E"], foods: ["berries", "nuts"] }],
  },
  {
    id: "path_42",
    kind: "path",
    connections: ["N", "E", "S", "W"],
    foods: ["berries", "nuts"],
    segments: [{ edges: ["N", "E"], foods: ["berries"] }, { edges: ["S", "W"], foods: ["nuts"] }],
  },
  {
    id: "path_43",
    kind: "path",
    connections: ["N", "E", "S", "W"],
    foods: ["eggs", "eggs"],
    segments: [{ edges: ["N", "E"], foods: ["eggs"] }, { edges: ["S", "W"], foods: ["eggs"] }],
  },
  {
    id: "path_44",
    kind: "path",
    connections: ["E", "W"],
    foods: ["worms", "worms"],
    segments: [{ edges: ["E", "W"], foods: ["worms", "worms"] }],
  },
  {
    id: "path_45",
    kind: "path",
    connections: ["N", "E", "S", "W"],
    foods: ["eggs", "worms"],
    segments: [{ edges: ["N", "E"], foods: ["eggs"] }, { edges: ["S", "W"], foods: ["worms"] }],
  },
];

export { PLACEHOLDER_ANIMALS };

/**
 * Not in the deal decks — used only for topology / compliance tests
 * (GAME_RULES §8 branching / crossing).
 */
export const TEST_ILLEGAL_PATHS: PathCardDef[] = [
  {
    id: "path_branch_test",
    kind: "path",
    connections: ["N", "E", "S"],
    foods: ["berries"],
  },
  {
    id: "path_cross_test",
    kind: "path",
    connections: ["N", "E", "S", "W"],
    foods: ["worms"],
  },
];

export function cardDefById(id: string) {
  return (
    PLACEHOLDER_PATHS.find((c) => c.id === id) ??
    PLACEHOLDER_ANIMALS.find((c) => c.id === id) ??
    TEST_ILLEGAL_PATHS.find((c) => c.id === id)
  );
}
