import React, { useEffect, useState } from 'react';
import { Trophy, RefreshCw, LogOut, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { GameRoom } from '../shared';
import { MatchTimeline } from '../components/MatchTimeline';
import { StatsManager } from '../utils/statsManager';
import { soundSynthesizer } from '../utils/soundSynthesizer';

interface ResultsProps {
  room: GameRoom;
  currentPlayerId: string;
  onPlayAgain: (accept: boolean) => void;
  onLeaveRoom: () => void;
}

export const Results: React.FC<ResultsProps> = ({
  room,
  currentPlayerId,
  onPlayAgain,
  onLeaveRoom,
}) => {
  const [hasVotedRematch, setHasVotedRematch] = useState<boolean>(false);
  const [rematchDecision, setRematchDecision] = useState<boolean | null>(null);

  const me = room.players.find((p) => p.id === currentPlayerId)!;
  const opponent = room.players.find((p) => p.id !== currentPlayerId)!;

  const isHost = me.isHost;
  const myScore = me.score;
  const opponentScore = opponent.score;

  // Determine winner details
  // Check who has more score or who is winnerId.
  // Wait, in our StateMachine, the server calculates `winnerId` and sets it in results.
  // Let's check room.moves to find out if there's a winnerId.
  // We can look at the room state directly or calculate from scores.
  // But our FSM resolves winnerId and sets it.
  // Let's check how FSM declares game end:
  // - WinnerId is set to batter.id (if they chased successfully) or bowler.id (if they defended).
  // - If it was a tie, winnerId is null.
  const isWin = room.winnerId === currentPlayerId;
  const isLoss = room.winnerId !== null && room.winnerId !== currentPlayerId;
  const isDraw = room.winnerId === null && room.status === 'RESULT';

  // Play result sound on mount and trigger confetti on win
  useEffect(() => {
    soundSynthesizer.init();
    if (isWin) {
      soundSynthesizer.playVictory();
      
      // Fire confetti spray!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#00f0ff', '#2563eb', '#ff007f', '#ffffff']
      });

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([50, 50, 50, 150]);
      }
    } else if (isLoss) {
      soundSynthesizer.playDefeat();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    }

    // Save metadata to local stats once
    const matchId = `match_${room.code}_${Date.now()}`;
    const hostScore = isHost ? myScore : opponentScore;
    const guestScore = isHost ? opponentScore : myScore;
    
    // We only record the match if we haven't already. Since we mount the Results view once per match,
    // we can save it. Let's make sure it records only once by setting a session flag.
    const recordFlag = sessionStorage.getItem(`recorded_${room.code}_${room.moves.length}`);
    if (!recordFlag) {
      const metadata = {
        matchId,
        roomCode: room.code,
        startTime: Date.now() - (room.moves.length * 4000), // estimate start
        endTime: Date.now(),
        duration: room.moves.length * 4,
        winnerId: room.winnerId,
        draw: isDraw,
        hostName: isHost ? me.nickname : opponent.nickname,
        guestName: isHost ? opponent.nickname : me.nickname,
        hostScore,
        guestScore,
      };

      StatsManager.recordMatch(metadata, room.moves, currentPlayerId);
      sessionStorage.setItem(`recorded_${room.code}_${room.moves.length}`, 'true');
    }
  }, [room.winnerId]);

  const handleRematchChoice = (accept: boolean) => {
    soundSynthesizer.playClick();
    setHasVotedRematch(true);
    setRematchDecision(accept);
    onPlayAgain(accept);
  };

  const handleLeave = () => {
    soundSynthesizer.playClick();
    onLeaveRoom();
  };

  // Determine Opponent's Rematch state
  const opponentRematchState = room.players.find((p) => p.id !== currentPlayerId)?.playAgain;

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-xl glass-panel p-8 rounded-3xl border border-slate-700/20 shadow-glass space-y-8 relative overflow-hidden">
        
        {/* Glow Effects */}
        {isWin && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-4 bg-emerald-500/20 rounded-full blur-2xl"></div>}
        {isLoss && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-4 bg-red-500/20 rounded-full blur-2xl"></div>}

        {/* Victory/Defeat Banner */}
        <div className="text-center space-y-3">
          {isWin && (
            <div className="space-y-2">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                <Trophy className="w-8 h-8 stroke-[2.5] animate-bounce" />
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white uppercase">
                Victory!
              </h1>
              <p className="text-slate-400 text-sm">
                You outperformed your opponent and claimed the arena!
              </p>
            </div>
          )}

          {isLoss && (
            <div className="space-y-2">
              <div className="w-16 h-16 bg-red-500/10 rounded-full border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
                <Award className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white uppercase">
                Defeated
              </h1>
              <p className="text-slate-400 text-sm">
                Good game! Your opponent defended their lines well.
              </p>
            </div>
          )}

          {isDraw && (
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight text-white uppercase">
                It's a TIE!
              </h1>
              <p className="text-slate-400 text-sm">
                Incredible performance! Both teams locked scores.
              </p>
            </div>
          )}
        </div>

        {/* Final Scoreboard Stats Grid */}
        <div className="grid grid-cols-2 gap-4 bg-slate-950/80 p-5 rounded-2xl border border-slate-850">
          <div className="text-center border-r border-slate-900 pr-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Your Score
            </span>
            <div className="text-3xl font-black text-white mt-1">
              {myScore}
            </div>
            <span className="text-3xs text-slate-400 font-medium">runs</span>
          </div>

          <div className="text-center pl-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              {opponent.nickname}
            </span>
            <div className="text-3xl font-black text-white mt-1">
              {opponentScore}
            </div>
            <span className="text-3xs text-slate-400 font-medium">runs</span>
          </div>
        </div>

        {/* Match statistics row */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="glass-panel p-3 rounded-xl">
            <span className="text-3xs text-slate-500 uppercase tracking-widest font-bold">Deliveries</span>
            <div className="text-sm font-extrabold text-white mt-0.5">{room.moves.length}</div>
          </div>
          <div className="glass-panel p-3 rounded-xl">
            <span className="text-3xs text-slate-500 uppercase tracking-widest font-bold">Target</span>
            <div className="text-sm font-extrabold text-white mt-0.5">{room.targetRuns || '--'}</div>
          </div>
          <div className="glass-panel p-3 rounded-xl">
            <span className="text-3xs text-slate-500 uppercase tracking-widest font-bold">Avg Choice</span>
            <div className="text-sm font-extrabold text-white mt-0.5">
              {room.moves.length > 0
                ? (room.moves.reduce((acc, m) => acc + (m.batterId === currentPlayerId ? m.batterChoice : m.bowlerChoice), 0) / room.moves.length).toFixed(1)
                : '0.0'}
            </div>
          </div>
        </div>

        {/* Turn Timeline log */}
        <MatchTimeline room={room} currentPlayerId={currentPlayerId} />

        {/* Rematch flow controls */}
        <div className="border-t border-slate-800 pt-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
            Rematch Selection
          </h3>

          {!hasVotedRematch ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => handleRematchChoice(true)}
                className="py-3 px-6 bg-gradient-to-r from-neonCyan to-neonBlue text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.15)] hover:scale-[1.01] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Play Again
              </button>
              <button
                onClick={handleLeave}
                className="py-3 px-6 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Leave Arena
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              {rematchDecision === true ? (
                <div className="p-4 bg-neonCyan/5 border border-neonCyan/20 rounded-xl">
                  <span className="text-xs text-neonCyan font-bold uppercase tracking-wider">
                    ✓ You voted to Play Again
                  </span>
                  <p className="text-3xs text-slate-500 mt-1 uppercase tracking-widest font-mono">
                    {opponentRematchState === true
                      ? 'Starting new match...'
                      : `Waiting for ${opponent.nickname}'s decision...`}
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-500 italic">
                  Voted to return home.
                </div>
              )}
            </div>
          )}

          {/* Opponent decision state display */}
          {hasVotedRematch && rematchDecision === true && opponentRematchState === true && (
            <div className="text-center text-xs text-emerald-400 font-bold uppercase tracking-wider animate-pulse flex items-center justify-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Rematch Accepted! Spawning new coin toss...
            </div>
          )}
          {hasVotedRematch && rematchDecision === true && opponentRematchState === false && (
            <div className="text-center text-xs text-red-400 font-bold uppercase tracking-wider">
              Opponent declined the rematch. Returning both to lobby...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
