import { useEffect, useState } from "react";
import { FOREST_TARGET_CARDS } from "@savernake/shared";
import { useLocale } from "../i18n/LocaleContext";

type Props = {
  playerName: string;
  isMyTurn: boolean;
  round: number;
  deadlineMs: number | null;
  timerSeconds: number;
  roomCode?: string;
  onShare?: () => void;
  shareCopied?: boolean;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
};

export function TurnStatusBar({
  playerName,
  isMyTurn,
  round,
  deadlineMs,
  timerSeconds,
  roomCode,
  onShare,
  shareCopied,
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
        {t("round")} {round} {t("of")} {FOREST_TARGET_CARDS}
      </span>
      {timerSeconds > 0 && (
        <>
          <span className="turn-status-bar__sep" aria-hidden />
          <span
            className={`turn-status-bar__timer${
              left != null && left <= 10 ? " urgent" : ""
            }${left == null ? " dimmed" : ""}`}
          >
            {left != null ? `${left}s` : `${timerSeconds}s`}
          </span>
        </>
      )}
      {roomCode && (
        <>
          <span className="turn-status-bar__sep" aria-hidden />
          <span className="turn-status-bar__room">{roomCode}</span>
          {onShare && (
            <button
              type="button"
              className="turn-status-bar__share"
              onClick={onShare}
              title={shareCopied ? "Copied!" : "Copy invite link"}
              aria-label="Share"
            >
              {shareCopied ? "✓" : "⎘"}
            </button>
          )}
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
