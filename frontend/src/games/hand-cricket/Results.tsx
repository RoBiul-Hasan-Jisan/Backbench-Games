"use client";

import { useEffect, useState } from "react";
import { Trophy, RefreshCw, LogOut, Award } from "lucide-react";
import confetti from "canvas-confetti";
import { MatchTimeline } from "./MatchTimeline";
import { soundSynthesizer } from "./soundSynthesizer";
import type { GameRoom } from "./types";

export function Results({
  room,
  currentPlayerId,
  onPlayAgain,
  onLeaveRoom,
}: {
  room: GameRoom;
  currentPlayerId: string;
  onPlayAgain: (accept: boolean) => void;
  onLeaveRoom: () => void;
}) {
  const [hasVotedRematch, setHasVotedRematch] = useState(false);
  const [rematchDecision, setRematchDecision] = useState<boolean | null>(null);

  const me = room.players.find((p) => p.id === currentPlayerId);
  const opponent = room.players.find((p) => p.id !== currentPlayerId);
  if (!me || !opponent) return null;

  const myScore = me.score;
  const opponentScore = opponent.score;

  const isWin = room.winnerId === currentPlayerId;
  const isLoss = room.winnerId !== null && room.winnerId !== currentPlayerId;
  const isDraw = room.winnerId === null && room.status === "RESULT";

  useEffect(() => {
    soundSynthesizer.init();
    if (isWin) {
      soundSynthesizer.playVictory();
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#2f4a6b", "#e8b923", "#c0392b", "#ffffff"],
      });
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([50, 50, 50, 150]);
      }
    } else if (isLoss) {
      soundSynthesizer.playDefeat();
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const opponentRematchState = room.players.find((p) => p.id !== currentPlayerId)?.playAgain;

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl space-y-8 rounded-2xl border border-paper-line bg-white/70 p-8">
        <div className="space-y-3 text-center">
          {isWin && (
            <div className="space-y-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-600">
                <Trophy className="h-8 w-8" />
              </div>
              <h1 className="text-4xl font-extrabold uppercase tracking-tight text-chalkboard-dark">
                Victory!
              </h1>
              <p className="text-sm text-chalkboard-dark/60">
                You outperformed your opponent and claimed the arena!
              </p>
            </div>
          )}

          {isLoss && (
            <div className="space-y-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-redpen/30 bg-redpen/10 text-redpen">
                <Award className="h-8 w-8" />
              </div>
              <h1 className="text-4xl font-extrabold uppercase tracking-tight text-chalkboard-dark">
                Defeated
              </h1>
              <p className="text-sm text-chalkboard-dark/60">
                Good game! Your opponent defended their lines well.
              </p>
            </div>
          )}

          {isDraw && (
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold uppercase tracking-tight text-chalkboard-dark">
                It's a TIE!
              </h1>
              <p className="text-sm text-chalkboard-dark/60">
                Incredible performance! Both sides locked scores.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 rounded-xl border border-paper-line bg-paper/60 p-5">
          <div className="border-r border-paper-line pr-2 text-center">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-chalkboard-dark/40">
              Your Score
            </span>
            <div className="mt-1 text-3xl font-black text-chalkboard-dark">{myScore}</div>
            <span className="text-[10px] font-medium text-chalkboard-dark/40">runs</span>
          </div>

          <div className="pl-2 text-center">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-chalkboard-dark/40">
              {opponent.nickname}
            </span>
            <div className="mt-1 text-3xl font-black text-chalkboard-dark">{opponentScore}</div>
            <span className="text-[10px] font-medium text-chalkboard-dark/40">runs</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="rounded-lg border border-paper-line bg-paper/60 p-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-chalkboard-dark/40">
              Deliveries
            </span>
            <div className="mt-0.5 text-sm font-extrabold text-chalkboard-dark">{room.moves.length}</div>
          </div>
          <div className="rounded-lg border border-paper-line bg-paper/60 p-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-chalkboard-dark/40">
              Target
            </span>
            <div className="mt-0.5 text-sm font-extrabold text-chalkboard-dark">
              {room.targetRuns || "--"}
            </div>
          </div>
        </div>

        <MatchTimeline room={room} currentPlayerId={currentPlayerId} />

        <div className="space-y-4 border-t border-paper-line pt-6">
          <h3 className="text-center text-xs font-bold uppercase tracking-wider text-chalkboard-dark/50">
            Rematch Selection
          </h3>

          {!hasVotedRematch ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                onClick={() => handleRematchChoice(true)}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-inkblue px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:brightness-110"
              >
                <RefreshCw className="h-4 w-4" /> Play Again
              </button>
              <button
                onClick={handleLeave}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-paper-line bg-white px-6 py-3 text-xs font-bold text-chalkboard-dark/60 transition hover:bg-chalkboard-dark/5"
              >
                <LogOut className="h-4 w-4" /> Leave Arena
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              {rematchDecision === true ? (
                <div className="rounded-xl border border-inkblue/20 bg-inkblue/5 p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-inkblue">
                    ✓ You voted to Play Again
                  </span>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-chalkboard-dark/40">
                    {opponentRematchState === true
                      ? "Starting new match..."
                      : `Waiting for ${opponent.nickname}'s decision...`}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-paper-line bg-paper/60 p-4 text-xs italic text-chalkboard-dark/50">
                  Voted to return home.
                </div>
              )}
            </div>
          )}

          {hasVotedRematch && rematchDecision === true && opponentRematchState === true && (
            <div className="flex items-center justify-center gap-1.5 text-center text-xs font-bold uppercase tracking-wider text-emerald-600">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Rematch Accepted! Spinning up a new
              coin toss...
            </div>
          )}
          {hasVotedRematch && rematchDecision === true && opponentRematchState === false && (
            <div className="text-center text-xs font-bold uppercase tracking-wider text-redpen">
              Opponent declined the rematch. Returning both to lobby...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
