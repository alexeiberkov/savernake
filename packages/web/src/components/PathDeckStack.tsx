import { motion } from "framer-motion";
import { PATH_DECK_SIZE } from "@savernake/shared";

type Props = {
  pathRemaining: number;
  roundsLeft: number;
  pathRoundsLeft: number;
  labels: {
    pathDeck: string;
    pathCardsLeft: string;
    roundsLeft: string;
    pathRoundsLeft: string;
  };
};

/** Visible path draw pile — layer count tracks real remaining cards (0–45). */
export function PathDeckStack({
  pathRemaining,
  roundsLeft,
  pathRoundsLeft,
  labels,
}: Props) {
  const n = Math.max(0, Math.min(PATH_DECK_SIZE, pathRemaining));
  const layers = n === 0 ? 0 : Math.max(1, Math.min(12, Math.ceil(n / 4)));
  const tip = [
    `${labels.pathCardsLeft}: ${n}/${PATH_DECK_SIZE}`,
    `${labels.roundsLeft}: ${roundsLeft}`,
    `${labels.pathRoundsLeft}: ${pathRoundsLeft}`,
  ].join(" · ");

  return (
    <div
      className="path-deck-stack"
      id="path-deck-stack"
      title={tip}
      aria-label={tip}
    >
      <span className="path-deck-label">{labels.pathDeck}</span>
      <div
        className="path-deck-body"
        style={{ ["--layers" as string]: layers }}
      >
        {n === 0 ? (
          <div className="path-deck-empty">0</div>
        ) : (
          <div className="path-deck-layers" style={{ ["--layers" as string]: layers }}>
            {Array.from({ length: layers }, (_, i) => (
              <motion.span
                key={i}
                className="path-deck-layer"
                style={{ ["--i" as string]: i }}
                layout
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
              />
            ))}
            <motion.div
              className="path-deck-face"
              key={`face-${n}-${roundsLeft}`}
              initial={{ scale: 0.96, opacity: 0.85 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <strong className="path-deck-rounds">{roundsLeft}</strong>
              <span className="path-deck-rounds-label">{labels.roundsLeft}</span>
              <span className="path-deck-cards">
                {n} {labels.pathCardsLeft}
              </span>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
