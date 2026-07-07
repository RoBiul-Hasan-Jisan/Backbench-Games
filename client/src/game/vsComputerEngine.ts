import type { GameRoom, MoveRecord, Player } from '../shared';

export type CpuDifficulty = 'easy' | 'medium' | 'hard';

export const HUMAN_ID = 'human-player';
export const CPU_ID = 'cpu-player';

function makePlayer(id: string, nickname: string, isHost: boolean): Player {
  return {
    id,
    nickname,
    socketId: null,
    isHost,
    isReady: true,
    score: 0,
    wickets: 0,
    currentChoice: null,
    playAgain: null,
    connected: true,
    disconnectedAt: null,
  };
}

export function createVsComputerRoom(nickname: string, cpuName: string): GameRoom {
  return {
    code: 'CPU-VS',
    status: 'TOSS',
    players: [makePlayer(HUMAN_ID, nickname, true), makePlayer(CPU_ID, cpuName, false)],
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

/**
 * Tracks the number-picking history so the "hard" CPU can adapt to human tendencies.
 * This intentionally lives outside the room object since it isn't part of shared state.
 */
export class ComputerBrain {
  private difficulty: CpuDifficulty;
  private humanHistory: number[] = [];

  constructor(difficulty: CpuDifficulty) {
    this.difficulty = difficulty;
  }

  setDifficulty(difficulty: CpuDifficulty) {
    this.difficulty = difficulty;
  }

  recordHumanChoice(choice: number) {
    this.humanHistory.push(choice);
    if (this.humanHistory.length > 12) this.humanHistory.shift();
  }

  /** Returns the number (1-6) the CPU plays this ball, whether batting or bowling. */
  chooseMove(context: {
    isCpuBatting: boolean;
    cpuScore: number;
    targetRuns: number | null;
    isSecondInnings: boolean;
  }): number {
    const nums = [1, 2, 3, 4, 5, 6];

    if (this.difficulty === 'easy') {
      return nums[Math.floor(Math.random() * nums.length)];
    }

    if (this.difficulty === 'medium') {
      // Mildly favors "safer" middle numbers, still mostly random.
      const weights = [1, 2, 3, 3, 2, 1]; // weight per number 1..6
      return weightedPick(nums, weights);
    }

    // HARD difficulty: adapts to the human's most frequent recent picks.
    const freq: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    for (const c of this.humanHistory) freq[c]++;

    if (!context.isCpuBatting) {
      // CPU is bowling: bias towards numbers the human has picked most (to match & dismiss them).
      const weights = nums.map((n) => 1 + freq[n] * 2.2);
      return weightedPick(nums, weights);
    }

    // CPU is batting: pick smarter based on chase situation.
    if (context.isSecondInnings && context.targetRuns !== null) {
      const needed = context.targetRuns - context.cpuScore;
      if (needed <= 1) {
        // Any run wins it, but a single is safest.
        return weightedPick(nums, [4, 2, 1, 1, 1, 1]);
      }
      if (needed <= 6) {
        // Go straight for the winning number occasionally, otherwise safe-ish numbers.
        const weights = nums.map((n) => (n === needed ? 5 : 1));
        return weightedPick(nums, weights);
      }
    }
    // Otherwise avoid the human's most-common bowling numbers (harder to guess, but still
    // avoid the numbers the human bowls most since a match there means the CPU is out).
    const weights = nums.map((n) => Math.max(0.4, 3 - freq[n] * 1.2));
    return weightedPick(nums, weights);
  }
}

function weightedPick(nums: number[], weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < nums.length; i++) {
    r -= weights[i];
    if (r <= 0) return nums[i];
  }
  return nums[nums.length - 1];
}

/** Minimal local mirror of the server's GameStateMachine, scoped to a 2-player CPU match. */
export class LocalCricketEngine {
  static handleCoinToss(room: GameRoom, prediction: 'heads' | 'tails'): { winnerId: string; result: 'heads' | 'tails' } {
    const result: 'heads' | 'tails' = Math.random() < 0.5 ? 'heads' : 'tails';
    const won = result === prediction;
    // Human always calls the toss in vs-computer mode.
    const winnerId = won ? HUMAN_ID : CPU_ID;
    room.coinFlipResult = result;
    room.tossPrediction = prediction;
    room.tossWinnerId = winnerId;
    room.status = 'BAT_OR_BOWL';
    return { winnerId, result };
  }

  static handleTossDecision(room: GameRoom, deciderId: string, choice: 'bat' | 'bowl') {
    const decider = room.players.find((p) => p.id === deciderId)!;
    const opponent = room.players.find((p) => p.id !== deciderId)!;

    room.tossChoice = choice;
    if (choice === 'bat') {
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
    room.status = 'FIRST_INNINGS';
  }

  /** Resolves a turn immediately given both submitted choices (no network round trip). */
  static resolveTurn(
    room: GameRoom,
    humanChoice: number,
    cpuChoice: number
  ): {
    batterChoice: number;
    bowlerChoice: number;
    runsAdded: number;
    isOut: boolean;
    inningsOver: boolean;
    gameOver: boolean;
    winnerId: string | null;
  } {
    const batter = room.players.find((p) => p.id === room.batterId)!;
    const bowler = room.players.find((p) => p.id === room.bowlerId)!;

    const batChoice = batter.id === HUMAN_ID ? humanChoice : cpuChoice;
    const bowlChoice = bowler.id === HUMAN_ID ? humanChoice : cpuChoice;

    const turnNumber = room.moves.length + 1;
    const isOut = batChoice === bowlChoice;
    const runsAdded = isOut ? 0 : batChoice;

    if (!isOut) {
      batter.score += runsAdded;
    } else {
      batter.wickets += 1;
    }

    const record: MoveRecord = {
      turnNumber,
      batterChoice: batChoice,
      bowlerChoice: bowlChoice,
      runsAdded,
      isOut,
      batterId: batter.id,
    };
    room.moves.push(record);
    room.lastTurnResult = { ...record };
    room.players.forEach((p) => (p.currentChoice = null));

    let inningsOver = false;
    let gameOver = false;
    let winnerId: string | null = null;

    if (room.status === 'FIRST_INNINGS') {
      if (isOut) {
        inningsOver = true;
        room.targetRuns = batter.score + 1;
        room.batterId = bowler.id;
        room.bowlerId = batter.id;
        room.status = 'CHANGE_INNINGS';
      }
    } else if (room.status === 'SECOND_INNINGS') {
      const target = room.targetRuns!;
      if (batter.score >= target) {
        gameOver = true;
        winnerId = batter.id;
        room.winnerId = winnerId;
        room.draw = false;
        room.status = 'RESULT';
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
        room.status = 'RESULT';
      }
    }

    room.lastActive = Date.now();
    return { batterChoice: batChoice, bowlerChoice: bowlChoice, runsAdded, isOut, inningsOver, gameOver, winnerId };
  }

  static startSecondInnings(room: GameRoom) {
    const currentBatter = room.players.find((p) => p.id === room.batterId)!;
    currentBatter.score = 0;
    currentBatter.wickets = 0;
    room.status = 'SECOND_INNINGS';
  }
}
