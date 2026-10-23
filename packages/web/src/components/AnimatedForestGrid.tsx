import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  pathCardsAlongAnimalPath,
  scoreAnimal,
  cardDefById,
  type Food,
  type PlacedCard,
} from "@savernake/shared";
import { ForestGrid } from "./ForestGrid";
import { AnimalBreakdownRow } from "./AnimalBreakdownRow";
import { useLocale } from "../i18n/LocaleContext";
import { animalMetaBySlug } from "../i18n/animal-meta";

const ANIMAL_FOCUS_MS = 900;
const PATH_STEP_MS = 500;
const SCORE_STEP_MS = 1000;

type ScoreEvent =
  | { kind: "animal"; name: string; pts: number }
  | { kind: "food"; food: Food; pts: number; hasDroplet: boolean }
  | { kind: "rooster"; pts: number };

type AnimStep = {
  activeIds: ReadonlySet<string>;
  dimActive: boolean;
  score: number;
  event: ScoreEvent | null;
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
  const { t, locale } = useLocale();

  const { steps } = useMemo(() => {
    const animals = forest.filter((c) => c.kind === "animal");
    const result: AnimStep[] = [];
    let accScore = 0;

    for (const animal of animals) {
      const pathCards = pathCardsAlongAnimalPath(animal, forest);
      const breakdown = scoreAnimal(animal, forest);
      const def = cardDefById(animal.cardId);
      const animalMeta = animalMetaBySlug(def?.kind === "animal" ? def.artSlug : undefined);
      const animalName = animalMeta?.slug ?? animal.cardId;

      // 1. Focus on animal
      result.push({
        activeIds: new Set([animal.instanceId]),
        dimActive: true,
        score: accScore,
        event: null,
        showMs: ANIMAL_FOCUS_MS,
      });

      // 2. Reveal path cards one by one
      const revealedIds: string[] = [];
      for (const pc of pathCards) {
        revealedIds.push(pc.instanceId);
        result.push({
          activeIds: new Set([animal.instanceId, ...revealedIds]),
          dimActive: true,
          score: accScore,
          event: null,
          showMs: PATH_STEP_MS,
        });
      }

      const allIds = new Set([animal.instanceId, ...revealedIds]);

      // 3. Animal base points
      if (breakdown.animalPoints > 0) {
        accScore += breakdown.animalPoints;
        result.push({
          activeIds: allIds,
          dimActive: true,
          score: accScore,
          event: { kind: "animal", name: animalName, pts: breakdown.animalPoints },
          showMs: SCORE_STEP_MS,
        });
      }

      // 4. Per-food points
      for (const food of breakdown.stored) {
        const hasDroplet = (animal.waterBonus[food] ?? 0) > 0;
        const base = def?.kind === "animal" ? (def.foodValue[food] ?? 0) : 0;
        const pts = base + (hasDroplet ? 1 : 0);
        if (pts > 0) {
          accScore += pts;
          result.push({
            activeIds: allIds,
            dimActive: true,
            score: accScore,
            event: { kind: "food", food, pts, hasDroplet },
            showMs: SCORE_STEP_MS,
          });
        }
      }
    }

    // 5. Rooster bonus
    if (playerSeat === firstPlayerSeat) {
      accScore += 1;
      result.push({
        activeIds: new Set<string>(),
        dimActive: false,
        score: accScore,
        event: { kind: "rooster", pts: 1 },
        showMs: SCORE_STEP_MS,
      });
    }

    result.push({
      activeIds: new Set<string>(),
      dimActive: false,
      score: accScore,
      event: null,
      showMs: Infinity,
    });

    return { steps: result };
  }, [forest, playerSeat, firstPlayerSeat]);

  const [stepIdx, setStepIdx] = useState(-1);
  const timerRef = useRef<number | null>(null);
  const doneFiredRef = useRef(false);

  useEffect(() => {
    timerRef.current = window.setTimeout(() => setStepIdx(0), 400);
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, []);

  useEffect(() => {
    if (stepIdx < 0) return;
    const current = steps[stepIdx];
    if (!current || current.showMs === Infinity) {
      if (!doneFiredRef.current) { doneFiredRef.current = true; onDone?.(); }
      return;
    }
    timerRef.current = window.setTimeout(() => setStepIdx((i) => i + 1), current.showMs);
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, [stepIdx, steps, onDone]);

  const currentStep = stepIdx >= 0 ? steps[stepIdx] : null;
  const displayScore = currentStep?.score ?? 0;
  const isDone = currentStep?.showMs === Infinity;
  const event = currentStep?.event ?? null;

  function eventLabel(ev: ScoreEvent): string {
    if (ev.kind === "animal") {
      const meta = animalMetaBySlug(ev.name);
      const name = meta?.name[locale] ?? ev.name;
      return `${name}: +${ev.pts}`;
    }
    if (ev.kind === "food") return `${t(ev.food)}: +${ev.pts}${ev.hasDroplet ? " 💧" : ""}`;
    return `🐓: +${ev.pts}`;
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
        <h3 style={{ margin: 0 }}>{label}</h3>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={displayScore}
            initial={{ scale: 0.7, opacity: 0, y: -6 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 6 }}
            transition={{ type: "spring", stiffness: 340, damping: 22 }}
            style={{ fontWeight: 700, color: "var(--amber-bright)", fontFamily: "var(--font-display)", fontSize: "1.1rem" }}
          >
            {displayScore} {t("score")}
          </motion.span>
        </AnimatePresence>
        <AnimatePresence mode="wait">
          {event ? (
            <motion.span
              key={`${event.kind}-${displayScore}`}
              className="scoring-event-label"
              initial={{ opacity: 0, x: -10, scale: 0.85 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 320, damping: 20 }}
            >
              {eventLabel(event)}
            </motion.span>
          ) : null}
        </AnimatePresence>
        <AnimatePresence>
          {isDone && (
            <motion.span initial={{ opacity: 0, x: -4 }} animate={{ opacity: 0.7, x: 0 }}
              style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              ✓
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <ForestGrid
        forest={forest}
        label={label}
        highlightedInstanceIds={isDone || !currentStep ? undefined : currentStep.activeIds}
        scoringActive={!isDone && Boolean(currentStep?.dimActive)}
      />
      {isDone && (
        <div className="animal-breakdown-list">
          {forest.filter((c) => c.kind === "animal").map((a) => (
            <AnimalBreakdownRow key={a.instanceId} animal={a} forest={forest} />
          ))}
        </div>
      )}
    </div>
  );
}
