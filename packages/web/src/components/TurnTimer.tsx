import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale } from "../i18n/LocaleContext";
import type { AutoPlayNotice } from "@savernake/shared";

type Props = {
  deadlineMs: number | null;
  timerSeconds: number;
  notice: AutoPlayNotice | null;
};

export function TurnTimer({ deadlineMs, timerSeconds, notice }: Props) {
  const { t } = useLocale();
  const [left, setLeft] = useState<number | null>(null);
  const [showNotice, setShowNotice] = useState<AutoPlayNotice | null>(null);

  useEffect(() => {
    if (deadlineMs == null || timerSeconds <= 0) {
      setLeft(null);
      return;
    }
    const tick = () => {
      setLeft(Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000)));
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [deadlineMs, timerSeconds]);

  useEffect(() => {
    if (!notice) return;
    setShowNotice(notice);
    const id = window.setTimeout(() => setShowNotice(null), 3200);
    return () => window.clearTimeout(id);
  }, [notice?.atMs, notice?.playerId]);

  if (timerSeconds <= 0 && !showNotice) return null;

  const urgent = left != null && left <= 10;

  return (
    <div className="turn-timer-wrap">
      {left != null ? (
        <motion.div
          className={`turn-timer${urgent ? " urgent" : ""}`}
          key={deadlineMs ?? "none"}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          aria-live="polite"
        >
          {t("timerLabel")}: {t("secondsLeft").replace("{n}", String(left))}
        </motion.div>
      ) : null}
      <AnimatePresence>
        {showNotice ? (
          <motion.div
            key={showNotice.atMs}
            className="auto-play-notice"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {t("autoPlayed").replace("{name}", showNotice.name)}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
