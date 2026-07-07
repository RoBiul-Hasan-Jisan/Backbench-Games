// Hand Cricket types - merged from HandCricket-Arena's `shared/` package.
// These describe the server-authoritative room shape sent over the wire; the
// backend implementation lives at backend/games/handCricket/*.js.

export type GameState =
  | "WAITING"
  | "LOBBY"
  | "READY"
  | "TOSS"
  | "BAT_OR_BOWL"
  | "FIRST_INNINGS"
  | "CHANGE_INNINGS"
  | "SECOND_INNINGS"
  | "RESULT"
  | "REMATCH";

export interface MoveRecord {
  turnNumber: number;
  batterChoice: number;
  bowlerChoice: number;
  runsAdded: number;
  isOut: boolean;
  batterId: string;
}

export interface Player {
  id: string;
  nickname: string;
  socketId: string | null;
  isHost: boolean;
  isReady: boolean;
  score: number;
  wickets: number;
  currentChoice: number | null;
  playAgain: boolean | null;
  connected: boolean;
  disconnectedAt: number | null;
}

export interface GameRoom {
  code: string;
  status: GameState;
  players: Player[];
  tossWinnerId: string | null;
  tossChoice: "bat" | "bowl" | null;
  tossPrediction: "heads" | "tails" | null;
  coinFlipResult: "heads" | "tails" | null;
  batterId: string | null;
  bowlerId: string | null;
  targetRuns: number | null;
  moves: MoveRecord[];
  lastActive: number;
  revealTime: number | null;
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

export interface AckResponse<T = any> {
  success: boolean;
  error?: string;
  data?: T;
}

export type ConnectionState = "connected" | "reconnecting" | "disconnected";
