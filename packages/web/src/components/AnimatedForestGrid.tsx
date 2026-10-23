import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  pathCardsAlongAnimalPath,
  scoreAnimal,
  type PlacedCard,
} from "@savernake/shared";
import { ForestGrid } from "./ForestGrid";
import { useLocale } from "../i18n/LocaleContext";

const ANIMAL_FOCUS_MS = 900;
const PATH_STEP_MS = 500;
const ANIMAL_SCORE_MS = 1200;

type AnimStep = {
  activeIds: ReadonlySet<string>;
  dimActive: boolean;
  score: number;
  showMs: number;
};

type Props = {
  forest: PlacedCard[];
  playerSeat: number;
  firstPlayerSeat: number;
  label: string;
  onDone?: () => void;
};

export function AnimatedForestGrid({
  forest,
  playerSeat,
  firstPlayerSeat,
  label,
  onDone,
}: Props) {
  const { t } = useLocale();

  const { steps } = useMemo(() => {
    const animals = forest.filter((c) => c.kind === "animal");
    const result: AnimStep[] = [];
    let accScore = 0;

    for (const animal of animals) {
      const pathCards = pathCardsAlongAnimalPath(animal, forest);
      const breakdown = scoreAnimal(animal, forest);
      const animalTotal = breakdown.animalPoints + breakdown.foodPoints;

      result.push({
        activeIds: new Set([animal.instanceId]),
        dimActive: true,
        score: accScore,
        showMs: ANIMAL_FOCUS_MS,
      });

      const revealedIds: string[] = [];
      for (const pc of pathCards) {
        revealedIds.push(pc.instanceId);
        result.push({
          activeIds: new Set([animal.instanceId, ...revealedIds]),
          dimActive: true,
          score: accScore,
          showMs: PATH_STEP_MS,
        });
      }

      accScore += animalTotal;
      result.push({
        activeIds: new Set([animal.instanceId, ...revealedIds]),
        dimActive: true,
        score: accScore,
        showMs: ANIMAL_SCORE_MS,
      });
    }

    if (playerSeat === firstPlayerSeat) {
      accScore += 1;
    }

    result.push({
      activeIds: new Set<string>(),
      dimActive: false,
      score: accScore,
      showMs: Infinity,
    });

    return { steps: result };
  }, [forest, playerSeat, firstPlayerSeat]);

  const [stepIdx, setStepIdx] = useState(-1);
  const timerRef = useRef<number | null>(null);
  const doneFiredRef = useRef(false);

  useEffect(() => {
    timerRef.current = window.setTimeout(() => setStepIdx(0), 400);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (stepIdx < 0) return;
    const current = steps[stepIdx];
    if (!current || current.showMs === Infinity) {
      if (!doneFiredRef.current) {
        doneFiredRef.current = true;
        onDone?.();
      }
      return;
    }
    timerRef.current = window.setTimeout(() => {
      setStepIdx((i) => i + 1);
    }, current.showMs);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [stepIdx, steps, onDone]);

  const currentStep = stepIdx >= 0 ? steps[stepIdx] : null;
  const displayScore = currentStep?.score ?? 0;
  const isDone = currentStep?.showMs === Infinity;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        <h3 style={{ margin: 0 }}>{label}</h3>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={displayScore}
            initial={{ scale: 0.7, opacity: 0, y: -6 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 6 }}
            transition={{ type: "spring", stiffness: 340, damping: 22 }}
            style={{
              fontWeight: 700,
              color: "var(--amber-bright)",
              fontFamily: "var(--font-display)",
              fontSize: "1.1rem",
            }}
          >
            {displayScore} {t("score")}
          </motion.span>
        </AnimatePresence>
        <AnimatePresence>
          {isDone && (
            <motion.span
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 0.7, x: 0 }}
              style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}
            >
              ✓
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <ForestGrid
        forest={forest}
        label={label}
        highlightedInstanceIds={
          isDone || !currentStep
            ? undefined
            : currentStep.activeIds
        }
        scoringActive={!isDone && Boolean(currentStep?.dimActive)}
      />
    </div>
  );
}
