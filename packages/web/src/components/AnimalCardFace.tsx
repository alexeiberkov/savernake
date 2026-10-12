import {
  ANIMAL_FOOD_CORNERS,
  animalCapacity,
  type AnimalCardDef,
  type Edge,
  type Food,
  type PlacedCard,
} from "@savernake/shared";
import { animalImageSrc } from "../i18n/animal-meta";
import {
  BurrowIcon,
  CaveTokenIcon,
  DropletIcon,
  FoodIcon,
  LeafVpIcon,
} from "./card-icons";

const EDGE_CLASS: Record<Edge, string> = {
  N: "edge-n",
  E: "edge-e",
  S: "edge-s",
  W: "edge-w",
};

type Labels = {
  food: (food: Food) => string;
  animalVp: string;
  denCapacity: string;
  pathStart: string;
  dropletUpgrade: string;
  caveUpgrade: string;
};

type Props = {
  def: AnimalCardDef;
  artSlug: string;
  labels: Labels;
  lairTokens?: number;
  waterBonus?: PlacedCard["waterBonus"];
};

export function AnimalCardFace({
  def,
  artSlug,
  labels,
  lairTokens = 0,
  waterBonus = {},
}: Props) {
  const capacity = animalCapacity(def, { lairTokens });
  const capacityTitle =
    lairTokens > 0
      ? `${labels.denCapacity}: ${def.storage}+${lairTokens} = ${capacity}`
      : `${labels.denCapacity}: ${capacity}`;

  return (
    <div className="animal-face" aria-hidden>
      <span className="animal-face-art">
        <img
          className="animal-face-img"
          src={animalImageSrc(artSlug)}
          alt=""
          draggable={false}
        />
      </span>

      <span
        className={`animal-path-start ${EDGE_CLASS[def.pathStart]}`}
        title={labels.pathStart}
      />

      {ANIMAL_FOOD_CORNERS.map(({ food, corner }) => {
        const vp = def.foodValue[food];
        const hasWater = (waterBonus[food] ?? 0) > 0;
        const title = hasWater
          ? `${labels.food(food)}: ${vp}+1 → ${vp + 1}`
          : `${labels.food(food)}: ${vp}`;
        return (
          <span
            key={food}
            className={`animal-food-corner ${corner}`}
            title={title}
          >
            <FoodIcon food={food} className="animal-food-icon" />
            <span className="animal-food-vp">{vp}</span>
            {hasWater ? (
              <span
                className="animal-water-pip"
                title={`${labels.dropletUpgrade}: ${labels.food(food)}`}
              >
                <DropletIcon className="animal-droplet-icon" />
              </span>
            ) : null}
          </span>
        );
      })}

      <span
        className="animal-base-vp"
        title={`${labels.animalVp}: ${def.animalPoints}`}
      >
        <LeafVpIcon className="animal-leaf-icon" />
        <span className="animal-base-vp-num">{def.animalPoints}</span>
      </span>

      <span className="animal-burrow" title={capacityTitle}>
        <BurrowIcon className="animal-burrow-icon" />
        <span className="animal-burrow-num">{capacity}</span>
        {lairTokens > 0 ? (
          <span
            className="animal-cave-pip"
            title={`${labels.caveUpgrade} ×${lairTokens}`}
          >
            <CaveTokenIcon className="animal-cave-icon" />
            <span>×{lairTokens}</span>
          </span>
        ) : null}
      </span>
    </div>
  );
}
