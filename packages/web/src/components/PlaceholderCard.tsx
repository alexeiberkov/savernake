import { motion } from "framer-motion";
import type { CardKind, Rotation } from "@savernake/shared";

type Props = {
  cardId: string;
  kind: CardKind;
  rotation?: Rotation;
  compact?: boolean;
  className?: string;
};

/** Geometric placeholder face — not official art. */
export function PlaceholderCard({
  cardId,
  kind,
  rotation = 0,
  compact,
  className = "",
}: Props) {
  return (
    <motion.div
      className={`ph-card ${kind}${compact ? " compact" : ""} ${className}`}
      animate={{ rotate: rotation }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      layout
    >
      <span className="ph-kind">{kind}</span>
      <span className="ph-id">{cardId}</span>
      <span className="ph-mark" aria-hidden />
    </motion.div>
  );
}
