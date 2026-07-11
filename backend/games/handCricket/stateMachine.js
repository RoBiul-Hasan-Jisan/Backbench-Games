// Hand Cricket - server-authoritative game state machine.
// Ported from HandCricket-Arena's server/src/game/stateMachine.ts (TypeScript -> plain JS).
// Room shape (see roomManager.js for the source of truth):
// {
//   code, status, players: [Player], tossWinnerId, tossChoice, tossPrediction,
//   coinFlipResult, batterId, bowlerId, targetRuns, moves: [MoveRecord],
//   lastActive, revealTime, winnerId, draw, lastTurnResult
// }
// Player shape:
// { id, nickname, socketId, isHost, isReady, score, wickets, currentChoice,
//   playAgain, connected, disconnectedAt }

const VALID_TRANSITIONS = {
  WAITING: ["LOBBY"],
  LOBBY: ["READY", "WAITING"],
  READY: ["TOSS", "LOBBY"],
  TOSS: ["BAT_OR_BOWL", "LOBBY"],
  BAT_OR_BOWL: ["FIRST_INNINGS", "LOBBY"],
  FIRST_INNINGS: ["CHANGE_INNINGS", "RESULT", "LOBBY"],
  CHANGE_INNINGS: ["SECOND_INNINGS", "LOBBY"],
  SECOND_INNINGS: ["RESULT", "LOBBY"],
  RESULT: ["REMATCH", "LOBBY"],
  REMATCH: ["TOSS", "LOBBY"],
};

class GameStateMachine {
  /** Validate a state transition. */
  static canTransition(current, target) {
    return (VALID_TRANSITIONS[current] || []).includes(target);
  }

  /** Safe transition method that throws on illegal actions. */
  static transitionTo(room, target) {
    if (!this.canTransition(room.status, target)) {
      throw new Error(`Illegal state transition from ${room.status} to ${target}`);
    }
    room.status = target;
    room.lastActive = Date.now();
  }

  /** Executes the coin flip for the toss phase. */
  static handleCoinToss(room, prediction) {
    if (room.status !== "TOSS") {
      throw new Error("Coin flip can only happen in TOSS state");
    }

    const host = room.players.find((p) => p.isHost);
    const guest = room.players.find((p) => !p.isHost);

    if (!host || !guest) {
      throw new Error("Toss requires two players");
    }

    const result = Math.random() < 0.5 ? "heads" : "tails";
    const won = result === prediction;
    const winnerId = won ? guest.id : host.id;

    room.coinFlipResult = result;
    room.tossPrediction = prediction;
    room.tossWinnerId = winnerId;

    this.transitionTo(room, "BAT_OR_BOWL");
    return { winnerId, result };
  }

  /** Registers whether the toss winner wants to Bat or Bowl. */
  static handleTossDecision(room, deciderId, choice) {
    if (room.status !== "BAT_OR_BOWL") {
      throw new Error("Toss decision can only happen in BAT_OR_BOWL state");
    }

    if (room.tossWinnerId !== deciderId) {
      throw new Error("Only the toss winner can make the decision");
    }

    const decider = room.players.find((p) => p.id === deciderId);
    const opponent = room.players.find((p) => p.id !== deciderId);

    if (!decider || !opponent) {
      throw new Error("Players not found");
    }

    room.tossChoice = choice;

    if (choice === "bat") {
      room.batterId = decider.id;
      room.bowlerId = opponent.id;
    } else {
      room.batterId = opponent.id;
      room.bowlerId = decider.id;
    }

    // Reset scores & game states for first innings.
    room.players.forEach((p) => {
      p.score = 0;
      p.wickets = 0;
      p.currentChoice = null;
      p.playAgain = null;
    });
    room.moves = [];
    room.lastTurnResult = null;
    room.targetRuns = null;

    this.transitionTo(room, "FIRST_INNINGS");
  }

  /**
   * Registers a choice for a player. If both choices are submitted, resolves the turn timing.
   * Returns { resolved, revealTime? }.
   */
  static submitChoice(room, playerId, choice) {
    if (room.status !== "FIRST_INNINGS" && room.status !== "SECOND_INNINGS") {
      throw new Error("Moves can only be submitted during active innings");
    }

    if (choice < 1 || choice > 6) {
      throw new Error("Move choice must be between 1 and 6");
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error("Player not in this room");
    }

    player.currentChoice = choice;
    room.lastActive = Date.now();

    const bothSubmitted = room.players.every((p) => p.currentChoice !== null);

    if (bothSubmitted) {
      const serverTime = Date.now();
      const shakeCushionMs = 2500; // 2.5s countdown + shake animation cushion
      room.revealTime = serverTime + shakeCushionMs;
      return { resolved: true, revealTime: room.revealTime };
    }

    return { resolved: false };
  }

