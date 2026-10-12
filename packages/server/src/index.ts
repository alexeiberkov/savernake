import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { RoomManager } from "./room-manager.js";

const PORT = Number(process.env.PORT ?? 3001);
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: true },
});

const rooms = new RoomManager();

app.get("/health", (_req, res) => {
  res.json({ ok: true, name: "savernake-server" });
});

app.post("/api/rooms", (req, res) => {
  const name = String(req.body?.name ?? "Host");
  const { snapshot, resumeToken } = rooms.createRoom(name);
  res.json({ snapshot, resumeToken });
});

app.post("/api/rooms/:code/join", (req, res) => {
  const name = String(req.body?.name ?? "Player");
  const result = rooms.joinRoom(req.params.code, name);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }
  io.to(result.room.code).emit("room:update", rooms.snapshot(result.room, null));
  res.json({ snapshot: result.snapshot, resumeToken: result.resumeToken });
});

io.on("connection", (socket) => {
  socket.on(
    "room:hello",
    (
      payload: { code: string; resumeToken: string },
      ack?: (r: { ok: boolean; snapshot?: unknown; error?: string }) => void,
    ) => {
      const result = rooms.resume(payload.code, payload.resumeToken, socket.id);
      if (!result.ok) {
        ack?.({ ok: false, error: result.error });
        return;
      }
      socket.join(result.room.code);
      socket.data.roomCode = result.room.code;
      socket.data.playerId = result.playerId;
      io.to(result.room.code).emit(
        "room:update",
        rooms.snapshot(result.room, null),
      );
      ack?.({ ok: true, snapshot: result.snapshot });
    },
  );

  socket.on(
    "room:start",
    (_payload: unknown, ack?: (r: { ok: boolean; error?: string }) => void) => {
      const code = socket.data.roomCode as string | undefined;
      const playerId = socket.data.playerId as string | undefined;
      if (!code || !playerId) {
        ack?.({ ok: false, error: "NOT_IN_ROOM" });
        return;
      }
      const result = rooms.startGame(code, playerId);
      if (!result.ok) {
        ack?.({ ok: false, error: result.error });
        return;
      }
      io.to(code).emit("room:update", rooms.snapshot(result.room, null));
      ack?.({ ok: true });
    },
  );

  socket.on(
    "room:rename",
    (
      payload: { name: string },
      ack?: (r: { ok: boolean }) => void,
    ) => {
      const code = socket.data.roomCode as string | undefined;
      const playerId = socket.data.playerId as string | undefined;
      if (!code || !playerId) {
        ack?.({ ok: false });
        return;
      }
      const room = rooms.rename(code, playerId, payload.name);
      if (room) {
        io.to(code).emit("room:update", rooms.snapshot(room, null));
      }
      ack?.({ ok: Boolean(room) });
    },
  );

  socket.on("disconnect", () => {
    const room = rooms.markDisconnected(socket.id);
    if (room) {
      io.to(room.code).emit("room:update", rooms.snapshot(room, null));
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`[savernake] server on http://localhost:${PORT}`);
});
