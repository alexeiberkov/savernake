import { useCallback, useEffect, useMemo, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { ClientIntent, RoomSnapshot } from "@savernake/shared";

const tokenKey = (code: string) => `savernake.resume.${code.toUpperCase()}`;

export function useRoomSession(code: string | undefined) {
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const upper = code?.toUpperCase();

  useEffect(() => {
    if (!upper) return;
    const resumeToken = localStorage.getItem(tokenKey(upper));
    if (!resumeToken) {
      setError("MISSING_TOKEN");
      return;
    }

    const s = io({ path: "/socket.io", transports: ["websocket", "polling"] });
    setSocket(s);

    s.on("connect", () => {
      s.emit(
        "room:hello",
        { code: upper, resumeToken },
        (res: { ok: boolean; snapshot?: RoomSnapshot; error?: string }) => {
          if (!res.ok) {
            setError(res.error ?? "HELLO_FAILED");
            return;
          }
          setError(null);
          if (res.snapshot) setSnapshot(res.snapshot);
        },
      );
    });

    s.on("room:update", (next: RoomSnapshot) => {
      setSnapshot((prev) => ({
        ...next,
        youPlayerId: prev?.youPlayerId ?? next.youPlayerId,
      }));
    });

    s.on("room:kicked", (payload: { playerId: string }) => {
      setSnapshot((prev) => {
        if (!prev) return prev;
        if (prev.youPlayerId === payload.playerId) {
          if (upper) localStorage.removeItem(`savernake.resume.${upper}`);
          window.location.href = "/";
        }
        return prev;
      });
    });

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [upper]);

  const startGame = useCallback(() => {
    socket?.emit("room:start", {}, (res: { ok: boolean; error?: string }) => {
      if (!res.ok) setError(res.error ?? "START_FAILED");
    });
  }, [socket]);

  const kickPlayer = useCallback(
    (targetPlayerId: string) => {
      socket?.emit(
        "room:kick",
        { targetPlayerId },
        (res: { ok: boolean; error?: string }) => {
          if (!res.ok) setError(res.error ?? "KICK_FAILED");
        },
      );
    },
    [socket],
  );

  const signalAssetsReady = useCallback(() => {
    socket?.emit("player:assetsReady", {}, () => {});
  }, [socket]);

  const setTurnTimer = useCallback(
    (seconds: number) => {
      socket?.emit(
        "room:setTimer",
        { seconds },
        (res: { ok: boolean; error?: string }) => {
          if (!res.ok) setError(res.error ?? "TIMER_FAILED");
          else setError(null);
        },
      );
    },
    [socket],
  );

  const sendIntent = useCallback(
    (intent: ClientIntent) => {
      socket?.emit(
        "game:intent",
        intent,
        (res: { ok: boolean; error?: string }) => {
          if (!res.ok) setError(res.error ?? "INTENT_FAILED");
          else setError(null);
        },
      );
    },
    [socket],
  );

  const you = useMemo(() => {
    if (!snapshot?.youPlayerId) return null;
    return snapshot.match.players.find((p) => p.id === snapshot.youPlayerId) ?? null;
  }, [snapshot]);

  return {
    snapshot,
    error,
    startGame,
    kickPlayer,
    signalAssetsReady,
    setTurnTimer,
    sendIntent,
    you,
    setSnapshot,
  };
}

export async function createRoomApi(
  name: string,
  turnTimerSeconds = 60,
  debug = false,
) {
  const res = await fetch("/api/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, turnTimerSeconds, debug }),
  });
  if (!res.ok) throw new Error("CREATE_FAILED");
  const data = (await res.json()) as {
    snapshot: RoomSnapshot;
    resumeToken: string;
  };
  localStorage.setItem(tokenKey(data.snapshot.roomCode), data.resumeToken);
  return data;
}

export async function joinRoomApi(code: string, name: string) {
  const res = await fetch(`/api/rooms/${code.toUpperCase()}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "JOIN_FAILED");
  }
  const data = (await res.json()) as {
    snapshot: RoomSnapshot;
    resumeToken: string;
  };
  localStorage.setItem(tokenKey(data.snapshot.roomCode), data.resumeToken);
  return data;
}
