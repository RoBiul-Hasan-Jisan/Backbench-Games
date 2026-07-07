import type { GameState, MoveRecord } from './game.js';

export interface Player {
  id: string; // cryptographically secure UUID
  nickname: string;
  socketId: string | null;
  isHost: boolean;
  isReady: boolean;
  score: number;
  wickets: number; // standard hand cricket is 1 wicket (out = innings end)
  currentChoice: number | null; // currently submitted choice for the turn (1-6)
  playAgain: boolean | null; // rematch choice (true = accept, false = decline, null = waiting)
  connected: boolean;
  disconnectedAt: number | null; // epoch time when disconnected for grace period
}

export interface GameRoom {
  code: string;
  status: GameState;
  players: Player[];
  tossWinnerId: string | null;
  tossChoice: 'bat' | 'bowl' | null;
  tossPrediction: 'heads' | 'tails' | null; // guest choice
  coinFlipResult: 'heads' | 'tails' | null;
  batterId: string | null;
  bowlerId: string | null;
  targetRuns: number | null; // Inns 1 Score + 1
  moves: MoveRecord[];
  lastActive: number; // for room cleanup garbage collection
  revealTime: number | null; // synchronized timestamp (ms) for client hand animation start
  winnerId: string | null;
  draw: boolean;
  lastTurnResult: {
    batterChoice: number;
    bowlerChoice: number;
    runsAdded: number;
    isOut: boolean;
    batterId: string;
  } | null;
}

// ---------- Tic Tac Toe (multiplayer) ----------

export type TttBoardSize = 3 | 5 | 8;
export type TttMark = 'X' | 'O';
export type TttStatus = 'WAITING' | 'LOBBY' | 'PLAYING' | 'RESULT';

export interface TttPlayer {
  id: string;
  nickname: string;
  socketId: string | null;
  isHost: boolean;
  mark: TttMark | null;
  wins: number;
  connected: boolean;
  disconnectedAt: number | null;
}

export interface TttRoom {
  code: string;
  status: TttStatus;
  boardSize: TttBoardSize;
  board: (TttMark | null)[];
  players: TttPlayer[];
  turnPlayerId: string | null;
  winnerId: string | null;
  draw: boolean;
  winLine: number[] | null;
  draws: number;
  lastActive: number;
}
