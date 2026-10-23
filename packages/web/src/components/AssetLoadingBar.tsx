import { motion } from "framer-motion";
import { useLocale } from "../i18n/LocaleContext";
import type { PreloadState } from "../hooks/useAssetPreloader";

type Props = {
  state: PreloadState;
  /** Other players whose IDs are in assetsReadyPlayerIds */
  playersReady: number;
  playersTotal: number;
};

export function AssetLoadingBar({ state, playersReady, playersTotal }: Props) {
  const { t } = useLocale();

  if (state.done && playersReady >= playersTotal) return null;

  const pct = Math.round(state.progress * 100);

  return (
    <div className="asset-loading-bar">
      <div className="asset-loading-bar__track">
        <motion.div
          className="asset-loading-bar__fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ ease: "easeOut", duration: 0.3 }}
        />
      </div>
      <p className="asset-loading-bar__label">
        {state.done
          ? `${t("assetsReady")} · ${playersReady}/${playersTotal} ${t("players")}`
          : `${t("loadingAssets")} ${pct}%`}
      </p>
    </div>
  );
}
