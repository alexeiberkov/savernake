import { motion } from "framer-motion";
import type { MarketSlot } from "@savernake/shared";
import { useLocale } from "../i18n/LocaleContext";

type Props = {
  market: MarketSlot[];
};

export function MarketRow({ market }: Props) {
  const { t } = useLocale();
  return (
    <div className="market-row" aria-label={t("market")}>
      {market.map((slot, index) => (
        <motion.div
          key={slot.slot}
          className={`market-slot${slot.cardId ? " filled" : ""}`}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: index * 0.06, type: "spring", stiffness: 260 }}
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
        </motion.div>
      ))}
    </div>
  );
}
