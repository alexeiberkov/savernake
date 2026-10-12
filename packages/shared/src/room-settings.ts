/** Turn timer: seconds. 0 = off; otherwise clamped to [MIN, MAX]. Default 60. */
export const TURN_TIMER_DEFAULT_SECONDS = 60;
export const TURN_TIMER_MIN_SECONDS = 30;
export const TURN_TIMER_MAX_SECONDS = 300;

export type RoomSettings = {
  /** 0 = timer off; else 30–300. Default when creating a room: 60. */
  turnTimerSeconds: number;
};

export function defaultRoomSettings(): RoomSettings {
  return { turnTimerSeconds: TURN_TIMER_DEFAULT_SECONDS };
}

export function normalizeTurnTimerSeconds(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return TURN_TIMER_DEFAULT_SECONDS;
  if (n === 0) return 0;
  return Math.min(
    TURN_TIMER_MAX_SECONDS,
    Math.max(TURN_TIMER_MIN_SECONDS, Math.round(n)),
  );
}
