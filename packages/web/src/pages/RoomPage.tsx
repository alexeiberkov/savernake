import { useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useLocale } from "../i18n/LocaleContext";
import { joinRoomApi, useRoomSession } from "../hooks/useRoomSession";
import { ForestGrid } from "../components/ForestGrid";
import { MarketRow } from "../components/MarketRow";

export function RoomPage() {
  const { code } = useParams();
  const { t } = useLocale();
  const { snapshot, error, startGame, you, setSnapshot } = useRoomSession(code);
  const [copied, setCopied] = useState(false);
  const [joinName, setJoinName] = useState("");
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

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
      const data = await joinRoomApi(code, joinName || "Player");
      setSnapshot(data.snapshot);
      // Force socket hello by reloading with token now stored.
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

  const myForest =
    match.players.find((p) => p.id === snapshot.youPlayerId)?.forest ?? [];

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
          {you?.isHost ? (
            <button
              type="button"
              className="btn"
              disabled={!canStart}
              onClick={startGame}
            >
              {t("startGame")}
            </button>
          ) : (
            <span className="muted">{t("waitingHost")}</span>
          )}
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
                {p.isHost ? (
                  <span className="muted">({t("host")})</span>
                ) : null}
                {p.id === snapshot.youPlayerId ? " ★" : ""}
              </span>
              <span className="muted">
                {t("seat")} {p.seat + 1} ·{" "}
                {p.connected ? t("connected") : t("disconnected")}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        {!inLobby ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
          >
            <p className="muted">
              {t("round")} {match.round} · phase {match.phase} ·{" "}
              {t("firstPlayer")} {match.firstPlayerSeat + 1}
            </p>
            <h2>{t("market")}</h2>
            <MarketRow market={match.market} />
            <h2 style={{ marginTop: "1.25rem" }}>{t("yourForest")}</h2>
            <ForestGrid forest={myForest} />
          </motion.div>
        ) : (
          <p className="muted">{t("placeholderArt")}</p>
        )}
      </section>
    </div>
  );
}
