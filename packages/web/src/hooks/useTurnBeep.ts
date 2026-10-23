import { useEffect, useRef } from "react";

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

/** Plays a beep when isMyTurn transitions false → true. */
export function useTurnBeep(isMyTurn: boolean) {
  const prev = useRef(false);

  useEffect(() => {
    if (!prev.current && isMyTurn) {
      playBeep();
    }
    prev.current = isMyTurn;
  }, [isMyTurn]);
}
