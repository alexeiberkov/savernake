import { useMemo, useState, type FormEvent } from "react";
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

  const shareUrl = useMemo(() => {
    if (!code) return "";
    return `${window.location.origin}/r/${code.toUpperCase()}`;
  }, [code]);

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

  const selectedKind =
    match.market.find((m) => m.slot === selectedSlot)?.kind ?? null;

  const legal =
    isMyTurn && !pendingMine && selectedSlot
      ? legalCells(myForest, {
          strictPathExclusiveDuringPlace: match.strictPathExclusiveDuringPlace,
          placingAnimal: selectedKind === "animal",
        })
      : [];

  const myConflicts = match.conflicts.filter((c) => c.playerId === you?.id);

  return (
    <div className="table-layout">
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
            <li key={p.id}>
              <span>
                {p.name}{" "}
                {p.isHost ? <span className="muted">({t("host")})</span> : null}
                {p.id === snapshot.youPlayerId ? " ★" : ""}
                {match.turnSeat === p.seat && match.phase === "turn"
                  ? " ◀"
                  : ""}
              </span>
              <span className="muted">
                {t("cards")} {p.cardCount}/16
                {typeof p.score === "number" ? ` · ${t("score")} ${p.score}` : ""}
                {" · "}
                {p.connected ? t("connected") : t("disconnected")}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <AnimatePresence mode="wait">
          {match.phase === "finished" ? (
            <motion.div
              key="finished"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h2>{t("finished")}</h2>
              <p>
                {t("winner")}:{" "}
                <strong>
                  {match.players.find((p) => p.id === match.winnerPlayerId)
                    ?.name ?? "—"}
                </strong>
              </p>
              <ul className="player-list">
                {match.players.map((p) => (
                  <li key={p.id}>
                    <span>{p.name}</span>
                    <span>
                      {t("score")} {p.score ?? 0}
                    </span>
                  </li>
                ))}
              </ul>
              <ForestGrid forest={myForest} />
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
                    <p className="muted">{c.pathKey}</p>
                    <div className="row">
                      {c.animalInstanceIds.map((id) => {
                        const card = myForest.find((f) => f.instanceId === id);
                        return (
                          <button
                            key={id}
                            type="button"
                            className="btn"
                            onClick={() =>
                              sendIntent({
                                type: "resolveConflict",
                                pathKey: c.pathKey,
                                keepAnimalInstanceId: id,
                              })
                            }
                          >
                            {t("keepAnimal")} {card?.cardId ?? id}
                          </button>
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
              <p className="muted">
                {t("round")} {match.round} · {match.phase} · {t("firstPlayer")}{" "}
                {match.firstPlayerSeat + 1}
              </p>
              <p>
                {pendingMine
                  ? pendingMine.kind === "lair"
                    ? t("pendingLair")
                    : t("pendingWater")
                  : isMyTurn
                    ? t("yourTurn")
                    : t("waitingTurn")}
              </p>

              <h2>{t("market")}</h2>
              <MarketRow
                market={match.market}
                selected={selectedSlot}
                selectable={Boolean(isMyTurn && !pendingMine)}
                onSelect={(slot) => setSelectedSlot(slot)}
              />

              {isMyTurn && !pendingMine ? (
                <div className="row" style={{ marginTop: "0.75rem" }}>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() =>
                      setRotation(
                        ROTATIONS[
                          (ROTATIONS.indexOf(rotation) + 1) % ROTATIONS.length
                        ]!,
                      )
                    }
                  >
                    {t("rotate")} ({rotation}°)
                  </button>
                  {selectedSlot ? (
                    <span className="muted">
                      {t("selectedSlot")}: {selectedSlot} — {t("placeHint")}
                    </span>
                  ) : null}
                </div>
              ) : null}

              <h2 style={{ marginTop: "1.25rem" }}>{t("yourForest")}</h2>
              <ForestGrid
                forest={myForest}
                legal={legal}
                onPlace={(cell) => {
                  if (!selectedSlot) return;
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
              />
            </motion.div>
          ) : (
            <p className="muted">{t("placeholderArt")}</p>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
