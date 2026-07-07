export type GameState =
  | 'WAITING'
  | 'LOBBY'
  | 'READY'
  | 'TOSS'
  | 'BAT_OR_BOWL'
  | 'FIRST_INNINGS'
  | 'CHANGE_INNINGS'
  | 'SECOND_INNINGS'
  | 'RESULT'
  | 'REMATCH';

export interface MoveRecord {
  turnNumber: number;
  batterChoice: number;
  bowlerChoice: number;
  runsAdded: number;
  isOut: boolean;
  batterId: string;
}

export interface MatchMetadata {
  matchId: string;
  roomCode: string;
  startTime: number;
  endTime: number;
  duration: number;
  winnerId: string | null;
  draw: boolean;
  hostName: string;
  guestName: string;
  hostScore: number;
  guestScore: number;
}
