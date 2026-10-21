import {
  ALL_FOODS,
  animalCapacity,
  cardDefById,
  slugFromAnimalCardId,
  type CardKind,
  type Food,
  type PlacedCard,
  type Rotation,
} from "@savernake/shared";
import { motion } from "framer-motion";
import { useLocale } from "../i18n/LocaleContext";
import { animalMetaBySlug } from "../i18n/animal-meta";
import { AnimalCardFace } from "./AnimalCardFace";

type Props = {
  cardId: string;
  kind: CardKind;
  rotation?: Rotation;
  compact?: boolean;
  className?: string;
  /** Hide tooltip (e.g. ghost preview). */
  showPopover?: boolean;
  /** Live upgrades when the card is in a forest. */
  lairTokens?: number;
  waterBonus?: PlacedCard["waterBonus"];
};

/** Path: geometric placeholder. Animal: square game face + hover flavor. */
export function PlaceholderCard({
  cardId,
  kind,
  rotation = 0,
  compact,
  className = "",
  showPopover = true,
  lairTokens = 0,
  waterBonus = {},
}: Props) {
  const { locale, t } = useLocale();

  const def = cardDefById(cardId);
  const artSlug =
    (def?.kind === "animal" ? def.artSlug : undefined) ??
    slugFromAnimalCardId(cardId);
  const meta = kind === "animal" ? animalMetaBySlug(artSlug) : undefined;
  const label = meta?.name[locale] ?? cardId;
  const blurb = meta?.blurb[locale];
  const animalDef = def?.kind === "animal" ? def : undefined;
  const canPopover = Boolean(
    showPopover && kind === "animal" && (meta || animalDef),
  );
  const pathFoods = def?.kind === "path" ? def.foods : [];
  const hasArt = (kind === "animal" && Boolean(artSlug)) || kind === "path";

  const foodLabel = (food: Food) => t(food);

  return (
    <motion.div
      className={`ph-card ${kind}${compact ? " compact" : ""}${
        hasArt ? " has-art" : ""
      } ${className}`}
      animate={{ rotate: rotation }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      aria-label={
        kind === "animal"
          ? label
          : `${t("pathDeck")} ${cardId}${
              pathFoods.length ? `: ${pathFoods.map(foodLabel).join(", ")}` : ""
            }`
      }
    >
      {kind === "path" ? (
        <div className="path-face">
          <img
            className="path-face-img"
            src={`/paths/${cardId}.png`}
            alt=""
            draggable={false}
          />
        </div>
      ) : kind === "animal" && animalDef && artSlug ? (
        <AnimalCardFace
          def={animalDef}
          artSlug={artSlug}
          labels={{
            food: foodLabel,
            animalVp: t("animalVp"),
            denCapacity: t("denCapacity"),
            pathStart: t("pathStart"),
            dropletUpgrade: t("dropletUpgrade"),
            caveUpgrade: t("caveUpgrade"),
          }}
          lairTokens={lairTokens}
          waterBonus={waterBonus}
        />
      ) : (
        <>
          <span className="ph-kind">{kind}</span>
          <span className="ph-id">{cardId}</span>
          <span className="ph-mark" aria-hidden />
        </>
      )}

      {canPopover ? (
        <div className="animal-popover" role="tooltip">
          <strong>{label}</strong>
          {blurb ? <p>{blurb}</p> : null}
          {animalDef ? (
            <ul className="animal-stats">
              <li>
                {t("animalVp")}: {animalDef.animalPoints}
              </li>
              <li>
                {t("denCapacity")}:{" "}
                {animalCapacity(animalDef, { lairTokens })}
                {lairTokens > 0 ? ` (${animalDef.storage}+${lairTokens})` : ""}
              </li>
              <li>
                {t("pathStart")}: {animalDef.pathStart}
              </li>
              {ALL_FOODS.map((food) => {
                const base = animalDef.foodValue[food];
                const drop = (waterBonus[food] ?? 0) > 0;
                return (
                  <li key={food}>
                    {t(food)}: {base}
                    {drop ? " +1" : ""}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      ) : null}
    </motion.div>
  );
}
