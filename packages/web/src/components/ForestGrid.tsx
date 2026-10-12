import { motion } from "framer-motion";
import type { Cell, Food, PlacedCard } from "@savernake/shared";
import { useLocale } from "../i18n/LocaleContext";

type Props = {
  forest: PlacedCard[];
  legal?: Cell[];
  onPlace?: (cell: Cell) => void;
  onSelectAnimal?: (instanceId: string) => void;
  highlightAnimals?: boolean;
  waterFoodPicker?: {
    animalInstanceId: string | null;
    onPickFood: (food: Food) => void;
  };
};

const FOODS: Food[] = ["berry", "worm", "egg", "nut"];

export function ForestGrid({
  forest,
  legal = [],
  onPlace,
  onSelectAnimal,
  highlightAnimals,
  waterFoodPicker,
}: Props) {
  const { t } = useLocale();
  const byCell = new Map(forest.map((c) => [`${c.cell.r},${c.cell.c}`, c]));
  const legalSet = new Set(legal.map((c) => `${c.r},${c.c}`));

  return (
    <div className="forest-grid" aria-label={t("yourForest")}>
      {Array.from({ length: 16 }, (_, i) => {
        const r = Math.floor(i / 4);
        const c = i % 4;
        const key = `${r},${c}`;
        const card = byCell.get(key);
        const isLegal = legalSet.has(key);
        const animalClickable =
          Boolean(highlightAnimals && card?.kind === "animal" && onSelectAnimal);
        const interactive = isLegal || animalClickable;

        return (
          <motion.div
            key={key}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            className={`forest-cell${card ? " filled" : ""}${
              isLegal ? " legal" : ""
            }${animalClickable ? " targetable" : ""}`}
            onClick={() => {
              if (isLegal && onPlace) onPlace({ r, c });
              else if (animalClickable && card) onSelectAnimal?.(card.instanceId);
            }}
            onKeyDown={(e) => {
              if (!interactive) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (isLegal && onPlace) onPlace({ r, c });
                else if (animalClickable && card) onSelectAnimal?.(card.instanceId);
              }
            }}
            layout
            initial={card ? { scale: 0.85, opacity: 0 } : false}
            animate={{
              scale: 1,
              opacity: 1,
              boxShadow: isLegal
                ? "0 0 0 2px rgba(232, 192, 122, 0.85)"
                : "0 0 0 0 rgba(0,0,0,0)",
            }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            whileHover={interactive ? { scale: 1.04 } : undefined}
          >
            {card ? (
              <>
                <span className="slot-label">{card.kind}</span>
                {card.cardId}
                <div className="muted">↻ {card.rotation}°</div>
                {card.lairTokens > 0 ? (
                  <div className="muted">+{card.lairTokens} lair</div>
                ) : null}
                {waterFoodPicker?.animalInstanceId === card.instanceId ? (
                  <div className="food-picker">
                    {FOODS.map((food) => (
                      <button
                        key={food}
                        type="button"
                        className="btn ghost tiny"
                        disabled={(card.waterBonus[food] ?? 0) >= 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          waterFoodPicker.onPickFood(food);
                        }}
                      >
                        {t(food)}
                      </button>
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              t("emptyCell")
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
