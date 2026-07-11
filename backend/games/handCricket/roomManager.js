// Hand Cricket - in-memory room manager.
// Ported from HandCricket-Arena's server/src/services/roomManager.ts (TypeScript -> plain JS).
// Kept as its own Map/instance, separate from the Tic-Tac-Toe / RPS room store in ../../rooms.js,
// because Hand Cricket rooms use a different player/session model (persistent playerId issued to
// the client, not a re-issued token) and a longer-lived reconnect grace period.

const crypto = require("crypto");

// Exclude ambiguous characters: 0, O, I, 1, L
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const RECONNECT_GRACE_PERIOD_MS = 45000; // 45 seconds
const ROOM_MAX_INACTIVITY_MS = 5 * 60 * 1000; // 5 minutes

class RoomManager {
  constructor() {
    this.rooms = new Map(); // code -> GameRoom
    this.disconnectTimers = new Map(); // key: `${code}_${playerId}` -> Timeout
  }

  /** Generates a cryptographically secure 6-letter room code. */
  generateRoomCode() {
    let attempts = 0;
    while (attempts < 1000) {
      let code = "";
      const bytes = crypto.randomBytes(CODE_LENGTH);
      for (let i = 0; i < CODE_LENGTH; i++) {
        const index = bytes[i] % ALPHABET.length;
        code += ALPHABET[index];
      }
      if (!this.rooms.has(code)) {
        return code;
      }
      attempts++;
    }
    throw new Error("Failed to generate unique room code");
  }

  /** Creates a new game room with the host. */
  createRoom(playerId, nickname, socketId) {
    const code = this.generateRoomCode();
    const host = {
      id: playerId,
      nickname: nickname.trim(),
      socketId,
      isHost: true,
      isReady: true,
      score: 0,
      wickets: 0,
      currentChoice: null,
      playAgain: null,
      connected: true,
      disconnectedAt: null,
    };

    const newRoom = {
      code,
      status: "WAITING",
      players: [host],
      tossWinnerId: null,
      tossChoice: null,
      tossPrediction: null,
      coinFlipResult: null,
      batterId: null,
      bowlerId: null,
      targetRuns: null,
      moves: [],
      lastActive: Date.now(),
      revealTime: null,
      winnerId: null,
      draw: false,
      lastTurnResult: null,
    };

    this.rooms.set(code, newRoom);
    return newRoom;
  }

  /** Retrieves a room by its code. */
  getRoom(code) {
    const room = this.rooms.get(String(code).toUpperCase().trim());
    if (room) {
      room.lastActive = Date.now();
    }
    return room;
  }

  /** Joins an existing room. */
  joinRoom(code, playerId, nickname, socketId) {
    const upperCode = String(code).toUpperCase().trim();
    const room = this.rooms.get(upperCode);

    if (!room) {
      throw new Error("Room not found");
    }

    if (room.status !== "WAITING") {
      throw new Error("Game already started or room is full");
    }

    if (room.players.length >= 2) {
      throw new Error("Room is full");
    }

    const existingPlayer = room.players.find((p) => p.id === playerId);
    if (existingPlayer) {
      existingPlayer.socketId = socketId;
      existingPlayer.connected = true;
      existingPlayer.disconnectedAt = null;
      room.lastActive = Date.now();
      return room;
    }

    const guest = {
      id: playerId,
      nickname: nickname.trim(),
      socketId,
      isHost: false,
      isReady: false,
      score: 0,
      wickets: 0,
      currentChoice: null,
      playAgain: null,
      connected: true,
      disconnectedAt: null,
    };

    room.players.push(guest);
    room.status = "LOBBY";
    room.lastActive = Date.now();

    return room;
  }

  /** Leaves a room explicitly. */
  leaveRoom(code, playerId) {
    const room = this.rooms.get(code);
    if (!room) return null;

    const timerKey = `${code}_${playerId}`;
    const timer = this.disconnectTimers.get(timerKey);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(timerKey);
    }

