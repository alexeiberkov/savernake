import { motion } from "framer-motion";
import type { AdvisorSlot, MarketSlot } from "@savernake/shared";
import { useLocale } from "../i18n/LocaleContext";

type Props = {
  market: MarketSlot[];
  selected?: AdvisorSlot | null;
  selectable?: boolean;
  onSelect?: (slot: AdvisorSlot) => void;
};

export function MarketRow({ market, selected, selectable, onSelect }: Props) {
  const { t } = useLocale();
  return (
    <div className="market-row" aria-label={t("market")}>
      {market.map((slot, index) => {
        const canPick = Boolean(selectable && slot.cardId);
        return (
          <motion.button
            key={slot.slot}
            type="button"
            className={`market-slot${slot.cardId ? " filled" : ""}${
              selected === slot.slot ? " selected" : ""
            }`}
            disabled={!canPick}
            onClick={() => canPick && onSelect?.(slot.slot)}
            initial={{ y: 12, opacity: 0 }}
            animate={{
              y: 0,
              opacity: 1,
              scale: selected === slot.slot ? 1.04 : 1,
            }}
            transition={{ delay: index * 0.06, type: "spring", stiffness: 260 }}
            whileTap={canPick ? { scale: 0.96 } : undefined}
          >
            <span className="slot-label">{slot.slot}</span>
            {slot.cardId ? (
              <>
                {slot.cardId}
                <div className="muted">{slot.kind}</div>
              </>
            ) : (
              "—"
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
