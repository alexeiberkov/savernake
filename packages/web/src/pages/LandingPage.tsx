import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useLocale } from "../i18n/LocaleContext";
import { createRoomApi, joinRoomApi } from "../hooks/useRoomSession";

export function LandingPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [turnTimerSeconds, setTurnTimerSeconds] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = await createRoomApi(name || "Host", turnTimerSeconds);
      navigate(`/r/${data.snapshot.roomCode}`);
    } catch {
      setError("CREATE_FAILED");
    } finally {
      setBusy(false);
    }
  }

  async function onJoin(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = await joinRoomApi(code, name || "Player");
      navigate(`/r/${data.snapshot.roomCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "JOIN_FAILED");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="hero">
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        {t("brand")}
      </motion.h1>
      <motion.p
        className="lead"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.45 }}
      >
        {t("tagline")}
      </motion.p>
      <motion.p
        className="disclaimer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.28 }}
      >
        {t("disclaimer")}
      </motion.p>

      <motion.div
        className="panel"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 180 }}
      >
        <h2>{t("createRoom")}</h2>
        <form className="row" onSubmit={onCreate}>
          <label>
            {t("yourName")}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              autoComplete="nickname"
            />
          </label>
          <label>
            {t("turnTimer")}
            <input
              type="number"
              min={0}
              max={300}
              step={15}
              value={turnTimerSeconds}
              onChange={(e) => setTurnTimerSeconds(Number(e.target.value))}
            />
          </label>
          <button className="btn" type="submit" disabled={busy}>
            {t("createRoom")}
          </button>
        </form>
        <p className="muted" style={{ marginTop: "0.65rem" }}>
          {t("turnTimerHint")}
        </p>
      </motion.div>

      <motion.div
        className="panel"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32, duration: 0.4 }}
      >
        <h2>{t("joinRoom")}</h2>
        <form className="row" onSubmit={onJoin}>
          <label>
            {t("yourName")}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              autoComplete="nickname"
            />
          </label>
          <label>
            {t("roomCode")}
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={8}
              required
            />
          </label>
          <button className="btn ghost" type="submit" disabled={busy || !code}>
            {t("openRoom")}
          </button>
        </form>
        {error ? <p className="error">{error}</p> : null}
      </motion.div>
    </div>
  );
}
