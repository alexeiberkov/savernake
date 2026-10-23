import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  legalCells,
  openWaterFoods,
  remainingRoundsFromForests,
  remainingRoundsFromPathDeck,
  type AdvisorSlot,
  type Food,
  type Rotation,
} from "@savernake/shared";
import { useLocale } from "../i18n/LocaleContext";
import { joinRoomApi, useRoomSession } from "../hooks/useRoomSession";
import { useTurnBeep, useSoundEnabled } from "../hooks/useTurnBeep";
import { ForestGrid } from "../components/ForestGrid";
import { MarketRow } from "../components/MarketRow";
import { PathDeckStack } from "../components/PathDeckStack";
import { TurnBanner } from "../components/TurnBanner";
import { TurnTimer } from "../components/TurnTimer";
import { RoosterMark } from "../components/RoosterMark";
import { ScoreReveal } from "../components/ScoreReveal";
import { AnimatedForestGrid } from "../components/AnimatedForestGrid";
import { CopyDebugState } from "../components/CopyDebugState";
import { TurnStatusBar } from "../components/TurnStatusBar";
import { ScoreCountdown } from "../components/ScoreCountdown";
import { RulesGuide } from "../components/RulesGuide";

const ROTATIONS: Rotation[] = [0, 90, 180, 270];

