import { useEffect, useState } from "react";
import { useLocale } from "../i18n/LocaleContext";

type Props = {
  playerName: string;
  isMyTurn: boolean;
  round: number;
  deadlineMs: number | null;
  timerSeconds: number;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
};

export function TurnStatusBar({
  playerName,
  isMyTurn,
  round,
  deadlineMs,
  timerSeconds,
  soundEnabled = true,
  onToggleSound,
}: Props) {
  const { t } = useLocale();
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (deadlineMs == null || timerSeconds <= 0) {
      setLeft(null);
      return;
    }
    const tick = () =>
      setLeft(Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000)));
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [deadlineMs, timerSeconds]);

  const label = isMyTurn
    ? t("turnBannerYours")
    : t("turnBannerOther").replace("{name}", playerName);

  return (
    <div className={`turn-status-bar${isMyTurn ? " mine" : ""}`}>
      <span className="turn-status-bar__player">{label}</span>
      <span className="turn-status-bar__sep" aria-hidden />
      <span className="turn-status-bar__round">
        {t("round")} {round}
      </span>
      {left != null && (
        <>
          <span className="turn-status-bar__sep" aria-hidden />
          <span className={`turn-status-bar__timer${left <= 10 ? " urgent" : ""}`}>
            {left}s
          </span>
        </>
      )}
      {onToggleSound && (
        <button
          type="button"
          className="turn-status-bar__mute"
          onClick={onToggleSound}
          title={soundEnabled ? "Mute turn sound" : "Unmute turn sound"}
          aria-label={soundEnabled ? "Mute" : "Unmute"}
        >
          {soundEnabled ? "🔔" : "🔇"}
        </button>
      )}
    </div>
  );
}
