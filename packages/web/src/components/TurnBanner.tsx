import { AnimatePresence, motion } from "framer-motion";
import { useLocale } from "../i18n/LocaleContext";

type Props = {
  active: boolean;
  isMyTurn: boolean;
  playerName?: string;
};

export function TurnBanner({ active, isMyTurn, playerName }: Props) {
  const { t } = useLocale();
  if (!active) return null;

  const label = isMyTurn
    ? t("turnBannerYours")
    : t("turnBannerOther").replace("{name}", playerName ?? "…");

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={isMyTurn ? "mine" : `other-${playerName}`}
        className={`turn-banner${isMyTurn ? " mine" : ""}`}
        initial={{ opacity: 0, y: -14, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
      >
        {label}
      </motion.div>
    </AnimatePresence>
  );
}
