import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  legalCells,
  type AdvisorSlot,
  type Food,
  type Rotation,
} from "@savernake/shared";
import { useLocale } from "../i18n/LocaleContext";
import { joinRoomApi, useRoomSession } from "../hooks/useRoomSession";
import { ForestGrid } from "../components/ForestGrid";
import { MarketRow } from "../components/MarketRow";
import { PlaceholderCard } from "../components/PlaceholderCard";
import { TurnBanner } from "../components/TurnBanner";
import { ScoreReveal } from "../components/ScoreReveal";

const ROTATIONS: Rotation[] = [0, 90, 180, 270];

export function RoomPage() {
  const { code } = useParams();
  const { t } = useLocale();
  const { snapshot, error, startGame, sendIntent, you } = useRoomSession(code);
  const [copied, setCopied] = useState(false);
  const [joinName, setJoinName] = useState("");
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AdvisorSlot | null>(null);
  const [rotation, setRotation] = useState<Rotation>(0);
  const [waterAnimalId, setWaterAnimalId] = useState<string | null>(null);
  const [justPlacedId, setJustPlacedId] = useState<string | null>(null);
  const [illegalNote, setIllegalNote] = useState(false);
  const prevForestLen = useRef(0);
  const illegalTimer = useRef<number | null>(null);

  const shareUrl = useMemo(() => {
    if (!code) return "";
    return `${window.location.origin}/r/${code.toUpperCase()}`;
  }, [code]);

  useEffect(() => {
    return () => {
      if (illegalTimer.current) window.clearTimeout(illegalTimer.current);
    };
  }, []);

  useEffect(() => {
    const len = you?.forest.length ?? 0;
    if (len > prevForestLen.current) {
      const newest = you?.forest[you.forest.length - 1];
      if (newest) {
        setJustPlacedId(newest.instanceId);
        const id = window.setTimeout(() => setJustPlacedId(null), 700);
        prevForestLen.current = len;
        return () => window.clearTimeout(id);
      }
    }
    prevForestLen.current = len;
  }, [you?.forest]);

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  async function onJoinFromLink(e: FormEvent) {
    e.preventDefault();
    if (!code) return;
    setJoinBusy(true);
    setJoinError(null);
    try {
      await joinRoomApi(code, joinName || "Player");
      window.location.reload();
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "JOIN_FAILED");
    } finally {
      setJoinBusy(false);
    }
  }

  if (error === "MISSING_TOKEN" && !snapshot) {
    return (
      <div className="panel">
        <h2>
          {t("joinRoom")} · {code?.toUpperCase()}
        </h2>
        <p className="disclaimer">{t("disclaimer")}</p>
        <form className="row" onSubmit={onJoinFromLink}>
          <label>
            {t("yourName")}
            <input
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              maxLength={24}
              autoComplete="nickname"
            />
          </label>
          <button className="btn" type="submit" disabled={joinBusy}>
            {t("openRoom")}
          </button>
        </form>
        {joinError ? <p className="error">{joinError}</p> : null}
        <p style={{ marginTop: "1rem" }}>
          <Link to="/">{t("backHome")}</Link>
        </p>
      </div>
    );
  }

  if (!snapshot) {
    return <p className="muted">…</p>;
  }

  const { match } = snapshot;
  const inLobby = match.phase === "lobby";
  const canStart =
    Boolean(you?.isHost) &&
    inLobby &&
    match.players.length >= 2 &&
    match.players.length <= 4;

  const myForest = you?.forest ?? [];
  const isMyTurn =
    match.phase === "turn" &&
    you != null &&
    you.seat === match.turnSeat &&
    !match.actedSeatsThisRound.includes(you.seat);
  const pendingMine =
    match.pendingAdvisor && match.pendingAdvisor.playerId === you?.id
      ? match.pendingAdvisor
      : null;

  const selectedMarket = match.market.find((m) => m.slot === selectedSlot);
  const selectedKind = selectedMarket?.kind ?? null;

  const legal =
    isMyTurn && !pendingMine && selectedSlot
      ? legalCells(myForest, {
          strictPathExclusiveDuringPlace: match.strictPathExclusiveDuringPlace,
          placingAnimal: selectedKind === "animal",
        })
      : [];

  const myConflicts = match.conflicts.filter((c) => c.playerId === you?.id);
  const turnPlayer = match.players.find((p) => p.seat === match.turnSeat);

  const preview =
    selectedMarket?.cardId && selectedKind
      ? {
          cardId: selectedMarket.cardId,
          kind: selectedKind,
          rotation,
        }
      : null;

  function showIllegalNote() {
    setIllegalNote(true);
    if (illegalTimer.current) window.clearTimeout(illegalTimer.current);
    illegalTimer.current = window.setTimeout(() => setIllegalNote(false), 900);
  }

  return (
    <div className={`table-layout${inLobby ? " lobby-mode" : ""}`}>
      <section className="panel">
        <h2>
          {inLobby ? t("lobby") : t("table")} · {snapshot.roomCode}
        </h2>
        <p className="muted">
          {t("shareLink")}: {shareUrl}
        </p>
        <div className="row">
          <button type="button" className="btn ghost" onClick={copyLink}>
            {copied ? t("copied") : t("copyLink")}
          </button>
          {inLobby && you?.isHost ? (
            <button
              type="button"
              className="btn"
              disabled={!canStart}
              onClick={startGame}
            >
              {t("startGame")}
            </button>
          ) : null}
          {inLobby && !you?.isHost ? (
            <span className="muted">{t("waitingHost")}</span>
          ) : null}
        </div>
        {!canStart && inLobby && you?.isHost ? (
          <p className="muted">{t("needPlayers")}</p>
        ) : null}
        {error && error !== "MISSING_TOKEN" ? (
          <p className="error">{error}</p>
        ) : null}

        <h3 style={{ marginTop: "1.25rem" }}>{t("players")}</h3>
        <ul className="player-list">
          {match.players.map((p) => (
            <motion.li
              key={p.id}
              layout
              animate={
                match.phase === "turn" && match.turnSeat === p.seat
                  ? { backgroundColor: "rgba(212,161,90,0.14)" }
                  : { backgroundColor: "rgba(255,255,255,0.03)" }
              }
            >
              <span>
                {p.name}{" "}
                {p.isHost ? <span className="muted">({t("host")})</span> : null}
                {p.id === snapshot.youPlayerId ? " ★" : ""}
              </span>
              <span className="muted">
                {t("cards")} {p.cardCount}/16
                {typeof p.score === "number" ? ` · ${t("score")} ${p.score}` : ""}
                {" · "}
                {p.connected ? t("connected") : t("disconnected")}
              </span>
            </motion.li>
          ))}
        </ul>
      </section>

      <section className="panel play-panel">
        <AnimatePresence mode="wait">
          {match.phase === "finished" ? (
            <motion.div
              key="finished"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <ScoreReveal
                players={match.players}
                winnerPlayerId={match.winnerPlayerId}
              />
              <div style={{ marginTop: "1.25rem" }}>
                <ForestGrid forest={myForest} />
              </div>
            </motion.div>
          ) : match.phase === "conflictResolve" ? (
            <motion.div
              key="conflict"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h2>{t("conflictTitle")}</h2>
              {myConflicts.length === 0 ? (
                <p className="muted">{t("waitingTurn")}</p>
              ) : (
                myConflicts.map((c) => (
                  <div key={c.pathKey} className="conflict-block">
                    <div className="row">
                      {c.animalInstanceIds.map((id) => {
                        const card = myForest.find((f) => f.instanceId === id);
                        return (
                          <motion.button
                            key={id}
                            type="button"
                            className="btn"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() =>
                              sendIntent({
                                type: "resolveConflict",
                                pathKey: c.pathKey,
                                keepAnimalInstanceId: id,
                              })
                            }
                          >
                            {t("keepAnimal")} {card?.cardId ?? id}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
              <ForestGrid forest={myForest} />
            </motion.div>
          ) : !inLobby ? (
            <motion.div
              key="table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35 }}
            >
              <TurnBanner
                active={match.phase === "turn"}
                isMyTurn={Boolean(isMyTurn || pendingMine)}
                playerName={turnPlayer?.name}
              />

              <p className="muted">
                {t("round")} {match.round} · {t("firstPlayer")}{" "}
                {match.firstPlayerSeat + 1}
              </p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={
                    pendingMine?.kind ??
                    (isMyTurn ? "mine" : "wait")
                  }
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                >
                  {pendingMine
                    ? pendingMine.kind === "lair"
                      ? t("pendingLair")
                      : t("pendingWater")
                    : isMyTurn
                      ? t("yourTurn")
                      : t("waitingTurn")}
                </motion.p>
              </AnimatePresence>

              <h2>{t("market")}</h2>
              <MarketRow
                market={match.market}
                selected={selectedSlot}
                selectable={Boolean(isMyTurn && !pendingMine)}
                dealKey={match.round}
                onSelect={(slot) => setSelectedSlot(slot)}
              />

              {isMyTurn && !pendingMine ? (
                <div className="place-toolbar">
                  <motion.button
                    type="button"
                    className="btn ghost"
                    whileTap={{ rotate: 15 }}
                    onClick={() =>
                      setRotation(
                        ROTATIONS[
                          (ROTATIONS.indexOf(rotation) + 1) % ROTATIONS.length
                        ]!,
                      )
                    }
                  >
                    {t("rotate")} ({rotation}°)
                  </motion.button>
                  {preview ? (
                    <motion.div
                      className="rotate-preview"
                      layout
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <span className="muted">{t("previewHint")}</span>
                      <PlaceholderCard
                        cardId={preview.cardId}
                        kind={preview.kind}
                        rotation={preview.rotation}
                        compact
                      />
                    </motion.div>
                  ) : null}
                  <AnimatePresence>
                    {illegalNote ? (
                      <motion.span
                        className="error"
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        {t("illegalPlace")}
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </div>
              ) : null}

              <h2 style={{ marginTop: "1.25rem" }}>{t("yourForest")}</h2>
              <ForestGrid
                forest={myForest}
                legal={legal}
                preview={preview}
                justPlacedId={justPlacedId}
                onPlace={(cell) => {
                  if (!selectedSlot) return;
                  const ok = legal.some(
                    (l) => l.r === cell.r && l.c === cell.c,
                  );
                  if (!ok) {
                    showIllegalNote();
                    return;
                  }
                  sendIntent({
                    type: "pickAndPlace",
                    slot: selectedSlot,
                    cell,
                    rotation,
                  });
                  setSelectedSlot(null);
                }}
                highlightAnimals={Boolean(pendingMine)}
                onSelectAnimal={(instanceId) => {
                  if (!pendingMine) return;
                  if (pendingMine.kind === "lair") {
                    sendIntent({
                      type: "advisorPlaceLair",
                      animalInstanceId: instanceId,
                    });
                  } else {
                    setWaterAnimalId(instanceId);
                  }
                }}
                waterFoodPicker={
                  pendingMine?.kind === "water"
                    ? {
                        animalInstanceId: waterAnimalId,
                        onPickFood: (food: Food) => {
                          if (!waterAnimalId) return;
                          sendIntent({
                            type: "advisorPlaceWater",
                            animalInstanceId: waterAnimalId,
                            food,
                          });
                          setWaterAnimalId(null);
                        },
                      }
                    : undefined
                }
                onIllegal={showIllegalNote}
              />
            </motion.div>
          ) : (
            <motion.div
              key="lobby-aside"
              className="lobby-aside"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.p
                className="lobby-ready"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {t("lobbyReady")}
              </motion.p>
              <motion.div
                className="lobby-pulse"
                animate={{ opacity: [0.35, 0.7, 0.35], scale: [0.98, 1.02, 0.98] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden
              />
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