    const playerIndex = room.players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) return room;

    const removedPlayer = room.players[playerIndex];
    room.players.splice(playerIndex, 1);

    if (room.players.length === 0) {
      this.rooms.delete(code);
      return null;
    }

    if (removedPlayer.isHost) {
      room.players[0].isHost = true;
    }

    room.status = "LOBBY";
    room.tossWinnerId = null;
    room.tossChoice = null;
    room.tossPrediction = null;
    room.coinFlipResult = null;
    room.batterId = null;
    room.bowlerId = null;
    room.targetRuns = null;
    room.moves = [];
    room.revealTime = null;
    room.winnerId = null;
    room.draw = false;
    room.lastTurnResult = null;

    room.players.forEach((p) => {
      p.isReady = p.isHost;
      p.score = 0;
      p.wickets = 0;
      p.currentChoice = null;
      p.playAgain = null;
    });

    room.lastActive = Date.now();
    return room;
  }

  /**
   * Sets up a disconnection timer for grace periods. If the player doesn't reconnect
   * in time during an active match, they forfeit and `onForfeitCallback` fires.
   */
  registerDisconnect(socketId, onForfeitCallback) {
    for (const [code, room] of this.rooms.entries()) {
      const player = room.players.find((p) => p.socketId === socketId);
      if (player) {
        player.connected = false;
        player.disconnectedAt = Date.now();
        room.lastActive = Date.now();

        if (room.status === "WAITING" || room.status === "LOBBY") {
          const timerKey = `${code}_${player.id}`;
          const timer = setTimeout(() => {
            this.leaveRoom(code, player.id);
          }, 5000);
          this.disconnectTimers.set(timerKey, timer);
          return;
        }

        const timerKey = `${code}_${player.id}`;
        const timer = setTimeout(() => {
          this.disconnectTimers.delete(timerKey);
          const activeRoom = this.rooms.get(code);
          if (!activeRoom) return;

          const disconnectedPlayer = activeRoom.players.find((p) => p.id === player.id);
          const opponent = activeRoom.players.find((p) => p.id !== player.id);

          if (disconnectedPlayer && !disconnectedPlayer.connected && opponent) {
            activeRoom.status = "RESULT";
            activeRoom.winnerId = opponent.id;
            activeRoom.draw = false;
            activeRoom.lastActive = Date.now();
            onForfeitCallback(activeRoom, opponent, disconnectedPlayer);
          }
        }, RECONNECT_GRACE_PERIOD_MS);

        this.disconnectTimers.set(timerKey, timer);
        return;
      }
    }
  }

  /** Reconnects a player who disconnected temporarily. */
  reconnectPlayer(code, playerId, socketId) {
    const upperCode = String(code).toUpperCase().trim();
    const room = this.rooms.get(upperCode);
    if (!room) {
      throw new Error("Room not found");
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error("Player not part of this room");
    }

    const timerKey = `${upperCode}_${playerId}`;
    const timer = this.disconnectTimers.get(timerKey);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(timerKey);
    }

    player.socketId = socketId;
    player.connected = true;
    player.disconnectedAt = null;
    room.lastActive = Date.now();

    return room;
  }

  /** Clears timers and deletes a room entirely. */
  deleteRoom(code) {
    const room = this.rooms.get(code);
    if (room) {
      room.players.forEach((p) => {
        const timerKey = `${code}_${p.id}`;
        const timer = this.disconnectTimers.get(timerKey);
        if (timer) {
          clearTimeout(timer);
          this.disconnectTimers.delete(timerKey);
        }
      });
      this.rooms.delete(code);
    }
  }

  /** Background garbage collection routine - call this on an interval. */
  runCleanup() {
    const now = Date.now();
    for (const [code, room] of this.rooms.entries()) {
      if (room.players.length === 0) {
        this.deleteRoom(code);
        continue;
      }

      if (now - room.lastActive > ROOM_MAX_INACTIVITY_MS) {
        this.deleteRoom(code);
        continue;
      }

      const allDisconnected = room.players.every((p) => !p.connected);
      if (allDisconnected) {
        const oldestDisconnect = Math.min(...room.players.map((p) => p.disconnectedAt || now));
        if (now - oldestDisconnect > RECONNECT_GRACE_PERIOD_MS) {
          this.deleteRoom(code);
        }
      }
    }
  }
}

module.exports = { RoomManager };
