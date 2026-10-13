import { AnimatePresence, motion } from "framer-motion";
import {
  LAIR_TOKEN_BANK,
  WATER_TOKEN_BANK,
  cardDefById,
  remainingRoundsFromForests,
  remainingRoundsFromPathDeck,
  slugFromAnimalCardId,
  type AdvisorSlot,
  type MarketSlot,
  type MatchDeckSizes,
  type PlayerPublic,
} from "@savernake/shared";
import { animalMetaBySlug } from "../i18n/animal-meta";
import { useLocale } from "../i18n/LocaleContext";
import { PathDeckStack } from "./PathDeckStack";
import { PlaceholderCard } from "./PlaceholderCard";
import { TokenBank } from "./TokenBank";

type Props = {
  market: MarketSlot[];
  selected?: AdvisorSlot | null;
  selectable?: boolean;
  onSelect?: (slot: AdvisorSlot) => void;
  /** Bumps when market refills so draw-in staggers again. */
  dealKey?: string | number;
  deckSizes?: MatchDeckSizes | null;
  players?: PlayerPublic[];
};

const PATH_SLOTS: AdvisorSlot[] = ["rooster", "armadillo", "goat"];

export function MarketRow({
  market,
  selected,
  selectable,
  onSelect,
  dealKey = 0,
  deckSizes = null,
  players = [],
}: Props) {
  const { locale, t } = useLocale();
  const pathRemaining = deckSizes?.pathDeck ?? 0;
  const waterRemaining = deckSizes?.waterSupply ?? WATER_TOKEN_BANK;
  const lairRemaining = deckSizes?.lairSupply ?? LAIR_TOKEN_BANK;
  const roundsLeft = remainingRoundsFromForests(players);
  const pathRoundsLeft = remainingRoundsFromPathDeck(pathRemaining);

  return (
    <div className="market-board">
      <PathDeckStack
        pathRemaining={pathRemaining}
        roundsLeft={roundsLeft}
        pathRoundsLeft={pathRoundsLeft}
        labels={{
          pathDeck: t("pathDeck"),
          pathCardsLeft: t("pathCardsLeft"),
          roundsLeft: t("roundsLeft"),
          pathRoundsLeft: t("pathRoundsLeft"),
        }}
      />

      <div className="market-row" aria-label={t("market")}>
        {market.map((slot, index) => {
          const canPick = Boolean(selectable && slot.cardId);
          const def = slot.cardId ? cardDefById(slot.cardId) : undefined;
          const slug =
            (def?.kind === "animal" ? def.artSlug : undefined) ??
            (slot.cardId ? slugFromAnimalCardId(slot.cardId) : null);
          const animalName = animalMetaBySlug(slug)?.name[locale];
          const cardLabel = animalName ?? slot.cardId ?? "";
          const isPathDeal = PATH_SLOTS.includes(slot.slot);
          const isAnimalDeal = slot.slot === "rabbit";

          return (
            <div key={slot.slot} className="market-slot-wrap">
              <span className="slot-label">{slot.slot}</span>
              {slot.slot === "armadillo" ? (
                <TokenBank
                  kind="lair"
                  remaining={lairRemaining}
                  total={LAIR_TOKEN_BANK}
                  label={t("burrowBank")}
                />
              ) : null}
              {slot.slot === "goat" ? (
                <TokenBank
                  kind="water"
                  remaining={waterRemaining}
                  total={WATER_TOKEN_BANK}
                  label={t("waterBank")}
                />
              ) : null}
              <AnimatePresence mode="sync">
                {slot.cardId && slot.kind ? (
                  <motion.button
                    key={`${dealKey}-${slot.cardId}`}
                    type="button"
                    className={`market-slot filled${
                      selected === slot.slot ? " selected" : ""
                    }`}
                    disabled={!canPick}
                    onClick={() => canPick && onSelect?.(slot.slot)}
                    initial={
                      isPathDeal
                        ? { x: -72, y: 28, opacity: 0, scale: 0.55, rotate: -8 }
                        : isAnimalDeal
                          ? { x: 48, y: -24, opacity: 0, scale: 0.55, rotate: 6 }
                          : { y: -20, opacity: 0, scale: 0.92 }
                    }
                    animate={{
                      x: 0,
                      y: selected === slot.slot ? -4 : 0,
                      opacity: 1,
                      scale: selected === slot.slot ? 1.04 : 1,
                      rotate: 0,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.9,
                      transition: { duration: 0.18 },
                    }}
                    transition={{
                      delay: isPathDeal
                        ? PATH_SLOTS.indexOf(slot.slot) * 0.08
                        : index * 0.05,
                      type: "spring",
                      stiffness: 280,
                      damping: 20,
                    }}
                    whileHover={canPick ? { y: -3 } : undefined}
                    whileTap={canPick ? { scale: 0.97 } : undefined}
                    aria-label={`${t("drawingCard")} ${cardLabel}`}
                  >
                    <PlaceholderCard
                      cardId={slot.cardId}
                      kind={slot.kind}
                      compact
                    />
                  </motion.button>
                ) : (
                  <motion.div
                    key={`${slot.slot}-empty`}
                    className="market-slot empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.55 }}
                    exit={{ opacity: 0 }}
                  >
                    —
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
