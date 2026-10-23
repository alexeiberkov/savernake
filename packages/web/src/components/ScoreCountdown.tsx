import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale } from "../i18n/LocaleContext";

type Props = {
  onDone: () => void;
};

const START = 3;

export function ScoreCountdown({ onDone }: Props) {
  const { t } = useLocale();
  const [n, setN] = useState(START);

  useEffect(() => {
    if (n <= 0) {
      onDone();
      return;
    }
    const id = window.setTimeout(() => setN((v) => v - 1), 1000);
    return () => window.clearTimeout(id);
  }, [n, onDone]);

  return (
    <div className="score-countdown">
      <p className="score-countdown__label">
        {t("scoringIn").replace("{n}", String(Math.max(n, 1)))}
      </p>
      <AnimatePresence mode="wait">
        <motion.span
          key={n}
          className="score-countdown__digit"
          initial={{ scale: 1.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
        >
          {Math.max(n, 1)}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
