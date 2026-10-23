import { useCallback, useEffect, useRef, useState } from "react";

const SOUND_KEY = "savernake.sound";

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.value = 880;

    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.start(t);
    osc.stop(t + 0.35);
    osc.onended = () => ctx.close();
  } catch {
    // AudioContext not supported or blocked
  }
}

/** Returns [enabled, toggle] persisted to localStorage. */
export function useSoundEnabled(): [boolean, () => void] {
  const [enabled, setEnabled] = useState(
    () => localStorage.getItem(SOUND_KEY) !== "off",
  );
  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(SOUND_KEY, next ? "on" : "off");
      return next;
    });
  }, []);
  return [enabled, toggle];
}

/** Plays a beep when isMyTurn transitions false → true, if enabled. */
export function useTurnBeep(isMyTurn: boolean, enabled = true) {
  const prev = useRef(false);

  useEffect(() => {
    if (!prev.current && isMyTurn && enabled) {
      playBeep();
    }
    prev.current = isMyTurn;
  }, [isMyTurn, enabled]);
}
