import { motion } from "framer-motion";
import type { PlacedCard } from "@savernake/shared";
import { useLocale } from "../i18n/LocaleContext";

type Props = {
  forest: PlacedCard[];
};

export function ForestGrid({ forest }: Props) {
  const { t } = useLocale();
  const byCell = new Map(forest.map((c) => [`${c.cell.r},${c.cell.c}`, c]));

  return (
    <div className="forest-grid" aria-label={t("yourForest")}>
      {Array.from({ length: 16 }, (_, i) => {
        const r = Math.floor(i / 4);
        const c = i % 4;
        const card = byCell.get(`${r},${c}`);
        return (
          <motion.div
            key={`${r}-${c}`}
            className={`forest-cell${card ? " filled" : ""}`}
            layout
            initial={card ? { scale: 0.85, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            whileHover={card ? { scale: 1.03 } : undefined}
          >
            {card ? (
              <>
                <span className="slot-label">{card.kind}</span>
                {card.cardId}
                <div className="muted">↻ {card.rotation}°</div>
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
