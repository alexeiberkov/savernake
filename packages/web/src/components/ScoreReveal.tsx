import { motion } from "framer-motion";
import type { PlayerPublic } from "@savernake/shared";
import { useLocale } from "../i18n/LocaleContext";

type Props = {
  players: PlayerPublic[];
  winnerPlayerId?: string;
};

export function ScoreReveal({ players, winnerPlayerId }: Props) {
  const { t } = useLocale();
  const ranked = [...players].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return (
    <div className="score-reveal" aria-label={t("scoreReveal")}>
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {t("finished")}
      </motion.h2>
      <motion.p
        className="winner-line"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      >
        {t("winner")}:{" "}
        <strong>
          {players.find((p) => p.id === winnerPlayerId)?.name ?? "—"}
        </strong>
      </motion.p>
      <ul className="score-list">
        {ranked.map((p, i) => (
          <motion.li
            key={p.id}
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 0.35 + i * 0.12,
              type: "spring",
              stiffness: 240,
              damping: 20,
            }}
            className={p.id === winnerPlayerId ? "is-winner" : undefined}
          >
            <span>{p.name}</span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.12 }}
            >
              {t("score")}{" "}
              <motion.strong
                initial={{ scale: 0.6 }}
                animate={{ scale: [0.6, 1.12, 1] }}
                transition={{ delay: 0.55 + i * 0.12, duration: 0.45 }}
              >
                {p.score ?? 0}
              </motion.strong>
            </motion.span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
