// Backbench Games - realtime multiplayer server.
//
// This is a standalone Node process, NOT a Next.js API route, because
// Socket.IO needs a long-lived connection that serverless platforms
// (like Vercel) don't support. Deploy this on Fly.io / Railway / Render
// and point the frontend's NEXT_PUBLIC_SOCKET_URL at it.

const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const { nanoid } = require("nanoid");

const { createRoom, getRoom, touchRoom, deleteRoom } = require("./rooms");
const TicTacToe = require("./games/ticTacToe");
const RPS = require("./games/rockPaperScissors");
const { RoomManager: HandCricketRoomManager } = require("./games/handCricket/roomManager");
const { HandCricketSocketHandler } = require("./games/handCricket/socketHandler");

const PORT = process.env.PORT || 4000;

// CLIENT_ORIGIN can be a single URL or a comma-separated list, e.g.
//   CLIENT_ORIGIN=https://your-app.vercel.app,http://localhost:3000
// This lets the same backend serve your production frontend, Vercel preview
// deployments, and local dev without redeploying every time.
const ALLOWED_ORIGINS = (process.env.CLIENT_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function isOriginAllowed(origin) {
  if (!origin) return true; // non-browser clients / server-to-server / curl
  return ALLOWED_ORIGINS.includes(origin);
}

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) return callback(null, true);
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
};

const app = express();
app.use(cors(corsOptions));
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/", (_req, res) => res.json({ ok: true, service: "backbench-games-server" }));

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) return callback(null, true);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ---- helpers -----------------------------------------------------------

function sanitizeRoom(room) {
  // Never leak internal player tokens to the other player.
  return {
    code: room.code,
    gameType: room.gameType,
    settings: room.settings,
    status: room.status,
    state: room.state,
    players: room.players.map((p) => ({
      name: p.name,
      role: p.role,
      connected: p.connected,
      ready: p.ready,
    })),
  };
}

function broadcastRoom(roomCode) {
  const room = getRoom(roomCode);
  if (!room) return;
  io.to(roomCode).emit("room_update", sanitizeRoom(room));
}

function otherPlayer(room, playerToken) {
  return room.players.find((p) => p.token !== playerToken);
}

function findPlayerByToken(room, token) {
  return room.players.find((p) => p.token === token);
}

function assignRole(gameType, index) {
  if (gameType === "tic-tac-toe") return index === 0 ? "X" : "O";
  return index === 0 ? "P1" : "P2";
}

function startGameIfReady(room) {
  if (room.players.length !== 2) return;
  if (!room.players.every((p) => p.ready)) return;

  room.status = "active";
  if (room.gameType === "tic-tac-toe") {
    room.state = TicTacToe.createInitialState();
  } else if (room.gameType === "rock-paper-scissors") {
    room.state = RPS.createInitialState(room.settings?.bestOf || 3);
  }
}

// ---- Hand Cricket (own room store + own protocol, coexists on the same io) ----
// Hand Cricket uses a persistent-playerId session model instead of Backbench's
// token-per-room model, so it gets its own RoomManager/state machine rather than
// being squeezed into rooms.js. Its socket events use hyphens (create-room, ...)
// which never collide with Backbench's underscore events (create_room, ...).
const handCricketRoomManager = new HandCricketRoomManager();
const handCricketSocketHandler = new HandCricketSocketHandler(io, handCricketRoomManager);

// Garbage-collect abandoned Hand Cricket rooms on the same cadence as rooms.js.
setInterval(() => handCricketRoomManager.runCleanup(), 5 * 60 * 1000);

// ---- socket handlers -----------------------------------------------------

