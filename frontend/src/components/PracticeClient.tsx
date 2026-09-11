"use client";

import { useState } from "react";
import Link from "next/link";
import TicTacToeBoard from "@/games/tic-tac-toe/TicTacToeBoard";
import { checkWinner, pickAiMove, type Cell } from "@/games/tic-tac-toe/logic";
import RPSGame from "@/games/rock-paper-scissors/RPSGame";
import { HandCricketPractice } from "@/games/hand-cricket/HandCricketPractice";

export default function PracticeClient({ gameId }: { gameId: string }) {
  if (gameId === "tic-tac-toe") return <TicTacToePractice />;
  if (gameId === "rock-paper-scissors") return <RPSPractice />;
  if (gameId === "hand-cricket") return <HandCricketPractice />;

  return (
    <main className="bg-notebook flex min-h-screen items-center justify-center px-6 text-center">
      <div>
        <p className="mb-4 text-chalkboard-dark/60">
          Practice mode isn't wired up for this game yet.
        </p>
        <Link href={`/play/${gameId}`} className="font-semibold text-inkblue">
          Back to lobby
        </Link>
      </div>
    </main>
  );
}

function TicTacToePractice() {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<"X" | "O">("X"); // human is always X
  const result = checkWinner(board);

  function handleCellClick(index: number) {
    if (result || board[index] || turn !== "X") return;

    const next = [...board];
    next[index] = "X";
    setBoard(next);

    const afterHuman = checkWinner(next);
    if (afterHuman) return;

    setTurn("O");
    setTimeout(() => {
      const aiIndex = pickAiMove(next, "O");
      const withAi = [...next];
      withAi[aiIndex] = "O";
      setBoard(withAi);
      setTurn("X");
    }, 500);
  }

  function reset() {
    setBoard(Array(9).fill(null));
    setTurn("X");
  }

  return (
    <main className="bg-notebook min-h-screen px-6 py-16 text-center">
      <p className="mb-1 font-mono text-xs uppercase tracking-widest text-wood">
        Practice
      </p>
      <h1 className="mb-8 text-2xl font-semibold text-chalkboard-dark">
        Tic Tac Toe vs Computer
      </h1>

      <p className="mb-4 font-mono text-sm text-chalkboard-dark/50">
        {result
          ? result.winner === "draw"
            ? "Draw!"
            : result.winner === "X"
            ? "You win!"
            : "Computer wins."
          : turn === "X"
          ? "Your turn"
          : "Computer thinking..."}
      </p>

      <TicTacToeBoard
        board={board}
        winLine={result?.line ?? null}
        disabled={!!result || turn !== "X"}
        onCellClick={handleCellClick}
      />

      <button
        onClick={reset}
        className="mt-8 rounded-md bg-pencil px-6 py-2 font-semibold text-chalkboard-dark hover:brightness-105"
      >
        Play Again
      </button>
    </main>
  );
}

const BEATS: Record<string, string> = { rock: "scissors", scissors: "paper", paper: "rock" };

function RPSPractice() {
  const [scores, setScores] = useState({ you: 0, cpu: 0 });
  const [round, setRound] = useState<{ you: string; cpu: string; winner: "you" | "cpu" | "draw" } | null>(
    null
  );
  const [picked, setPicked] = useState(false);

  function handlePick(pick: string) {
    if (picked) return;
    setPicked(true);

    const options = ["rock", "paper", "scissors"];
    const cpuPick = options[Math.floor(Math.random() * options.length)];

    let winner: "you" | "cpu" | "draw" = "draw";
    if (pick !== cpuPick) winner = BEATS[pick] === cpuPick ? "you" : "cpu";

    setTimeout(() => {
      setRound({ you: pick, cpu: cpuPick, winner });
      if (winner !== "draw") {
        setScores((s) => ({ ...s, [winner]: s[winner] + 1 }));
      }
    }, 400);
  }

  function nextRound() {
    setRound(null);
    setPicked(false);
  }

  return (
    <main className="bg-notebook min-h-screen px-6 py-16 text-center">
      <p className="mb-1 font-mono text-xs uppercase tracking-widest text-wood">
        Practice
      </p>
      <h1 className="mb-2 text-2xl font-semibold text-chalkboard-dark">
        Rock Paper Scissors vs Computer
      </h1>
      <p className="mb-8 font-mono text-sm text-chalkboard-dark/50">
        You {scores.you} — {scores.cpu} Computer
      </p>

      {round ? (
        <div>
          <p className="mb-4 text-lg font-semibold text-chalkboard-dark">
            {round.winner === "draw"
              ? "Draw — go again!"
              : round.winner === "you"
              ? "You win this round!"
              : "Computer wins this round."}
          </p>
          <p className="mb-6 text-sm text-chalkboard-dark/60">
            You picked {round.you} · Computer picked {round.cpu}
          </p>
          <button
            onClick={nextRound}
            className="rounded-md bg-pencil px-6 py-2 font-semibold text-chalkboard-dark hover:brightness-105"
          >
            Next Round
          </button>
        </div>
      ) : (
        <RPSGame hasPicked={picked} disabled={false} lastRoundResult={null} onPick={handlePick} />
      )}
    </main>
  );
}
