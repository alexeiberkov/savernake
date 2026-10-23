import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale } from "../i18n/LocaleContext";

export function RulesGuide() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="btn ghost rules-guide-btn"
        onClick={() => setOpen(true)}
        title={t("rulesTitle")}
      >
        ?
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="rules-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="rules-modal"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="rules-modal__close btn ghost"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
              <h2>{t("rulesTitle")}</h2>
              <div className="rules-modal__body">
                <p>
                  <strong>{t("rulesLeafValue")}</strong>{" "}
                  {t("rulesLeafValueDesc")}
                </p>
                <p>
                  <strong>{t("rulesCapacity")}</strong>{" "}
                  {t("rulesCapacityDesc")}
                </p>
                <p>
                  <strong>{t("rulesCapacityZero")}</strong>{" "}
                  {t("rulesCapacityZeroDesc")}
                </p>
                <p>
                  <strong>{t("rulesDroplet")}</strong>{" "}
                  {t("rulesDropletDesc")}
                </p>
                <p>
                  <strong>{t("rulesRooster")}</strong>{" "}
                  {t("rulesRoosterDesc")}
                </p>
                <p>
                  <strong>{t("rulesConflict")}</strong>{" "}
                  {t("rulesConflictDesc")}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
