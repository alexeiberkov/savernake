import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  forestExtent,
  type Cell,
  type PlacedCard,
  type Rotation,
} from "@savernake/shared";
import { useLocale } from "../i18n/LocaleContext";
import { PlaceholderCard } from "./PlaceholderCard";

type Props = {
  forest: PlacedCard[];
  legal?: Cell[];
  onPlace?: (cell: Cell) => void;
  onSelectAnimal?: (instanceId: string) => void;
  /** Animal instance ids that are valid advisor targets. */
  targetAnimalIds?: string[];
  /** Ghost preview on legal cells while choosing placement. */
  preview?: { cardId: string; kind: "path" | "animal"; rotation: Rotation } | null;
  /** Pinned preview cell — shows a stronger ghost at this specific cell. */
  previewCell?: { r: number; c: number } | null;
  /** Selected animal waiting for product choice (droplet). */
  selectedAnimalId?: string | null;
  /** Instance ids that just arrived — stronger place motion. */
  justPlacedId?: string | null;
  onIllegal?: () => void;
  /** Override the aria-label (defaults to t("yourForest")). */
  label?: string;
  /** Cards to highlight with a gold glow (scoring walk). */
  highlightedInstanceIds?: ReadonlySet<string>;
  /** When true, filled cells not in highlightedInstanceIds are dimmed. */
  scoringActive?: boolean;
};

