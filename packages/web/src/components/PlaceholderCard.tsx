import {
  cardDefById,
  slugFromAnimalCardId,
  type CardKind,
  type Rotation,
} from "@savernake/shared";
import { motion } from "framer-motion";
import { useLocale } from "../i18n/LocaleContext";
import { animalImageSrc, animalMetaBySlug } from "../i18n/animal-meta";

type Props = {
  cardId: string;
  kind: CardKind;
  rotation?: Rotation;
  compact?: boolean;
  className?: string;
  /** Hide name/description popover (e.g. ghost preview). */
  showPopover?: boolean;
};

/** Path: geometric placeholder. Animal: fan-pack art; name/blurb only in popover. */
export function PlaceholderCard({
  cardId,
  kind,
  rotation = 0,
  compact,
  className = "",
  showPopover = true,
}: Props) {
  const { locale, t } = useLocale();

  const def = cardDefById(cardId);
  const artSlug =
    (def?.kind === "animal" ? def.artSlug : undefined) ??
    slugFromAnimalCardId(cardId);
  const meta = kind === "animal" ? animalMetaBySlug(artSlug) : undefined;
  const label = meta?.name[locale] ?? cardId;
  const blurb = meta?.blurb[locale];
  const canPopover = Boolean(showPopover && kind === "animal" && meta);

  return (
    <motion.div
      className={`ph-card ${kind}${compact ? " compact" : ""}${
        artSlug && kind === "animal" ? " has-art" : ""
      } ${className}`}
      animate={{ rotate: rotation }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      layout
      aria-label={kind === "animal" ? label : `${t("placeholderArt")} ${cardId}`}
    >
      {kind === "animal" && artSlug ? (
        <span className="ph-art-wrap" aria-hidden>
          <img
            className="ph-art"
            src={animalImageSrc(artSlug)}
            alt=""
            draggable={false}
          />
        </span>
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
        </div>
      ) : null}
    </motion.div>
  );
}
