import {
  ANIMAL_FOOD_CORNERS,
  animalCapacity,
  type AnimalCardDef,
  type Food,
  type PlacedCard,
} from "@savernake/shared";
import { animalImageSrc } from "../i18n/animal-meta";
import { DropletIcon } from "./card-icons";

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

      {/* Printed notch is top-center; card rotation moves it with the face. */}
      <span className="animal-path-start edge-n" title={labels.pathStart} />

      {ANIMAL_FOOD_CORNERS.map(({ food, corner }) => {
        const drop = (waterBonus[food] ?? 0) > 0;
        const base = def.foodValue[food];
        const value = base + (drop ? 1 : 0);
        const title = drop
          ? `${labels.food(food)}: ${base}+1 → ${value}`
          : `${labels.food(food)}: ${value}`;
        return (
          <span key={food} className={`animal-food-live ${corner}`} title={title}>
            {value}
          </span>
        );
      })}

      {ANIMAL_FOOD_CORNERS.map(({ food, corner }) => {
        const drop = (waterBonus[food] ?? 0) > 0;
        if (!drop) return null;
        return (
          <span
            key={`${food}-drop`}
            className={`animal-food-corner ${corner}`}
            title={`${labels.dropletUpgrade}: ${labels.food(food)}`}
          >
            <span className="animal-water-pip">
              <DropletIcon className="animal-droplet-icon" />
            </span>
          </span>
        );
      })}

      <span className="animal-capacity-live" title={capacityTitle}>
        {capacity}
      </span>
    </div>
  );
}
