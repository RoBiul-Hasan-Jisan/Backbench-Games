// Hand Cricket - Socket.IO event wiring.
// Ported from HandCricket-Arena's server/src/socket/handlers/socketHandler.ts (TypeScript -> plain JS).
//
// Event names intentionally use hyphens (create-room, join-room, ...) which is how the
// original HandCricket-Arena client talks to it. Backbench's own Tic-Tac-Toe/RPS events use
// underscores (create_room, join_room, ...) so the two protocols coexist on the same
// Socket.IO server/namespace without collisions - see server.js.

const { RoomManager } = require("./roomManager");
const { GameStateMachine } = require("./stateMachine");

class HandCricketSocketHandler {
  constructor(io, roomManager) {
    this.io = io;
    this.roomManager = roomManager || new RoomManager();
  }

  broadcastRoomUpdate(roomCode, room) {
    this.io.to(roomCode).emit("room-update", room);
  }

  /** Registers all Hand Cricket listeners on a freshly connected socket. */
  handleConnection(socket) {
    // 1. Time synchronization
    socket.on("ping-sync", (data) => {
      socket.emit("pong-sync", {
        clientTime: data.clientTime,
        serverTime: Date.now(),
      });
    });

    // 2. Create Room
    socket.on("create-room", (data, callback) => {
      try {
        if (!data.playerId || !data.nickname) {
          return callback({ success: false, error: "Player ID and nickname are required" });
        }
        const room = this.roomManager.createRoom(data.playerId, data.nickname, socket.id);
        socket.join(room.code);
        callback({ success: true, data: { room } });
      } catch (err) {
        callback({ success: false, error: err.message || "Failed to create room" });
      }
    });

    // 3. Join Room
    socket.on("join-room", (data, callback) => {
      try {
        if (!data.roomCode || !data.playerId || !data.nickname) {
          return callback({ success: false, error: "Room code, player ID, and nickname are required" });
        }
        const room = this.roomManager.joinRoom(data.roomCode, data.playerId, data.nickname, socket.id);
        socket.join(room.code);

        callback({ success: true, data: { room } });
        this.broadcastRoomUpdate(room.code, room);
      } catch (err) {
        callback({ success: false, error: err.message || "Failed to join room" });
      }
    });

    // 4. Reconnect Room
    socket.on("reconnect-room", (data, callback) => {
      try {
        if (!data.roomCode || !data.playerId) {
          return callback({ success: false, error: "Room code and player ID are required" });
        }
        const room = this.roomManager.reconnectPlayer(data.roomCode, data.playerId, socket.id);
        socket.join(room.code);

        callback({ success: true, data: { room } });
        this.broadcastRoomUpdate(room.code, room);
      } catch (err) {
        callback({ success: false, error: err.message || "Failed to reconnect" });
      }
    });

    // 5. Player Ready status toggle
    socket.on("ready", (data, callback) => {
      try {
        const room = this.roomManager.getRoom(data.roomCode);
        if (!room) return callback({ success: false, error: "Room not found" });

        if (room.status !== "LOBBY" && room.status !== "READY") {
          return callback({ success: false, error: "Ready status can only change in the lobby" });
        }

        const player = room.players.find((p) => p.id === data.playerId);
        if (!player) return callback({ success: false, error: "Player not in this room" });

        player.isReady = data.ready;

        const allReady = room.players.length === 2 && room.players.every((p) => p.isReady);
        room.status = allReady ? "READY" : "LOBBY";

        callback({ success: true });
        this.broadcastRoomUpdate(room.code, room);
      } catch (err) {
        callback({ success: false, error: err.message });
      }
    });

    // 6. Host starts game
    socket.on("start-game", (data, callback) => {
      try {
        const room = this.roomManager.getRoom(data.roomCode);
        if (!room) return callback({ success: false, error: "Room not found" });

        const player = room.players.find((p) => p.id === data.playerId);
        if (!player || !player.isHost) {
          return callback({ success: false, error: "Only the host can start the game" });
        }

        if (room.status !== "READY") {
          return callback({ success: false, error: "All players must be ready to start" });
        }

        GameStateMachine.transitionTo(room, "TOSS");
        callback({ success: true });
        this.broadcastRoomUpdate(room.code, room);
      } catch (err) {
        callback({ success: false, error: err.message });
      }
    });

    // 7. Guest submits coin prediction during TOSS
    socket.on("toss-guess", (data, callback) => {
      try {
        const room = this.roomManager.getRoom(data.roomCode);
        if (!room) return callback({ success: false, error: "Room not found" });

        const player = room.players.find((p) => p.id === data.playerId);
        if (!player || player.isHost) {
          return callback({ success: false, error: "Only the guest makes the toss prediction" });
        }

        GameStateMachine.handleCoinToss(room, data.prediction);

        callback({ success: true });
        this.broadcastRoomUpdate(room.code, room);
      } catch (err) {
        callback({ success: false, error: err.message });
      }
    });

    // 8. Toss winner selects Bat/Bowl
    socket.on("bat-bowl-choice", (data, callback) => {
      try {
        const room = this.roomManager.getRoom(data.roomCode);
        if (!room) return callback({ success: false, error: "Room not found" });

        GameStateMachine.handleTossDecision(room, data.playerId, data.choice);

        callback({ success: true });
        this.broadcastRoomUpdate(room.code, room);
      } catch (err) {
        callback({ success: false, error: err.message });
      }
    });

    // 9. Submit Game Move (1-6)
    socket.on("submit-move", (data, callback) => {
      try {
        const room = this.roomManager.getRoom(data.roomCode);
        if (!room) return callback({ success: false, error: "Room not found" });

        const { resolved, revealTime } = GameStateMachine.submitChoice(room, data.playerId, data.choice);

        callback({ success: true });

        if (resolved) {
          const choiceSnapshot = room.players.map((p) => ({
            id: p.id,
            choice: p.currentChoice,
          }));

          const turnSnapshot = GameStateMachine.resolveTurn(room);

          this.io.to(room.code).emit("reveal-moves", {
            revealTime,
            choices: choiceSnapshot,
            turnResult: turnSnapshot,
            updatedRoom: room,
          });
        } else {
          socket.to(room.code).emit("opponent-moved");
        }
      } catch (err) {
        callback({ success: false, error: err.message });
      }
    });

    // 10. Start Second Innings
    socket.on("start-second-innings", (data, callback) => {
      try {
        const room = this.roomManager.getRoom(data.roomCode);
        if (!room) {
          if (typeof callback === "function") callback({ success: false, error: "Room not found" });
          return;
        }

        GameStateMachine.startSecondInnings(room);
        if (typeof callback === "function") callback({ success: true });
        this.broadcastRoomUpdate(room.code, room);
      } catch (err) {
        if (typeof callback === "function") callback({ success: false, error: err.message });
      }
    });

    // 11. Play Again rematch responses
    socket.on("play-again", (data, callback) => {
      try {
        const room = this.roomManager.getRoom(data.roomCode);
        if (!room) return callback({ success: false, error: "Room not found" });

        GameStateMachine.handlePlayAgain(room, data.playerId, data.accept);

        callback({ success: true });
        this.broadcastRoomUpdate(room.code, room);
      } catch (err) {
        callback({ success: false, error: err.message });
      }
    });

    // 12. Leave Room
    socket.on("leave-room", (data, callback) => {
      try {
        const room = this.roomManager.leaveRoom(data.roomCode, data.playerId);
        socket.leave(data.roomCode);
        callback({ success: true });

        if (room) {
          this.broadcastRoomUpdate(room.code, room);
        }
      } catch (err) {
        callback({ success: false, error: err.message });
      }
    });

    // 13. Disconnect
    socket.on("disconnect", () => {
      this.roomManager.registerDisconnect(socket.id, (room, winner, disconnectedPlayer) => {
        this.io.to(room.code).emit("player-forfeited", {
          winnerId: winner.id,
          disconnectedPlayerId: disconnectedPlayer.id,
          room,
        });
      });
    });
  }
}

module.exports = { HandCricketSocketHandler };
