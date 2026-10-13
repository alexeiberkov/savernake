import { AnimatePresence, motion } from "framer-motion";

type Props = {
  kind: "water" | "lair";
  remaining: number;
  total: number;
  label: string;
};

/** Soft bank chips beside advisor slots — shrink/remove as spent. */
export function TokenBank({ kind, remaining, total, label }: Props) {
  const safeRemaining = Math.max(0, Math.min(total, remaining));
  return (
    <div
      className={`token-bank ${kind}`}
      title={`${label}: ${safeRemaining}/${total}`}
      aria-label={`${label}: ${safeRemaining}/${total}`}
    >
      <span className="token-bank-count">
        {safeRemaining}/{total}
      </span>
      <div className="token-bank-chips" aria-hidden>
        <AnimatePresence initial={false}>
          {Array.from({ length: total }, (_, i) => {
            const spent = i >= safeRemaining;
            if (spent) return null;
            return (
              <motion.span
                key={`${kind}-${i}`}
                className={`token-chip ${kind}`}
                layout
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0, y: 6 }}
                transition={{ type: "spring", stiffness: 380, damping: 24 }}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
