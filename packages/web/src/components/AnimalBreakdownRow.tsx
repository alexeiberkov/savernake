import { scoreAnimal, cardDefById, foodsAlongAnimalPath } from "@savernake/shared";
import type { PlacedCard } from "@savernake/shared";
import { useLocale } from "../i18n/LocaleContext";

type Props = {
  animal: PlacedCard;
  forest: PlacedCard[];
};

export function AnimalBreakdownRow({ animal, forest }: Props) {
  const { t } = useLocale();
  const breakdown = scoreAnimal(animal, forest);
  const def = cardDefById(animal.cardId);
  const allFoodsOnPath = foodsAlongAnimalPath(animal, forest);
  const total = breakdown.animalPoints + breakdown.foodPoints;

  return (
    <div className="animal-breakdown-row">
      <div className="animal-breakdown-row__header">
        <strong>{animal.cardId}</strong>
        <span className="animal-breakdown-row__total">{total} {t("score")}</span>
      </div>
      <div className="animal-breakdown-row__detail">
        <span>🍃 {breakdown.animalPoints}</span>
        {allFoodsOnPath.map((food, i) => {
          const withinCapacity = i < breakdown.capacity;
          const hasDroplet = withinCapacity && (animal.waterBonus[food] ?? 0) > 0;
          const base = def?.kind === "animal" ? (def.foodValue[food] ?? 0) : 0;
          const pts = withinCapacity ? base + (hasDroplet ? 1 : 0) : 0;
          return (
            <span
              key={i}
              className={`animal-breakdown-row__food${!withinCapacity ? " animal-breakdown-row__overflow" : ""}`}
            >
              {t(food)} {pts > 0 ? `+${pts}` : "×0"}{hasDroplet ? " 💧" : ""}
            </span>
          );
        })}
        {allFoodsOnPath.length > breakdown.capacity && (
          <span className="muted animal-breakdown-row__capacity-note">
            {t("capacityStop")}
          </span>
        )}
      </div>
    </div>
  );
}
