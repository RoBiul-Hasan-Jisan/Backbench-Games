// Hand Cricket - client-side state machine for "Practice vs Computer".
//
// This is a straight port of backend/games/handCricket/stateMachine.js.
// It exists so the practice mode can reuse the exact same rules (and the
// exact same GameScreen/Toss/Results components) as real multiplayer,
// without needing a server round-trip. Keep this in sync with the backend
// file if the rules ever change.

import type { GameRoom, Player } from "./types";

export const HUMAN_ID = "human";
export const BOT_ID = "computer";

const VALID_TRANSITIONS: Record<string, string[]> = {
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

function canTransition(current: string, target: string): boolean {
  return (VALID_TRANSITIONS[current] || []).includes(target);
}

function transitionTo(room: GameRoom, target: GameRoom["status"]) {
  if (!canTransition(room.status, target)) {
    throw new Error(`Illegal state transition from ${room.status} to ${target}`);
  }
  room.status = target;
  room.lastActive = Date.now();
}

/** Creates a fresh practice room: one human player, one bot, ready for TOSS. */
export function createInitialRoom(nickname: string): GameRoom {
  const makePlayer = (id: string, name: string, isHost: boolean): Player => ({
    id,
    nickname: name,
    socketId: null,
    isHost,
    isReady: true,
    score: 0,
    wickets: 0,
    currentChoice: null,
    playAgain: null,
    connected: true,
    disconnectedAt: null,
  });

  return {
    code: "PRACTICE",
    status: "TOSS",
    players: [makePlayer(HUMAN_ID, nickname || "You", true), makePlayer(BOT_ID, "Computer", false)],
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
}

export function cloneRoom(room: GameRoom): GameRoom {
  if (typeof structuredClone === "function") return structuredClone(room);
  return JSON.parse(JSON.stringify(room));
}

/** Executes the coin flip for the toss phase. */
function handleCoinToss(room: GameRoom, prediction: "heads" | "tails") {
  if (room.status !== "TOSS") throw new Error("Coin flip can only happen in TOSS state");

  const host = room.players.find((p) => p.isHost);
  const guest = room.players.find((p) => !p.isHost);
  if (!host || !guest) throw new Error("Toss requires two players");

  const result: "heads" | "tails" = Math.random() < 0.5 ? "heads" : "tails";
  const won = result === prediction;
  const winnerId = won ? guest.id : host.id;

  room.coinFlipResult = result;
  room.tossPrediction = prediction;
  room.tossWinnerId = winnerId;

  transitionTo(room, "BAT_OR_BOWL");
  return { winnerId, result };
}

/** Registers whether the toss winner wants to Bat or Bowl. */
function handleTossDecision(room: GameRoom, deciderId: string, choice: "bat" | "bowl") {
  if (room.status !== "BAT_OR_BOWL") throw new Error("Toss decision can only happen in BAT_OR_BOWL state");
  if (room.tossWinnerId !== deciderId) throw new Error("Only the toss winner can make the decision");

  const decider = room.players.find((p) => p.id === deciderId);
  const opponent = room.players.find((p) => p.id !== deciderId);
  if (!decider || !opponent) throw new Error("Players not found");

  room.tossChoice = choice;

  if (choice === "bat") {
    room.batterId = decider.id;
    room.bowlerId = opponent.id;
  } else {
    room.batterId = opponent.id;
    room.bowlerId = decider.id;
  }

  room.players.forEach((p) => {
    p.score = 0;
    p.wickets = 0;
    p.currentChoice = null;
    p.playAgain = null;
  });
  room.moves = [];
  room.lastTurnResult = null;
  room.targetRuns = null;

  transitionTo(room, "FIRST_INNINGS");
}

/** Registers a choice for a player. Returns { resolved, revealTime? }. */
function submitChoice(room: GameRoom, playerId: string, choice: number) {
  if (room.status !== "FIRST_INNINGS" && room.status !== "SECOND_INNINGS") {
    throw new Error("Moves can only be submitted during active innings");
  }
  if (choice < 1 || choice > 6) throw new Error("Move choice must be between 1 and 6");

  const player = room.players.find((p) => p.id === playerId);
  if (!player) throw new Error("Player not in this room");

  player.currentChoice = choice;
  room.lastActive = Date.now();

  const bothSubmitted = room.players.every((p) => p.currentChoice !== null);
  if (bothSubmitted) {
    const serverTime = Date.now();
    const shakeCushionMs = 2500; // 2.5s countdown + shake animation cushion, matches the backend.
    room.revealTime = serverTime + shakeCushionMs;
    return { resolved: true, revealTime: room.revealTime };
  }
  return { resolved: false, revealTime: undefined as number | undefined };
}

/** Authoritatively resolves the active choices, calculating score increases or outs. */
function resolveTurn(room: GameRoom) {
  const host = room.players.find((p) => p.isHost);
  const guest = room.players.find((p) => !p.isHost);
  const batter = room.players.find((p) => p.id === room.batterId);
  const bowler = room.players.find((p) => p.id === room.bowlerId);
  if (!batter || !bowler || !host || !guest) throw new Error("Missing batter or bowler roles");

  const batChoice = batter.currentChoice;
  const bowlChoice = bowler.currentChoice;
  if (batChoice === null || bowlChoice === null) throw new Error("Not all choices submitted");

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
  room.lastTurnResult = { batterChoice: batChoice, bowlerChoice: bowlChoice, runsAdded, isOut, batterId: batter.id };

  room.players.forEach((p) => (p.currentChoice = null));

  let inningsOver = false;
  let gameOver = false;
  let winnerId: string | null = null;

  if (room.status === "FIRST_INNINGS") {
    if (isOut) {
      inningsOver = true;
      room.targetRuns = batter.score + 1;
      room.batterId = bowler.id;
      room.bowlerId = batter.id;
      transitionTo(room, "CHANGE_INNINGS");
    }
  } else if (room.status === "SECOND_INNINGS") {
    const target = room.targetRuns as number;
    if (batter.score >= target) {
      gameOver = true;
      winnerId = batter.id;
      room.winnerId = winnerId;
      room.draw = false;
      transitionTo(room, "RESULT");
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
      transitionTo(room, "RESULT");
    }
  }

  room.lastActive = Date.now();
  return { batterChoice: batChoice, bowlerChoice: bowlChoice, runsAdded, isOut, inningsOver, gameOver, winnerId };
}

/** Progresses the game from CHANGE_INNINGS to SECOND_INNINGS. */
function startSecondInnings(room: GameRoom) {
  if (room.status !== "CHANGE_INNINGS") throw new Error("Can only start second innings from CHANGE_INNINGS state");
  const currentBatter = room.players.find((p) => p.id === room.batterId)!;
  currentBatter.score = 0;
  currentBatter.wickets = 0;
  transitionTo(room, "SECOND_INNINGS");
}

/** Registers a play-again response. */
function handlePlayAgain(room: GameRoom, playerId: string, accept: boolean) {
  if (room.status !== "RESULT" && room.status !== "REMATCH") {
    throw new Error("Rematch choices can only be registered after a match ends");
  }
  if (room.status === "RESULT") transitionTo(room, "REMATCH");

  const player = room.players.find((p) => p.id === playerId);
  if (!player) throw new Error("Player not in this room");

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

export const HandCricketEngine = {
  handleCoinToss,
  handleTossDecision,
  submitChoice,
  resolveTurn,
  startSecondInnings,
  handlePlayAgain,
};

/**
 * Picks the bot's move for the current delivery.
 * - Bowling: mostly random, but occasionally "reads" the human's most
 *   frequent number once there's enough history (keeps it beatable).
 * - Batting: mostly random, but leans toward the winning number when the
 *   chase is close, and toward bigger numbers when it needs quick runs.
 */
export function pickBotMove(room: GameRoom, humanHistory: number[]): number {
  const numbers = [1, 2, 3, 4, 5, 6];
  const randomPick = () => numbers[Math.floor(Math.random() * 6)];
  const isBotBatting = room.batterId === BOT_ID;

  if (!isBotBatting) {
    if (humanHistory.length >= 3 && Math.random() < 0.35) {
      const freq: Record<number, number> = {};
      humanHistory.forEach((n) => (freq[n] = (freq[n] || 0) + 1));
      const mostCommon = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
      if (mostCommon) return Number(mostCommon[0]);
    }
    return randomPick();
  }

  if (room.status === "SECOND_INNINGS" && room.targetRuns) {
    const bot = room.players.find((p) => p.id === BOT_ID)!;
    const remaining = room.targetRuns - bot.score;
    if (remaining >= 1 && remaining <= 6) {
      // Go for the win when it's in reach.
      return Math.random() < 0.6 ? remaining : randomPick();
    }
    if (remaining > 15 && Math.random() < 0.55) {
      return Math.random() < 0.5 ? 6 : 4;
    }
  }

  return randomPick();
}
