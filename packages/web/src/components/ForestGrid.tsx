import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Cell, Food, PlacedCard, Rotation } from "@savernake/shared";
import { useLocale } from "../i18n/LocaleContext";
import { PlaceholderCard } from "./PlaceholderCard";

type Props = {
  forest: PlacedCard[];
  legal?: Cell[];
  onPlace?: (cell: Cell) => void;
  onSelectAnimal?: (instanceId: string) => void;
  highlightAnimals?: boolean;
  /** Ghost preview on legal cells while choosing placement. */
  preview?: { cardId: string; kind: "path" | "animal"; rotation: Rotation } | null;
  waterFoodPicker?: {
    animalInstanceId: string | null;
    onPickFood: (food: Food) => void;
  };
  /** Instance ids that just arrived — stronger place motion. */
  justPlacedId?: string | null;
  onIllegal?: () => void;
};

const FOODS: Food[] = ["berry", "worm", "egg", "nut"];

export function ForestGrid({
  forest,
  legal = [],
  onPlace,
  onSelectAnimal,
  highlightAnimals,
  preview,
  waterFoodPicker,
  justPlacedId,
  onIllegal,
}: Props) {
  const { t } = useLocale();
  const byCell = new Map(forest.map((c) => [`${c.cell.r},${c.cell.c}`, c]));
  const legalSet = new Set(legal.map((c) => `${c.r},${c.c}`));
  const [shakeKey, setShakeKey] = useState<string | null>(null);
  const shakeTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (shakeTimer.current) window.clearTimeout(shakeTimer.current);
    };
  }, []);

  function flashIllegal(key: string) {
    setShakeKey(key);
    if (shakeTimer.current) window.clearTimeout(shakeTimer.current);
    shakeTimer.current = window.setTimeout(() => setShakeKey(null), 420);
  }

  return (
    <div className="forest-grid" aria-label={t("yourForest")}>
      {Array.from({ length: 16 }, (_, i) => {
        const r = Math.floor(i / 4);
        const c = i % 4;
        const key = `${r},${c}`;
        const card = byCell.get(key);
        const isLegal = legalSet.has(key);
        const animalClickable = Boolean(
          highlightAnimals && card?.kind === "animal" && onSelectAnimal,
        );
        const interactive = isLegal || animalClickable;
        const shaking = shakeKey === key;

        return (
          <motion.div
            key={key}
            role={interactive || Boolean(preview) ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            className={`forest-cell${card ? " filled" : ""}${
              isLegal ? " legal" : ""
            }${animalClickable ? " targetable" : ""}${
              shaking ? " illegal" : ""
            }`}
            onClick={() => {
              if (isLegal && onPlace) {
                onPlace({ r, c });
                return;
              }
              if (animalClickable && card) {
                onSelectAnimal?.(card.instanceId);
                return;
              }
              // Illegal / blocked click feedback when player is trying to place
              if (preview && !card) {
                flashIllegal(key);
                onIllegal?.();
              }
            }}
            onKeyDown={(e) => {
              if (!interactive) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (isLegal && onPlace) onPlace({ r, c });
                else if (animalClickable && card)
                  onSelectAnimal?.(card.instanceId);
              }
            }}
            animate={
              shaking
                ? { x: [0, -6, 6, -4, 4, 0], backgroundColor: "rgba(196,92,74,0.35)" }
                : isLegal
                  ? {
                      x: 0,
                      boxShadow: [
                        "0 0 0 1px rgba(232,192,122,0.35)",
                        "0 0 0 3px rgba(232,192,122,0.75)",
                        "0 0 0 1px rgba(232,192,122,0.35)",
                      ],
                    }
                  : { x: 0, boxShadow: "0 0 0 0 rgba(0,0,0,0)" }
            }
            transition={
              shaking
                ? { duration: 0.4 }
                : isLegal
                  ? { boxShadow: { duration: 1.6, repeat: Infinity } }
                  : { type: "spring", stiffness: 320, damping: 22 }
            }
            whileHover={interactive ? { scale: 1.03 } : undefined}
          >
            <AnimatePresence mode="popLayout">
              {card ? (
                <motion.div
                  key={card.instanceId}
                  className="forest-card-slot"
                  initial={
                    card.instanceId === justPlacedId
                      ? { y: -48, opacity: 0, scale: 0.55, rotate: -12 }
                      : { opacity: 0, scale: 0.92 }
                  }
                  animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                >
                  <PlaceholderCard
                    cardId={card.cardId}
                    kind={card.kind}
                    rotation={card.rotation}
                    compact
                  />
                  {card.lairTokens > 0 ? (
                    <div className="muted tiny">+{card.lairTokens} lair</div>
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
                </motion.div>
              ) : isLegal && preview ? (
                <motion.div
                  key={`ghost-${preview.cardId}-${preview.rotation}`}
                  className="forest-ghost"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.45 }}
                  exit={{ opacity: 0 }}
                >
                  <PlaceholderCard
                    cardId={preview.cardId}
                    kind={preview.kind}
                    rotation={preview.rotation}
                    compact
                  />
                </motion.div>
              ) : (
                <motion.span
                  key="empty"
                  className="muted"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                >
                  {t("emptyCell")}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
