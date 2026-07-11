// In-memory room store. Good enough for a single server instance.
// To scale horizontally later, swap this Map for a Redis-backed store
// and add the Socket.IO Redis adapter - the interface below stays the same.

const { customAlphabet } = require("nanoid");
const genCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6); // no ambiguous chars

const rooms = new Map(); // code -> Room

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

function createRoom({ gameType, settings }) {
  let code;
  do {
    code = genCode();
  } while (rooms.has(code));

  const room = {
    code,
    gameType,
    settings,
    players: [],       // [{ id: socketId, name, symbol/role, connected }]
    status: "waiting",  // waiting | active | finished
    state: null,        // game-specific state, set when game starts
    createdAt: Date.now(),
    lastActivityAt: Date.now(),
  };

  rooms.set(code, room);
  return room;
}

function getRoom(code) {
  return rooms.get(code?.toUpperCase());
}

function touchRoom(code) {
  const room = rooms.get(code);
  if (room) room.lastActivityAt = Date.now();
}

function deleteRoom(code) {
  rooms.delete(code);
}

// Periodically clean up abandoned rooms so memory doesn't grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.lastActivityAt > IDLE_TIMEOUT_MS) {
      rooms.delete(code);
    }
  }
}, 5 * 60 * 1000);

module.exports = { createRoom, getRoom, touchRoom, deleteRoom, rooms };