export function RoomPage() {
  const { code } = useParams();
  const { t, locale } = useLocale();
  const { snapshot, error, startGame, setTurnTimer, sendIntent, you } =
    useRoomSession(code);
  const [copied, setCopied] = useState(false);
  const [joinName, setJoinName] = useState("");
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AdvisorSlot | null>(null);
  const [previewCell, setPreviewCell] = useState<{ r: number; c: number } | null>(null);
  const [rotation, setRotation] = useState<Rotation>(0);
  const [waterAnimalId, setWaterAnimalId] = useState<string | null>(null);
  const [justPlacedId, setJustPlacedId] = useState<string | null>(null);
  const [illegalNote, setIllegalNote] = useState(false);
  const [finishedAnimsDone, setFinishedAnimsDone] = useState(0);
  const [scoringStarted, setScoringStarted] = useState(false);
  const prevFinishedPhase = useRef(false);
  const prevForestLen = useRef(0);
  const [soundEnabled, toggleSound] = useSoundEnabled();
  // Must be computed before any early return so useTurnBeep hook count is stable.
  const isMyTurnEarly = Boolean(
    snapshot?.match.phase === "turn" &&
      you != null &&
      you.seat === snapshot?.match.turnSeat &&
      !snapshot?.match.actedSeatsThisRound.includes(you.seat),
  );
  useTurnBeep(isMyTurnEarly, soundEnabled);
  const illegalTimer = useRef<number | null>(null);

  const confirmPlacement = useCallback(() => {
    if (!selectedSlot || !previewCell) return;
    sendIntent({ type: "pickAndPlace", slot: selectedSlot, cell: previewCell, rotation });
    setSelectedSlot(null);
    setPreviewCell(null);
  }, [selectedSlot, previewCell, rotation, sendIntent]);

  useEffect(() => {
    if (!isMyTurnEarly) setPreviewCell(null);
  }, [isMyTurnEarly]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!previewCell) return;
      if (e.key === "Enter") { e.preventDefault(); confirmPlacement(); }
      if (e.key === "Escape") { e.preventDefault(); setPreviewCell(null); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewCell, confirmPlacement]);

  const shareUrl = useMemo(() => {
    if (!code) return "";
    return `${window.location.origin}/r/${code.toUpperCase()}`;
  }, [code]);

  useEffect(() => {
    return () => {
      if (illegalTimer.current) window.clearTimeout(illegalTimer.current);
    };
  }, []);

  // Reset scoring animation counter when leaving the finished phase (restart).
  useEffect(() => {
    const isFinished = snapshot?.match.phase === "finished";
    if (prevFinishedPhase.current && !isFinished) {
      setFinishedAnimsDone(0);
      setScoringStarted(false);
    }
    prevFinishedPhase.current = isFinished ?? false;
  }, [snapshot?.match.phase]);

  // Clear preview when card selection changes or turn ends.
  useEffect(() => { setPreviewCell(null); }, [selectedSlot]);

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

  const pendingWater =
    snapshot?.match.pendingAdvisor?.kind === "water" &&
    snapshot.match.pendingAdvisor.playerId === snapshot.youPlayerId
      ? snapshot.match.pendingAdvisor
      : null;

  // Water droplet flow: keep selection in sync with pending advisor + own forest.
  useEffect(() => {
    if (!pendingWater) {
      setWaterAnimalId(null);
      return;
    }
    const targets = (you?.forest ?? []).filter(
      (c) => c.kind === "animal" && openWaterFoods(c).length > 0,
    );
    if (targets.length === 1) {
      setWaterAnimalId(targets[0]!.instanceId);
    } else {
      setWaterAnimalId((prev) =>
        prev && targets.some((c) => c.instanceId === prev) ? prev : null,
      );
    }
  }, [pendingWater, you?.forest]);

  // Auto-place droplet when the selected animal has exactly one open product.
  useEffect(() => {
    if (!pendingWater || !waterAnimalId) return;
    const animal = (you?.forest ?? []).find(
      (c) => c.instanceId === waterAnimalId && c.kind === "animal",
    );
    if (!animal) return;
    const open = openWaterFoods(animal);
    if (open.length !== 1) return;
    const food = open[0]!;
    setWaterAnimalId(null);
    sendIntent({
      type: "advisorPlaceWater",
      animalInstanceId: waterAnimalId,
      food,
    });
  }, [pendingWater, waterAnimalId, you?.forest, sendIntent]);

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
    isMyTurn && !pendingMine && selectedSlot && selectedMarket?.cardId && selectedKind
      ? legalCells(myForest, {
          strictPathExclusiveDuringPlace: match.strictPathExclusiveDuringPlace,
          placingAnimal: selectedKind === "animal",
          cardId: selectedMarket.cardId,
          kind: selectedKind,
          rotation,
        })
      : [];

  const myConflicts = match.conflicts.filter((c) => c.playerId === you?.id);
  const turnPlayer = match.players.find((p) => p.seat === match.turnSeat);
  const otherPlayers = match.players.filter((p) => p.id !== snapshot.youPlayerId);

  const orderedPlayers = (() => {
    const me = match.players.find((p) => p.id === snapshot.youPlayerId);
    const rest = match.players.filter((p) => p.id !== snapshot.youPlayerId);
    return me ? [me, ...rest] : [...match.players];
  })();

  const sortedPlayersForScoring =
    match.phase === "finished" ? orderedPlayers : [];

  const allFinishedAnimsDone =
    match.phase === "finished" &&
    finishedAnimsDone >= match.players.length;

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

  const advisorCursorClass =
    pendingMine?.kind === "water"
      ? " cursor-advisor-water"
      : pendingMine?.kind === "lair"
        ? " cursor-advisor-lair"
        : "";

  const localTurnActive = Boolean(isMyTurn || pendingMine);

  return (
    <>
      {!inLobby && match.phase === "turn" && turnPlayer && (
        <TurnStatusBar
          playerName={turnPlayer.isBot ? t("computer") : turnPlayer.name}
          isMyTurn={Boolean(isMyTurn)}
          round={match.round}
          deadlineMs={snapshot.turnDeadlineMs}
          timerSeconds={
            snapshot.settings.debug ? 0 : snapshot.settings.turnTimerSeconds
          }
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
        />
      )}
    <div
      className={`table-layout${inLobby ? " lobby-mode" : ""}${advisorCursorClass}`}
    >
      <section className="panel table-bar">
        <div className="table-bar-meta">
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {inLobby ? t("lobby") : t("table")} · {snapshot.roomCode}
          <RulesGuide />
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

        <div className="timer-settings">
          <label>
            {t("turnTimer")}
            {inLobby && you?.isHost && !snapshot.settings.debug ? (
              <input
                type="number"
                min={0}
                max={300}
                step={15}
                value={snapshot.settings.turnTimerSeconds}
                onChange={(e) => setTurnTimer(Number(e.target.value))}
              />
            ) : (
              <span className="muted">
                {" "}
                {snapshot.settings.debug ||
                snapshot.settings.turnTimerSeconds === 0
                  ? t("turnTimerOff")
                  : `${snapshot.settings.turnTimerSeconds}s`}
              </span>
            )}
          </label>
          {inLobby ? (
            <p className="muted">{t("turnTimerHint")}</p>
          ) : null}
        </div>
        </div>

        <div className="table-bar-players">
        <h3>{t("players")}</h3>
        <ul className="player-list">
          {orderedPlayers.map((p) => (
            <motion.li
              key={p.id}
              layout
              animate={
                match.phase === "turn" && match.turnSeat === p.seat
                  ? { backgroundColor: "rgba(212,161,90,0.14)" }
                  : { backgroundColor: "rgba(255,255,255,0.03)" }
              }
            >
              <span className="player-name-row">
                {p.isBot ? t("computer") : p.name}{" "}
                {!inLobby && p.seat === match.firstPlayerSeat ? (
                  <RoosterMark />
                ) : null}
                {p.isHost ? <span className="muted">({t("host")})</span> : null}
                {p.id === snapshot.youPlayerId ? " ★" : ""}
              </span>
              <span className="muted">
                {t("cards")} {p.cardCount}/16
                {typeof p.score === "number" ? ` · ${t("score")} ${p.score}` : ""}
                {" · "}
                {p.isBot
                  ? t("computerStatus")
                  : p.connected
                    ? t("connected")
                    : t("disconnected")}
              </span>
            </motion.li>
          ))}
        </ul>
        </div>
      </section>

      <section className="panel play-panel">
        {snapshot.settings.debug &&
        match.phase !== "lobby" &&
        match.phase !== "finished" ? (
          <div className="debug-finish">
            <button
              type="button"
              className="btn ghost"
              onClick={() => sendIntent({ type: "finishGame" })}
            >
              {t("finishGame")}
            </button>
          </div>
        ) : null}
        <AnimatePresence mode="wait">
          {match.phase === "finished" ? (
            <motion.div
              key="finished"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <AnimatePresence mode="wait">
                {!scoringStarted ? (
                  <motion.div
                    key="countdown"
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ScoreCountdown onDone={() => setScoringStarted(true)} />
                  </motion.div>
                ) : allFinishedAnimsDone ? (
                  <motion.div
                    key="score-reveal"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: "1.5rem" }}
                  >
                    <ScoreReveal
                      players={match.players}
                      winnerPlayerId={match.winnerPlayerId}
                      onPlayAgain={() =>
                        sendIntent({ type: "restartGame" })
                      }
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
              {scoringStarted && sortedPlayersForScoring.map((p, i) => (
                <div key={p.id} style={{ marginTop: i > 0 ? "1.75rem" : 0 }}>
                  <AnimatedForestGrid
                    forest={p.forest}
                    playerSeat={p.seat}
                    firstPlayerSeat={match.firstPlayerSeat}
                    label={
                      p.id === snapshot.youPlayerId
                        ? t("yourForest")
                        : p.isBot
                          ? t("computer")
                          : p.name
                    }
                    onDone={() => setFinishedAnimsDone((n) => n + 1)}
                  />
                </div>
              ))}
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
              {otherPlayers.map((p) => (
                <div key={p.id} style={{ marginTop: "1.75rem" }}>
                  <h3 className="muted" style={{ margin: "0 0 0.5rem" }}>
                    {p.isBot ? t("computer") : p.name}
                  </h3>
                  <ForestGrid
                    forest={p.forest}
                    label={p.isBot ? t("computer") : p.name}
                  />
                </div>
              ))}
            </motion.div>
          ) : !inLobby ? (
            <motion.div
              key="table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35 }}
            >
              <div className="play-status">
                <div>
                  <TurnBanner
                    active={match.phase === "turn"}
                    isMyTurn={Boolean(isMyTurn || pendingMine)}
                    playerName={turnPlayer?.name}
                  />
                  <TurnTimer
                    deadlineMs={snapshot.turnDeadlineMs}
                    timerSeconds={
                      snapshot.settings.debug
                        ? 0
                        : snapshot.settings.turnTimerSeconds
                    }
                    notice={snapshot.lastAutoPlayNotice}
                    urgencyForLocalPlayer={localTurnActive}
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
                  {pendingMine?.kind === "water" ? (
                    <p className="muted">{t("waterZeroHint")}</p>
                  ) : null}
                </div>
                <PathDeckStack
                  pathRemaining={match.deckSizes.pathDeck}
                  roundsLeft={remainingRoundsFromForests(match.players)}
                  pathRoundsLeft={remainingRoundsFromPathDeck(
                    match.deckSizes.pathDeck,
                  )}
                  labels={{
                    pathDeck: t("pathDeck"),
                    pathCardsLeft: t("pathCardsLeft"),
                    roundsLeft: t("roundsLeft"),
                    pathRoundsLeft: t("pathRoundsLeft"),
                  }}
                />
              </div>
              <h2>{t("market")}</h2>
              <MarketRow
                market={match.market}
                selected={selectedSlot}
                selectable={Boolean(isMyTurn && !pendingMine)}
                dealKey={match.round}
                deckSizes={match.deckSizes}
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
                  <p className="muted" style={{ margin: 0 }}>
                    {previewCell ? t("previewPinnedHint") : t("previewHint")}
                  </p>
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
              {snapshot.settings.debug ? (
                <CopyDebugState
                  snapshot={snapshot}
                  youPlayerId={snapshot.youPlayerId}
                  selectedSlot={selectedSlot}
                  rotation={rotation}
                  waterAnimalId={waterAnimalId}
                  legal={legal}
                  locale={locale}
                  connectError={error}
                  connected={Boolean(you?.connected)}
                />
              ) : null}
              {pendingMine?.kind === "water" ? (
                <div
                  className="water-product-picker"
                  role="group"
                  aria-label={t("pickWaterProduct")}
                >
                  <p className="muted">
                    {waterAnimalId
                      ? t("pickWaterProduct")
                      : t("pickWaterAnimal")}
                  </p>
                  {(() => {
                    const selected = myForest.find(
                      (c) => c.instanceId === waterAnimalId,
                    );
                    if (!selected) return null;
                    return (
                      <div className="food-picker">
                        {openWaterFoods(selected).map((food: Food) => (
                          <button
                            key={food}
                            type="button"
                            className="btn"
                            onClick={() => {
                              sendIntent({
                                type: "advisorPlaceWater",
                                animalInstanceId: waterAnimalId!,
                                food,
                              });
                              setWaterAnimalId(null);
                            }}
                          >
                            {t(food)}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              ) : null}
              <ForestGrid
                forest={myForest}
                legal={legal}
                preview={preview}
                justPlacedId={justPlacedId}
                selectedAnimalId={waterAnimalId}
                targetAnimalIds={
                  pendingMine?.kind === "lair"
                    ? myForest
                        .filter((c) => c.kind === "animal")
                        .map((c) => c.instanceId)
                    : pendingMine?.kind === "water"
                      ? myForest
                          .filter(
                            (c) =>
                              c.kind === "animal" &&
                              openWaterFoods(c).length > 0,
                          )
                          .map((c) => c.instanceId)
                      : []
                }
                previewCell={previewCell}
                onRotatePreview={() =>
                  setRotation(
                    ROTATIONS[(ROTATIONS.indexOf(rotation) + 1) % ROTATIONS.length]!,
                  )
                }
                onConfirmPreview={confirmPlacement}
                onPlace={(cell) => {
                  if (!selectedSlot) return;
                  const ok = legal.some(
                    (l) => l.r === cell.r && l.c === cell.c,
                  );
                  if (!ok) {
                    showIllegalNote();
                    return;
                  }
                  setPreviewCell(cell);
                }}
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
                onIllegal={showIllegalNote}
              />
              {otherPlayers.map((p) => (
                <div key={p.id} style={{ marginTop: "1.75rem" }}>
                  <h3 className="muted" style={{ margin: "0 0 0.5rem" }}>
                    {p.isBot ? t("computer") : p.name}
                  </h3>
                  <ForestGrid
                    forest={p.forest}
                    label={p.isBot ? t("computer") : p.name}
                  />
                </div>
              ))}
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
    </>
  );
}
