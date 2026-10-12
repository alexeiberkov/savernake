import { useState } from "react";
import {
  openWaterFoods,
  type AdvisorSlot,
  type Cell,
  type RoomSnapshot,
  type Rotation,
} from "@savernake/shared";
import { useLocale } from "../i18n/LocaleContext";

type Props = {
  snapshot: RoomSnapshot;
  youPlayerId: string | null;
  selectedSlot: AdvisorSlot | null;
  rotation: Rotation;
  waterAnimalId: string | null;
  legal: Cell[];
  locale: string;
  connectError: string | null;
  connected: boolean;
};

function buildDebugPayload(props: Props) {
  const { snapshot, youPlayerId } = props;
  const match = snapshot.match;
  const you = match.players.find((p) => p.id === youPlayerId) ?? null;
  const selectedMarket = match.market.find((m) => m.slot === props.selectedSlot);
  const turnPlayer = match.players.find((p) => p.seat === match.turnSeat) ?? null;
  const waterTarget = you?.forest.find((c) => c.instanceId === props.waterAnimalId);

  const players = match.players.map((p) => ({
    id: p.id,
    name: p.name,
    seat: p.seat,
    isHost: p.isHost,
    connected: p.connected,
    cardCount: p.cardCount,
    score: p.score ?? null,
    forest: p.forest.map((c) => ({
      instanceId: c.instanceId,
      kind: c.kind,
      cardId: c.cardId,
      cell: c.cell,
      rotation: c.rotation,
      lairTokens: c.lairTokens,
      waterBonus: c.waterBonus,
    })),
  }));

  return {
    timestamp: new Date().toISOString(),
    commit: __SAVERNAKE_GIT_SHA__ || "unknown",
    client: {
      locale: props.locale,
      connected: props.connected,
      connectError: props.connectError,
      href: typeof location !== "undefined" ? location.href : null,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    },
    room: {
      roomCode: snapshot.roomCode,
      sharePath: snapshot.sharePath,
      hostId: snapshot.hostId,
      youPlayerId,
      settings: snapshot.settings,
      turnDeadlineMs: snapshot.turnDeadlineMs,
      lastAutoPlayNotice: snapshot.lastAutoPlayNotice
        ? {
            playerId: snapshot.lastAutoPlayNotice.playerId,
            name: snapshot.lastAutoPlayNotice.name,
            atMs: snapshot.lastAutoPlayNotice.atMs,
          }
        : null,
    },
    match: {
      phase: match.phase,
      round: match.round,
      turnSeat: match.turnSeat,
      firstPlayerSeat: match.firstPlayerSeat,
      actedSeatsThisRound: match.actedSeatsThisRound,
      strictPathExclusiveDuringPlace: match.strictPathExclusiveDuringPlace,
      seed: match.seed,
      winnerPlayerId: match.winnerPlayerId ?? null,
      pendingAdvisor: match.pendingAdvisor,
      conflicts: match.conflicts,
      market: match.market,
    },
    local: {
      player: you
        ? { id: you.id, name: you.name, seat: you.seat, isHost: you.isHost }
        : null,
      isYourTurnSeat: you != null && you.seat === match.turnSeat,
      turnPlayer: turnPlayer
        ? { id: turnPlayer.id, name: turnPlayer.name, seat: turnPlayer.seat }
        : null,
      selectedSlot: props.selectedSlot,
      selectedCardId: selectedMarket?.cardId ?? null,
      selectedKind: selectedMarket?.kind ?? null,
      rotation: props.rotation,
      waterAnimalId: props.waterAnimalId,
      pendingProductFoods: waterTarget ? openWaterFoods(waterTarget) : null,
      legalCells: props.legal,
    },
    players,
    note:
      "Placed forest cards cannot be moved (GAME_RULES). Place the selected market card on a glowing empty cell. resumeToken redacted.",
  };
}

export function CopyDebugState(props: Props) {
  const { t } = useLocale();
  const [toast, setToast] = useState(false);
  const [fallback, setFallback] = useState<string | null>(null);

  async function onCopy() {
    const payload = buildDebugPayload(props);
    // Never include resume tokens / localStorage secrets
    const text = JSON.stringify(payload, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setToast(true);
      window.setTimeout(() => setToast(false), 1600);
    } catch {
      setFallback(text);
    }
  }

  return (
    <div className="debug-copy-wrap">
      <button type="button" className="btn ghost tiny" onClick={onCopy}>
        {t("copyState")}
      </button>
      {toast ? <span className="debug-toast">{t("copied")}</span> : null}
      {fallback ? (
        <div className="debug-fallback" role="dialog" aria-label={t("copyState")}>
          <p className="muted">{t("copyStateFallback")}</p>
          <textarea readOnly value={fallback} rows={12} spellCheck={false} />
          <button
            type="button"
            className="btn ghost tiny"
            onClick={() => setFallback(null)}
          >
            {t("close")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