export function ForestGrid({
  forest,
  legal = [],
  onPlace,
  onSelectAnimal,
  targetAnimalIds = [],
  preview,
  previewCell = null,
  selectedAnimalId = null,
  justPlacedId,
  onIllegal,
  label,
  highlightedInstanceIds,
  scoringActive = false,
}: Props) {
  const { t } = useLocale();
  const byCell = new Map(forest.map((c) => [`${c.cell.r},${c.cell.c}`, c]));
  const legalSet = new Set(legal.map((c) => `${c.r},${c.c}`));
  const targetSet = new Set(targetAnimalIds);
  const [shakeKey, setShakeKey] = useState<string | null>(null);
  const shakeTimer = useRef<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [cellPx, setCellPx] = useState(120);

  const bounds = useMemo(() => {
    const cells = [
      ...forest.map((c) => c.cell),
      ...legal,
    ];
    if (!cells.length) {
      // Empty forest awaiting first place — show a single ghost cell at (0,0)
      return { minR: 0, maxR: 0, minC: 0, maxC: 0, rows: 1, cols: 1 };
    }
    let minR = Infinity;
    let maxR = -Infinity;
    let minC = Infinity;
    let maxC = -Infinity;
    for (const cell of cells) {
      minR = Math.min(minR, cell.r);
      maxR = Math.max(maxR, cell.r);
      minC = Math.min(minC, cell.c);
      maxC = Math.max(maxC, cell.c);
    }
    return {
      minR,
      maxR,
      minC,
      maxC,
      rows: maxR - minR + 1,
      cols: maxC - minC + 1,
    };
  }, [forest, legal]);

  const occupiedExt = forestExtent(forest);

  useEffect(() => {
    return () => {
      if (shakeTimer.current) window.clearTimeout(shakeTimer.current);
    };
  }, []);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const maxCell = 260;
    const fit = () => {
      const parent = el.parentElement;
      const width = parent?.clientWidth ?? el.clientWidth;
      const gap = Number.parseFloat(getComputedStyle(el).columnGap) || 0;
      const byW = (width - gap * Math.max(0, bounds.cols - 1)) / bounds.cols;
      // Keep the whole grid inside about 85% of the screen height.
      const budget = Math.min(window.innerHeight * 0.85, 820);
      const byH = (budget - gap * Math.max(0, bounds.rows - 1)) / bounds.rows;
      const next = Math.round(Math.min(maxCell, byW, byH));
      setCellPx((prev) => (prev === next ? prev : next));
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (el.parentElement) ro.observe(el.parentElement);
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [bounds.cols, bounds.rows]);

  function flashIllegal(key: string) {
    setShakeKey(key);
    if (shakeTimer.current) window.clearTimeout(shakeTimer.current);
    shakeTimer.current = window.setTimeout(() => setShakeKey(null), 420);
  }

  const cellCoords: Cell[] = [];
  for (let r = bounds.minR; r <= bounds.maxR; r++) {
    for (let c = bounds.minC; c <= bounds.maxC; c++) {
      cellCoords.push({ r, c });
    }
  }

  return (
    <div
      ref={gridRef}
      className="forest-grid"
      aria-label={label ?? t("yourForest")}
      style={{
        gridTemplateColumns: `repeat(${bounds.cols}, ${cellPx}px)`,
        gridTemplateRows: `repeat(${bounds.rows}, ${cellPx}px)`,
      }}
      data-extent={
        occupiedExt
          ? `${occupiedExt.rows}x${occupiedExt.cols}`
          : "0x0"
      }
    >
      {cellCoords.map(({ r, c }) => {
        const key = `${r},${c}`;
        const card = byCell.get(key);
        const isLegal = legalSet.has(key);
        const isPinned = Boolean(previewCell && previewCell.r === r && previewCell.c === c);
        const animalClickable = Boolean(
          card?.kind === "animal" &&
            targetSet.has(card.instanceId) &&
            onSelectAnimal,
        );
        const selected = Boolean(
          card && selectedAnimalId === card.instanceId,
        );
        const interactive = isLegal || animalClickable;
        const shaking = shakeKey === key;
        const inOccupied =
          occupiedExt != null &&
          r >= occupiedExt.minR &&
          r <= occupiedExt.maxR &&
          c >= occupiedExt.minC &&
          c <= occupiedExt.maxC;
        const isHighlighted = Boolean(
          card && highlightedInstanceIds?.has(card.instanceId),
        );
        const isDimmed = Boolean(scoringActive && card && !isHighlighted);

        return (
          <motion.div
            key={key}
            role={interactive || Boolean(preview) ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            className={`forest-cell${card ? " filled" : ""}${
              isLegal ? " legal" : ""
            }${animalClickable ? " targetable" : ""}${
              selected ? " selected-target" : ""
            }${shaking ? " illegal" : ""}${
              !card && !isLegal && !inOccupied ? " growth-slot" : ""
            }`}
            onClick={() => {
              if (isLegal && onPlace) {
                onPlace({ r, c });
                return;
              }
              if (animalClickable && card) {
                onSelectAnimal?.(card.instanceId);
                return;
              }
              if (preview && !card) {
                flashIllegal(key);
                onIllegal?.();
              }
            }}
            onKeyDown={(e) => {
              if (!interactive) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (isLegal && onPlace) onPlace({ r, c });
                else if (animalClickable && card)
                  onSelectAnimal?.(card.instanceId);
              }
            }}
            animate={
              shaking
                ? { x: [0, -6, 6, -4, 4, 0], opacity: 1 }
                : isLegal
                  ? {
                      x: 0,
                      opacity: 1,
                      boxShadow: [
                        "0 0 0 1px rgba(232,192,122,0.35)",
                        "0 0 0 3px rgba(232,192,122,0.75)",
                        "0 0 0 1px rgba(232,192,122,0.35)",
                      ],
                    }
                  : isHighlighted
                    ? {
                        x: 0,
                        opacity: 1,
                        boxShadow:
                          "0 0 0 3px rgba(232,192,122,0.95), 0 0 22px rgba(232,192,122,0.55)",
                      }
                    : isDimmed
                      ? {
                          x: 0,
                          opacity: 0.28,
                          boxShadow: "0 0 0 0 rgba(0,0,0,0)",
                        }
                      : { x: 0, opacity: 1, boxShadow: "0 0 0 0 rgba(0,0,0,0)" }
            }
            transition={
              shaking
                ? { duration: 0.4 }
                : isLegal
                  ? { boxShadow: { duration: 1.6, repeat: Infinity } }
                  : isHighlighted || isDimmed
                    ? { duration: 0.25 }
                    : { type: "spring", stiffness: 320, damping: 22 }
            }
            whileHover={interactive ? { scale: 1.03 } : undefined}
          >
            <AnimatePresence mode="sync">
              {card ? (
                <motion.div
                  key={card.instanceId}
                  className="forest-card-slot"
                  initial={
                    card.instanceId === justPlacedId
                      ? { y: -48, opacity: 0, scale: 0.55, rotate: -12 }
                      : { opacity: 0, scale: 0.92 }
                  }
                  animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                >
                  <PlaceholderCard
                    cardId={card.cardId}
                    kind={card.kind}
                    rotation={card.rotation}
                    compact
                    lairTokens={card.lairTokens}
                    waterBonus={card.waterBonus}
                  />
                </motion.div>
              ) : isPinned && preview ? (
                <motion.div
                  key={`ghost-pinned-${preview.cardId}-${preview.rotation}`}
                  className="forest-ghost preview-pinned"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 0.88, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <PlaceholderCard
                    cardId={preview.cardId}
                    kind={preview.kind}
                    rotation={preview.rotation}
                    compact
                    showPopover={false}
                  />
                </motion.div>
              ) : isLegal && preview ? (
                <motion.div
                  key={`ghost-${preview.cardId}-${preview.rotation}`}
                  className="forest-ghost"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.45 }}
                  exit={{ opacity: 0 }}
                >
                  <PlaceholderCard
                    cardId={preview.cardId}
                    kind={preview.kind}
                    rotation={preview.rotation}
                    compact
                    showPopover={false}
                  />
                </motion.div>
              ) : (
                <motion.span
                  key="empty"
                  className="muted"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                >
                  {isLegal ? t("placeHintShort") : ""}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