io.on("connection", (socket) => {
  socket.data.roomCode = null;
  socket.data.playerToken = null;

  // Hand Cricket listens on its own set of event names on this same socket.
  handCricketSocketHandler.handleConnection(socket);

  socket.on("create_room", ({ gameType, settings, playerName }, ack) => {
    const room = createRoom({ gameType, settings });
    const token = nanoid();

    room.players.push({
      token,
      socketId: socket.id,
      name: playerName?.slice(0, 20) || "Player 1",
      role: assignRole(gameType, 0),
      connected: true,
      ready: false,
    });

    socket.join(room.code);
    socket.data.roomCode = room.code;
    socket.data.playerToken = token;

    ack?.({ ok: true, roomCode: room.code, playerToken: token, role: room.players[0].role, room: sanitizeRoom(room) });
  });

  socket.on("join_room", ({ roomCode, playerName }, ack) => {
    const room = getRoom(roomCode);
    if (!room) return ack?.({ ok: false, reason: "Room not found." });
    if (room.players.length >= 2) {
      return ack?.({ ok: false, reason: "Room is full." });
    }

    const token = nanoid();
    room.players.push({
      token,
      socketId: socket.id,
      name: playerName?.slice(0, 20) || "Player 2",
      role: assignRole(room.gameType, 1),
      connected: true,
      ready: false,
    });

    socket.join(room.code);
    socket.data.roomCode = room.code;
    socket.data.playerToken = token;
    touchRoom(room.code);

    ack?.({ ok: true, roomCode: room.code, playerToken: token, role: room.players[1].role, room: sanitizeRoom(room) });
    broadcastRoom(room.code);
  });

  socket.on("rejoin_room", ({ roomCode, playerToken }, ack) => {
    const room = getRoom(roomCode);
    if (!room) return ack?.({ ok: false, reason: "Room not found." });
    const player = findPlayerByToken(room, playerToken);
    if (!player) return ack?.({ ok: false, reason: "Player not recognized." });

    player.socketId = socket.id;
    player.connected = true;
    socket.join(room.code);
    socket.data.roomCode = room.code;
    socket.data.playerToken = playerToken;
    touchRoom(room.code);

    ack?.({ ok: true, role: player.role, room: sanitizeRoom(room) });
    broadcastRoom(room.code);
  });

  socket.on("player_ready", ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room) return;
    const player = findPlayerByToken(room, socket.data.playerToken);
    if (!player) return;

    player.ready = true;
    touchRoom(roomCode);
    startGameIfReady(room);
    broadcastRoom(roomCode);
  });

  socket.on("make_move", ({ roomCode, cellIndex }, ack) => {
    const room = getRoom(roomCode);
    if (!room || room.gameType !== "tic-tac-toe" || room.status !== "active") {
      return ack?.({ ok: false, reason: "Game not active." });
    }
    const player = findPlayerByToken(room, socket.data.playerToken);
    if (!player) return ack?.({ ok: false, reason: "Not in this room." });

    const result = TicTacToe.applyMove(room.state, player.role, cellIndex);
    if (!result.ok) return ack?.({ ok: false, reason: result.reason });

    room.state = result.state;
    if (room.state.winner) room.status = "finished";
    touchRoom(roomCode);

    ack?.({ ok: true });
    broadcastRoom(roomCode);
  });

  socket.on("submit_pick", ({ roomCode, pick }, ack) => {
    const room = getRoom(roomCode);
    if (!room || room.gameType !== "rock-paper-scissors" || room.status !== "active") {
      return ack?.({ ok: false, reason: "Game not active." });
    }
    const player = findPlayerByToken(room, socket.data.playerToken);
    const opponent = otherPlayer(room, socket.data.playerToken);
    if (!player || !opponent) return ack?.({ ok: false, reason: "Waiting for opponent." });

    const result = RPS.submitPick(room.state, player.token, opponent.token, pick);
    if (!result.ok) return ack?.({ ok: false, reason: result.reason });

    room.state = result.state;
    if (room.state.winnerId) room.status = "finished";
    touchRoom(roomCode);

    ack?.({ ok: true });
    broadcastRoom(roomCode);
  });

  socket.on("play_again", ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room) return;

    room.status = "waiting";
    room.players.forEach((p) => (p.ready = false));
    room.state = null;
    touchRoom(roomCode);
    broadcastRoom(roomCode);
  });

  socket.on("chat_message", ({ roomCode, text }) => {
    const room = getRoom(roomCode);
    if (!room) return;
    const player = findPlayerByToken(room, socket.data.playerToken);
    if (!player || !text?.trim()) return;

    io.to(roomCode).emit("chat_message", {
      name: player.name,
      text: text.slice(0, 300),
      at: Date.now(),
    });
  });

  socket.on("leave_room", () => handleDisconnectOrLeave(socket, { removePlayer: true }));
  socket.on("disconnect", () => handleDisconnectOrLeave(socket, { removePlayer: false }));
});

function handleDisconnectOrLeave(socket, { removePlayer }) {
  const { roomCode, playerToken } = socket.data;
  if (!roomCode) return;
  const room = getRoom(roomCode);
  if (!room) return;

  const player = findPlayerByToken(room, playerToken);
  if (!player) return;

  if (removePlayer) {
    room.players = room.players.filter((p) => p.token !== playerToken);
    if (room.players.length === 0) {
      deleteRoom(roomCode);
      return;
    }
  } else {
    // Keep the seat warm so a refresh/dropped connection can rejoin.
    player.connected = false;
  }

  touchRoom(roomCode);
  broadcastRoom(roomCode);
}

httpServer.listen(PORT, () => {
  console.log(`Backbench Games realtime server listening on :${PORT}`);
});
