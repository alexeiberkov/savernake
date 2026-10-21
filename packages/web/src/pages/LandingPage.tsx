import { useEffect, useState, type FormEvent } from "react";
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
  const [debug, setDebug] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.body.classList.add("home");
    return () => document.body.classList.remove("home");
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = await createRoomApi(
        name || "Host",
        debug ? 0 : turnTimerSeconds,
        debug,
      );
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
      <motion.aside
        className="disclaimer-banner"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        aria-label={t("disclaimerTitle")}
      >
        <strong>{t("disclaimerTitle")}</strong>
        <span>
          {t("disclaimer")}
          <a
            href="https://berkau.pro"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://berkau.pro
          </a>
          {t("disclaimerLinkClose")}
        </span>
      </motion.aside>
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        {t("homeTitle")}
      </motion.h1>
      <motion.p
        className="lead"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.45 }}
      >
        {t("tagline")}
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
              value={debug ? 0 : turnTimerSeconds}
              disabled={debug}
              onChange={(e) => setTurnTimerSeconds(Number(e.target.value))}
            />
          </label>
          <label className="debug-toggle">
            <input
              type="checkbox"
              checked={debug}
              onChange={(e) => setDebug(e.target.checked)}
            />
            {t("debugPlay")}
          </label>
          <button className="btn" type="submit" disabled={busy}>
            {t("createRoom")}
          </button>
        </form>
        <p className="muted" style={{ marginTop: "0.65rem" }}>
          {t("turnTimerHint")} {t("debugPlayHint")}
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
