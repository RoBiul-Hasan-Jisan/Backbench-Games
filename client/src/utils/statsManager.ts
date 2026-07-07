import type { MatchMetadata, MoveRecord } from '../shared';

export interface PlayerStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  runsScored: number;
  runsConceded: number;
  highestScore: number;
  highestChase: number;
  averageRuns: number;
  currentWinStreak: number;
  bestWinStreak: number;
  lastPlayed: number | null;
}

export interface MatchHistoryItem {
  metadata: MatchMetadata;
  moves: MoveRecord[];
}

const DEFAULT_STATS: PlayerStats = {
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  winRate: 0,
  runsScored: 0,
  runsConceded: 0,
  highestScore: 0,
  highestChase: 0,
  averageRuns: 0,
  currentWinStreak: 0,
  bestWinStreak: 0,
  lastPlayed: null,
};

export class StatsManager {
  /**
   * Retrieves player stats from LocalStorage
   */
  public static getStats(): PlayerStats {
    try {
      const statsStr = localStorage.getItem('hc_stats');
      if (statsStr) {
        return JSON.parse(statsStr);
      }
    } catch (e) {
      console.error('Error reading stats from LocalStorage', e);
    }
    return { ...DEFAULT_STATS };
  }

  /**
   * Retrieves match history list from LocalStorage
   */
  public static getMatchHistory(): MatchHistoryItem[] {
    try {
      const historyStr = localStorage.getItem('hc_match_history');
      if (historyStr) {
        return JSON.parse(historyStr);
      }
    } catch (e) {
      console.error('Error reading history from LocalStorage', e);
    }
    return [];
  }

  /**
   * Records a completed match, updating stats and history
   */
  public static recordMatch(
    metadata: MatchMetadata,
    moves: MoveRecord[],
    currentPlayerId: string
  ): PlayerStats {
    const stats = this.getStats();
    const history = this.getMatchHistory();

    const isHost = metadata.hostName === localStorage.getItem('hc_nickname');
    const myScore = isHost ? metadata.hostScore : metadata.guestScore;
    const opponentScore = isHost ? metadata.guestScore : metadata.hostScore;

    const isWin = metadata.winnerId === currentPlayerId;
    const isLoss = metadata.winnerId !== null && metadata.winnerId !== currentPlayerId;
    const isDraw = metadata.draw;

    // 1. Basic counts
    stats.gamesPlayed += 1;
    if (isWin) {
      stats.wins += 1;
      stats.currentWinStreak += 1;
      if (stats.currentWinStreak > stats.bestWinStreak) {
        stats.bestWinStreak = stats.currentWinStreak;
      }
    } else if (isLoss) {
      stats.losses += 1;
      stats.currentWinStreak = 0;
    } else if (isDraw) {
      stats.draws += 1;
      stats.currentWinStreak = 0;
    }

    stats.winRate = Math.round((stats.wins / stats.gamesPlayed) * 100);

    // 2. Runs Scored / Conceded
    stats.runsScored += myScore;
    stats.runsConceded += opponentScore;

    // 3. Highest Score
    if (myScore > stats.highestScore) {
      stats.highestScore = myScore;
    }

    // 4. Highest Chase
    // Chasing means batting second. We were batting second if:
    // - We were the guest and the toss winner chose bat (making us bowler first, batter second) or chose bowl (making us batter first, bowler second).
    // Let's check which player ID batted second in moves.
    // If the last move's batter was us, it means we batted second!
    if (moves.length > 0) {
      const lastMove = moves[moves.length - 1];
      const weBattedSecond = lastMove.batterId === currentPlayerId && metadata.hostScore > 0 && metadata.guestScore > 0; // standard innings completed check
      if (weBattedSecond && isWin && myScore > stats.highestChase) {
        stats.highestChase = myScore;
      }
    }

    // 5. Average Runs per Innings
    // We assume we batted in every game.
    stats.averageRuns = parseFloat((stats.runsScored / stats.gamesPlayed).toFixed(2));

    // 6. Last Played Timestamp
    stats.lastPlayed = Date.now();

    // Save stats
    localStorage.setItem('hc_stats', JSON.stringify(stats));

    // 7. Add to history (keep top 50 matches)
    history.unshift({ metadata, moves });
    if (history.length > 50) {
      history.pop();
    }
    localStorage.setItem('hc_match_history', JSON.stringify(history));

    return stats;
  }

  /**
   * Resets all stats and clears match history
   */
  public static resetAll(): void {
    localStorage.removeItem('hc_stats');
    localStorage.removeItem('hc_match_history');
  }
}
