import { motion } from "framer-motion";
import type { PlayerPublic } from "@savernake/shared";
import { useLocale } from "../i18n/LocaleContext";
import { FireworksCanvas } from "./FireworksCanvas";

type Props = {
  players: PlayerPublic[];
  winnerPlayerId?: string;
  onPlayAgain?: () => void;
};

const RANK_STYLE = [
  {
    bg: "linear-gradient(135deg, rgba(212,161,90,0.22) 0%, rgba(232,192,122,0.08) 100%)",
    border: "rgba(212,161,90,0.75)",
    badge: "#d4a15a",
    badgeText: "#1a2e24",
    badgeSize: 52,
    nameSize: "1.55rem",
    scoreSize: "3.2rem",
    scoreColor: "#e8c07a",
    pad: "1.4rem 1.6rem",
    shadow: "0 4px 24px rgba(212,161,90,0.18)",
  },
  {
    bg: "rgba(160,175,200,0.09)",
    border: "rgba(160,175,205,0.45)",
    badge: "#9bafc8",
    badgeText: "#1a2e24",
    badgeSize: 40,
    nameSize: "1.2rem",
    scoreSize: "2.1rem",
    scoreColor: "#b8c8e0",
    pad: "1rem 1.3rem",
    shadow: "0 2px 12px rgba(0,0,0,0.12)",
  },
  {
    bg: "rgba(180,120,55,0.09)",
    border: "rgba(180,130,65,0.4)",
    badge: "#b87c40",
    badgeText: "#1a2e24",
    badgeSize: 36,
    nameSize: "1.05rem",
    scoreSize: "1.7rem",
    scoreColor: "#c8904a",
    pad: "0.85rem 1.1rem",
    shadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  {
    bg: "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.1)",
    badge: "#5a6a78",
    badgeText: "var(--text)",
    badgeSize: 30,
    nameSize: "0.95rem",
    scoreSize: "1.35rem",
    scoreColor: "var(--text-muted)",
    pad: "0.7rem 0.9rem",
    shadow: "none",
  },
];

export function ScoreReveal({ players, winnerPlayerId, onPlayAgain }: Props) {
  const { t } = useLocale();

  const ranked = [...players].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const scored = players.some((p) => typeof p.score === "number");
  const isDraw = scored && !winnerPlayerId;
  const maxScore = scored ? Math.max(...players.map((p) => p.score ?? 0)) : -Infinity;

  const getRank = (p: PlayerPublic) => {
    if (isDraw && (p.score ?? 0) === maxScore) return 0; // all draw leaders → rank 1 style
    return ranked.indexOf(p);
  };

  return (
    <>
      <FireworksCanvas />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{ maxWidth: 560, margin: "0 auto" }}
        aria-label={t("scoreReveal")}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          style={{ textAlign: "center", marginBottom: "1.75rem" }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "2.2rem",
              margin: 0,
              letterSpacing: "0.02em",
              color: "var(--amber-bright)",
            }}
          >
            {t("finished")}
          </h2>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            style={{
              margin: "0.5rem 0 0",
              fontSize: "1.1rem",
              color: "var(--text-muted)",
            }}
          >
            {isDraw ? (
              <strong style={{ color: "var(--amber-bright)" }}>
                {t("draw")}
              </strong>
            ) : (
              <>
                {t("winner")}:{" "}
                <strong style={{ color: "var(--amber-bright)" }}>
                  {players.find((p) => p.id === winnerPlayerId)?.name ?? "—"}
                </strong>
              </>
            )}
          </motion.p>
        </motion.div>

        {/* Ranking list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          {ranked.map((p, i) => {
            const rank = getRank(p);
            const s = RANK_STYLE[Math.min(rank, RANK_STYLE.length - 1)]!;
            const delay = 0.45 + i * 0.18;

            return (
              <motion.div
                key={p.id}
                initial={
                  i === 0
                    ? { opacity: 0, scale: 0.72, y: -28 }
                    : { opacity: 0, x: i % 2 === 0 ? -28 : 28 }
                }
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                transition={{
                  delay,
                  type: "spring",
                  stiffness: i === 0 ? 160 : 240,
                  damping: i === 0 ? 14 : 20,
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: s.pad,
                  borderRadius: "12px",
                  background: s.bg,
                  border: `1.5px solid ${s.border}`,
                  boxShadow: s.shadow,
                }}
              >
                {/* Place badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: delay + 0.1,
                    type: "spring",
                    stiffness: 300,
                    damping: 15,
                  }}
                  style={{
                    width: s.badgeSize,
                    height: s.badgeSize,
                    borderRadius: "50%",
                    background: s.badge,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: i === 0 ? "1.4rem" : "1rem",
                    color: s.badgeText,
                    flexShrink: 0,
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {rank + 1}
                </motion.div>

                {/* Name */}
                <span
                  style={{
                    flex: 1,
                    fontSize: s.nameSize,
                    fontWeight: i === 0 ? 700 : 500,
                    fontFamily: i === 0 ? "var(--font-display)" : undefined,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.isBot ? t("computer") : p.name}
                </span>

                {/* Score */}
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: [0.5, 1.15, 1] }}
                  transition={{ delay: delay + 0.2, duration: 0.5 }}
                  style={{
                    fontSize: s.scoreSize,
                    fontWeight: 800,
                    fontFamily: "var(--font-display)",
                    color: s.scoreColor,
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  {p.score ?? 0}
                </motion.span>
              </motion.div>
            );
          })}
        </div>

        {/* Play again */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 + ranked.length * 0.18 + 0.3 }}
          style={{ textAlign: "center", marginTop: "2rem" }}
        >
          <button
            type="button"
            className="btn"
            style={{ fontSize: "1.05rem", padding: "0.65rem 2rem" }}
            onClick={() => onPlayAgain?.()}
          >
            {t("playAgain")}
          </button>
        </motion.div>
      </motion.div>
    </>
  );
}
