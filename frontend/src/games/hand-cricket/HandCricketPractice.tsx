"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bot } from "lucide-react";
import { useHandCricketPractice } from "./useHandCricketPractice";
import { HUMAN_ID } from "./botEngine";
import { Toss } from "./Toss";
import { GameScreen } from "./GameScreen";
import { Results } from "./Results";
import { ConnectionAlert } from "./ConnectionAlert";
import type { GameRoom } from "./types";

export function HandCricketPractice() {
  const [name, setName] = useState("");
  const {
    room,
    error,
    setError,
    startPractice,
    resetPractice,
    submitTossDecision,
    submitMove,
    startSecondInnings,
    submitRematch,
    socket,
    getServerTime,
  } = useHandCricketPractice();

  // A declined rematch resets the engine to LOBBY, which this mode doesn't
  // render - just bounce back to the start screen instead.
  useEffect(() => {
    if (room?.status === "LOBBY") resetPractice();
  }, [room?.status, resetPractice]);

  const handleStart = () => startPractice(name.trim() || "You");

  return (
    <main className="bg-notebook min-h-screen px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex items-center justify-between border-b border-paper-line pb-4">
          <Link href="/play/hand-cricket" className="font-mono text-xs uppercase tracking-widest text-wood">
            Hand Cricket · Practice
          </Link>
          {room && (
            <ConnectionAlert
              connectionState="connected"
              room={room}
              currentPlayerId={HUMAN_ID}
              onExit={resetPractice}
            />
          )}
        </header>

        {error && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-redpen/30 bg-redpen/10 p-4 text-sm text-redpen">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="rounded px-2 py-1 text-xs font-bold uppercase hover:bg-redpen/10"
            >
              Dismiss
            </button>
          </div>
        )}

        {!room ? (
          <div className="mx-auto max-w-md text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-paper-line bg-white/70">
                <Bot className="h-7 w-7 text-inkblue" />
              </div>
            </div>
            <p className="mb-2 text-2xl font-semibold text-chalkboard-dark">Practice vs Computer</p>
            <p className="mb-8 text-sm text-chalkboard-dark/60">
              Full toss, innings and all — just you against the machine. No opponent needed.
            </p>
            <div className="space-y-4 rounded-lg border border-paper-line bg-white/70 p-6 text-left">
              <div>
                <label className="mb-1 block text-sm font-medium text-chalkboard-dark">Your name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={15}
                  placeholder="Backbencher"
                  className="w-full rounded-md border border-paper-line bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-inkblue"
                />
              </div>
              <button
                onClick={handleStart}
                className="w-full rounded-md bg-inkblue px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Start Match
              </button>
            </div>
          </div>
        ) : (
          <PracticeRoomView
            room={room}
            socket={socket}
            getServerTime={getServerTime}
            onSubmitTossDecision={submitTossDecision}
            onSubmitMove={submitMove}
            onStartSecondInnings={startSecondInnings}
            onPlayAgain={submitRematch}
            onLeaveRoom={resetPractice}
          />
        )}
      </div>
    </main>
  );
}

function PracticeRoomView({
  room,
  socket,
  getServerTime,
  onSubmitTossDecision,
  onSubmitMove,
  onStartSecondInnings,
  onPlayAgain,
  onLeaveRoom,
}: {
  room: GameRoom;
  socket: any;
  getServerTime: () => number;
  onSubmitTossDecision: (choice: "bat" | "bowl") => void;
  onSubmitMove: (choice: number) => void;
  onStartSecondInnings: () => void;
  onPlayAgain: (accept: boolean) => void;
  onLeaveRoom: () => void;
}) {
  switch (room.status) {
    case "TOSS":
    case "BAT_OR_BOWL":
      return (
        <Toss
          room={room}
          currentPlayerId={HUMAN_ID}
          onSubmitTossGuess={() => {}}
          onSubmitTossDecision={onSubmitTossDecision}
        />
      );
    case "FIRST_INNINGS":
    case "SECOND_INNINGS":
    case "CHANGE_INNINGS":
      return (
        <GameScreen
          room={room}
          currentPlayerId={HUMAN_ID}
          socket={socket}
          getServerTime={getServerTime}
          onSubmitMove={onSubmitMove}
          onStartSecondInnings={onStartSecondInnings}
        />
      );
    case "RESULT":
    case "REMATCH":
      return (
        <Results room={room} currentPlayerId={HUMAN_ID} onPlayAgain={onPlayAgain} onLeaveRoom={onLeaveRoom} />
      );
    default:
      return <div className="py-20 text-center text-chalkboard-dark/50">Setting up...</div>;
  }
}
