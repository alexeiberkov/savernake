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

/** Short victory fanfare: G4 E4 G5 (ta-da). */
export function playFanfare() {
  try {
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);

    const notes: [number, number, number][] = [
      // [freq, startSec, durSec]
      [392, 0.00, 0.18],  // G4
      [330, 0.16, 0.18],  // E4
      [392, 0.30, 0.18],  // G4
      [523, 0.44, 0.55],  // C5
      [659, 0.50, 0.65],  // E5
      [784, 0.58, 0.90],  // G5
    ];

    for (const [freq, start, dur] of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(master);
      const t = ctx.currentTime + start;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(1, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.start(t);
      osc.stop(t + dur);
    }

    setTimeout(() => ctx.close(), 2000);
  } catch {
    // AudioContext blocked
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
