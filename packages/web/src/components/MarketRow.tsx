import { AnimatePresence, motion } from "framer-motion";
import {
  cardDefById,
  slugFromAnimalCardId,
  type AdvisorSlot,
  type MarketSlot,
} from "@savernake/shared";
import { animalMetaBySlug } from "../i18n/animal-meta";
import { useLocale } from "../i18n/LocaleContext";
import { PlaceholderCard } from "./PlaceholderCard";

type Props = {
  market: MarketSlot[];
  selected?: AdvisorSlot | null;
  selectable?: boolean;
  onSelect?: (slot: AdvisorSlot) => void;
  /** Bumps when market refills so draw-in staggers again. */
  dealKey?: string | number;
};

export function MarketRow({
  market,
  selected,
  selectable,
  onSelect,
  dealKey = 0,
}: Props) {
  const { locale, t } = useLocale();
  return (
    <div className="market-row" aria-label={t("market")}>
      {market.map((slot, index) => {
        const canPick = Boolean(selectable && slot.cardId);
        const def = slot.cardId ? cardDefById(slot.cardId) : undefined;
        const slug =
          (def?.kind === "animal" ? def.artSlug : undefined) ??
          (slot.cardId ? slugFromAnimalCardId(slot.cardId) : null);
        const animalName = animalMetaBySlug(slug)?.name[locale];
        const cardLabel = animalName ?? slot.cardId ?? "";
        return (
          <div key={slot.slot} className="market-slot-wrap">
            <span className="slot-label">{slot.slot}</span>
            <AnimatePresence mode="sync">
              {slot.cardId && slot.kind ? (
                <motion.button
                  key={`${dealKey}-${slot.cardId}`}
                  type="button"
                  className={`market-slot filled${
                    selected === slot.slot ? " selected" : ""
                  }`}
                  disabled={!canPick}
                  onClick={() => canPick && onSelect?.(slot.slot)}
                  initial={{ y: -20, opacity: 0, scale: 0.92 }}
                  animate={{
                    y: selected === slot.slot ? -4 : 0,
                    opacity: 1,
                    scale: selected === slot.slot ? 1.04 : 1,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.9,
                    transition: { duration: 0.18 },
                  }}
                  transition={{
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 280,
                    damping: 22,
                  }}
                  whileHover={canPick ? { y: -3 } : undefined}
                  whileTap={canPick ? { scale: 0.97 } : undefined}
                  aria-label={`${t("drawingCard")} ${cardLabel}`}
                >
                  <PlaceholderCard
                    cardId={slot.cardId}
                    kind={slot.kind}
                    compact
                  />
                </motion.button>
              ) : (
                <motion.div
                  key={`${slot.slot}-empty`}
                  className="market-slot empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.55 }}
                  exit={{ opacity: 0 }}
                >
                  —
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