  /**
   * Authoritatively resolves the active choices, calculating score increases or outs.
   */
  static resolveTurn(room) {
    const host = room.players.find((p) => p.isHost);
    const guest = room.players.find((p) => !p.isHost);
    const batter = room.players.find((p) => p.id === room.batterId);
    const bowler = room.players.find((p) => p.id === room.bowlerId);

    if (!batter || !bowler || !host || !guest) {
      throw new Error("Missing batter or bowler roles");
    }

    const batChoice = batter.currentChoice;
    const bowlChoice = bowler.currentChoice;

    if (batChoice === null || bowlChoice === null) {
      throw new Error("Not all choices submitted");
    }

    const turnNumber = room.moves.length + 1;
    const isOut = batChoice === bowlChoice;
    const runsAdded = isOut ? 0 : batChoice;

    if (!isOut) {
      batter.score += runsAdded;
    } else {
      batter.wickets += 1;
    }

    const record = {
      turnNumber,
      batterChoice: batChoice,
      bowlerChoice: bowlChoice,
      runsAdded,
      isOut,
      batterId: batter.id,
    };
    room.moves.push(record);
    room.lastTurnResult = {
      batterChoice: batChoice,
      bowlerChoice: bowlChoice,
      runsAdded,
      isOut,
      batterId: batter.id,
    };

    room.players.forEach((p) => (p.currentChoice = null));

    let inningsOver = false;
    let gameOver = false;
    let winnerId = null;

    if (room.status === "FIRST_INNINGS") {
      if (isOut) {
        inningsOver = true;
        room.targetRuns = batter.score + 1;

        // Swap batter and bowler.
        room.batterId = bowler.id;
        room.bowlerId = batter.id;
        this.transitionTo(room, "CHANGE_INNINGS");
      }
    } else if (room.status === "SECOND_INNINGS") {
      const target = room.targetRuns;
      if (batter.score >= target) {
        gameOver = true;
        winnerId = batter.id;
        room.winnerId = winnerId;
        room.draw = false;
        this.transitionTo(room, "RESULT");
      } else if (isOut) {
        gameOver = true;
        inningsOver = true;
        if (batter.score === target - 1) {
          winnerId = null;
          room.winnerId = null;
          room.draw = true;
        } else {
          winnerId = bowler.id;
          room.winnerId = winnerId;
          room.draw = false;
        }
        this.transitionTo(room, "RESULT");
      }
    }

    room.lastActive = Date.now();

    return {
      batterChoice: batChoice,
      bowlerChoice: bowlChoice,
      runsAdded,
      isOut,
      inningsOver,
      gameOver,
      winnerId,
    };
  }

  /** Progresses the game from CHANGE_INNINGS to SECOND_INNINGS. */
  static startSecondInnings(room) {
    if (room.status !== "CHANGE_INNINGS") {
      throw new Error("Can only start second innings from CHANGE_INNINGS state");
    }

    const currentBatter = room.players.find((p) => p.id === room.batterId);
    currentBatter.score = 0;
    currentBatter.wickets = 0;

    this.transitionTo(room, "SECOND_INNINGS");
  }

  /** Registers a play-again response. */
  static handlePlayAgain(room, playerId, accept) {
    if (room.status !== "RESULT" && room.status !== "REMATCH") {
      throw new Error("Rematch choices can only be registered after a match ends");
    }

    if (room.status === "RESULT") {
      this.transitionTo(room, "REMATCH");
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error("Player not in this room");
    }

    player.playAgain = accept;
    room.lastActive = Date.now();

    if (accept === false) {
      room.players.forEach((p) => {
        p.isReady = p.isHost;
        p.score = 0;
        p.wickets = 0;
        p.currentChoice = null;
        p.playAgain = null;
      });
      room.status = "LOBBY";
      room.tossWinnerId = null;
      room.tossChoice = null;
      room.tossPrediction = null;
      room.coinFlipResult = null;
      room.batterId = null;
      room.bowlerId = null;
      room.targetRuns = null;
      room.moves = [];
      room.lastTurnResult = null;

      return { resetToToss: false, resetToLobby: true };
    }

    const bothAccepted = room.players.every((p) => p.playAgain === true);
    if (bothAccepted) {
      room.players.forEach((p) => {
        p.isReady = true;
        p.score = 0;
        p.wickets = 0;
        p.currentChoice = null;
        p.playAgain = null;
      });
      room.tossWinnerId = null;
      room.tossChoice = null;
      room.tossPrediction = null;
      room.coinFlipResult = null;
      room.batterId = null;
      room.bowlerId = null;
      room.targetRuns = null;
      room.moves = [];
      room.lastTurnResult = null;
      room.revealTime = null;

      room.status = "TOSS";
      return { resetToToss: true, resetToLobby: false };
    }

    return { resetToToss: false, resetToLobby: false };
  }
}

module.exports = { GameStateMachine };
