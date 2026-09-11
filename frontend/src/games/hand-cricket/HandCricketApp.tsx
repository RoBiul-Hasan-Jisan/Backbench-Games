"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Bot, DoorOpen, Users } from "lucide-react";
import { useRoomStore } from "@/store/useRoomStore";
import { useHandCricketSocket, getOrCreatePlayerId } from "./useHandCricketSocket";
import { useTimeSync } from "./useTimeSync";
import { soundSynthesizer } from "./soundSynthesizer";
import { LobbyView } from "./LobbyView";
import { Toss } from "./Toss";
import { GameScreen } from "./GameScreen";
import { Results } from "./Results";
import { ConnectionAlert } from "./ConnectionAlert";

type Mode = "menu" | "create" | "join";

export function HandCricketApp() {
  const { playerName, setPlayerName } = useRoomStore();
  const [playerId, setPlayerId] = useState<string>("");
  const [mode, setMode] = useState<Mode>("menu");
  const [name, setName] = useState(playerName);
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);

  const {
    socket,
    connectionState,
    room,
    error,
    setError,
    createRoom,
    joinRoom,
    setReady,
    startGame,
    submitTossGuess,
    submitTossDecision,
    submitMove,
    submitRematch,
    startSecondInnings,
    leaveRoom,
    resetRoomState,
  } = useHandCricketSocket();

  const { getServerTime } = useTimeSync(socket);

  useEffect(() => {
    setPlayerId(getOrCreatePlayerId());
  }, []);

  useEffect(() => {
    const handleInteraction = () => soundSynthesizer.init();
    window.addEventListener("click", handleInteraction);
    window.addEventListener("touchstart", handleInteraction);
    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };
  }, []);

  const persistName = () => {
    const trimmed = name.trim() || "Backbencher";
    setPlayerName(trimmed);
    return trimmed;
  };

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    const nickname = persistName();
    try {
      await createRoom(playerId, nickname);
    } catch {
      // error already set by the hook
    }
    setBusy(false);
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return setError("Enter a room code.");
    setBusy(true);
    setError(null);
    const nickname = persistName();
    try {
      await joinRoom(code, playerId, nickname);
    } catch {
      // error already set by the hook
    }
    setBusy(false);
  };

  const handleExit = () => {
    if (room && playerId) {
      leaveRoom(room.code, playerId).catch(() => {});
    }
    resetRoomState();
    setMode("menu");
  };

  if (!playerId) return null; // brief flash while the persistent playerId loads

  return (
    <main className="bg-notebook min-h-screen px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex items-center justify-between border-b border-paper-line pb-4">
          <div className="flex cursor-pointer items-center gap-2 select-none" onClick={handleExit}>
            <span className="font-mono text-xs uppercase tracking-widest text-wood">Hand Cricket</span>
          </div>
          <ConnectionAlert
            connectionState={connectionState}
            room={room}
            currentPlayerId={playerId}
            onExit={handleExit}
          />
        </header>

        {error && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-redpen/30 bg-redpen/10 p-4 text-sm text-redpen">
            <span className="flex items-center gap-2 font-medium">
              <AlertCircle className="h-5 w-5 flex-shrink-0" /> {error}
            </span>
            <button
              onClick={() => setError(null)}
              className="rounded px-2 py-1 text-xs font-bold uppercase hover:bg-redpen/10"
            >
              Dismiss
            </button>
          </div>
        )}

        {!room ? (
          <div className="mx-auto max-w-md">
            <p className="mb-8 text-3xl font-semibold text-chalkboard-dark">Ready to play?</p>

            {mode === "menu" && (
              <div className="space-y-3">
                <button
                  onClick={() => setMode("create")}
                  className="flex w-full items-center gap-3 rounded-lg border border-paper-line bg-white/70 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Users className="text-inkblue" />
                  <div>
                    <p className="font-semibold text-chalkboard-dark">Create Room</p>
                    <p className="text-sm text-chalkboard-dark/60">Get a code, invite a friend.</p>
                  </div>
                </button>

                <button
                  onClick={() => setMode("join")}
                  className="flex w-full items-center gap-3 rounded-lg border border-paper-line bg-white/70 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <DoorOpen className="text-inkblue" />
                  <div>
                    <p className="font-semibold text-chalkboard-dark">Join Room</p>
                    <p className="text-sm text-chalkboard-dark/60">Have a code already?</p>
                  </div>
                </button>

                <Link
                  href="/play/hand-cricket/practice"
                  className="flex w-full items-center gap-3 rounded-lg border border-paper-line bg-white/70 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Bot className="text-inkblue" />
                  <div>
                    <p className="font-semibold text-chalkboard-dark">Practice vs Computer</p>
                    <p className="text-sm text-chalkboard-dark/60">No opponent? Play the bot.</p>
                  </div>
                </Link>
              </div>
            )}

            {(mode === "create" || mode === "join") && (
              <div className="space-y-4 rounded-lg border border-paper-line bg-white/70 p-6">
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

                {mode === "join" && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-chalkboard-dark">Room code</label>
                    <input
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                      maxLength={6}
                      placeholder="A7KDQ9"
                      className="w-full rounded-md border border-paper-line bg-white px-3 py-2 font-mono text-sm tracking-widest outline-none focus:ring-2 focus:ring-inkblue"
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setMode("menu")}
                    className="rounded-md border border-paper-line px-4 py-2 text-sm font-medium text-chalkboard-dark/70"
                  >
                    Back
                  </button>
                  <button
                    disabled={busy}
                    onClick={mode === "create" ? handleCreate : handleJoin}
                    className="flex-1 rounded-md bg-inkblue px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                  >
                    {busy ? "..." : mode === "create" ? "Create Room" : "Join Room"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
       <RoomView
  room={room}
  playerId={playerId}
  socket={socket}
  getServerTime={getServerTime}
  onSetReady={(ready: boolean) => setReady(room.code, playerId, ready)}
  onStartGame={() => startGame(room.code, playerId)}
  onSubmitTossGuess={(prediction: "heads" | "tails") => submitTossGuess(room.code, playerId, prediction)}
  onSubmitTossDecision={(choice: 'bat' | 'bowl') => submitTossDecision(room.code, playerId, choice)}
  onSubmitMove={(choice: number) => submitMove(room.code, playerId, choice)}
  onStartSecondInnings={() => startSecondInnings(room.code, playerId)}
  onPlayAgain={(accept: boolean) => submitRematch(room.code, playerId, accept)}
  onLeaveRoom={handleExit}
/>
        )}
      </div>
    </main>
  );
}

function RoomView({
  room,
  playerId,
  socket,
  getServerTime,
  onSetReady,
  onStartGame,
  onSubmitTossGuess,
  onSubmitTossDecision,
  onSubmitMove,
  onStartSecondInnings,
  onPlayAgain,
  onLeaveRoom,
}: any) {
  switch (room.status) {
    case "WAITING":
    case "LOBBY":
    case "READY":
      return (
        <LobbyView
          room={room}
          currentPlayerId={playerId}
          onSetReady={onSetReady}
          onStartGame={onStartGame}
          onLeaveRoom={onLeaveRoom}
        />
      );
    case "TOSS":
    case "BAT_OR_BOWL":
      return (
        <Toss
          room={room}
          currentPlayerId={playerId}
          onSubmitTossGuess={onSubmitTossGuess}
          onSubmitTossDecision={onSubmitTossDecision}
        />
      );
    case "FIRST_INNINGS":
    case "SECOND_INNINGS":
    case "CHANGE_INNINGS":
      return (
        <GameScreen
          room={room}
          currentPlayerId={playerId}
          socket={socket}
          getServerTime={getServerTime}
          onSubmitMove={onSubmitMove}
          onStartSecondInnings={onStartSecondInnings}
        />
      );
    case "RESULT":
    case "REMATCH":
      return (
        <Results room={room} currentPlayerId={playerId} onPlayAgain={onPlayAgain} onLeaveRoom={onLeaveRoom} />
      );
    default:
      return <div className="py-20 text-center text-chalkboard-dark/50">Invalid state. Leaving room...</div>;
  }
}
