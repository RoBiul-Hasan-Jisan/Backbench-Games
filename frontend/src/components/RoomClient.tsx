"use client";

import { useEffect, useState } from "react";
import { getSocket, type RoomView } from "@/lib/socket";
import { useRoomStore, getStoredToken } from "@/store/useRoomStore";
import WaitingRoom from "@/components/WaitingRoom";
import TicTacToeBoard from "@/games/tic-tac-toe/TicTacToeBoard";
import RPSGame from "@/games/rock-paper-scissors/RPSGame";

type JoinPhase = "connecting" | "need-name" | "ready" | "not-found";

export default function RoomClient({
  gameId,
  roomCode,
}: {
  gameId: string;
  roomCode: string;
}) {
  const { room, setRoom, playerToken, myRole, setSession, setPlayerName, playerName } =
    useRoomStore();
  const [phase, setPhase] = useState<JoinPhase>("connecting");
  const [nameInput, setNameInput] = useState(playerName);
  const [error, setError] = useState<string | null>(null);

  // On mount: either rejoin with a stored token, or join fresh (someone
  // opened a shared link directly without going through the lobby).
  useEffect(() => {
    const socket = getSocket();
    const storedToken = getStoredToken(roomCode);

    function attachRoomListener() {
      socket.on("room_update", (r: RoomView) => setRoom(r));
    }

    if (storedToken) {
      socket.emit("rejoin_room", { roomCode, playerToken: storedToken }, (res: any) => {
        if (res?.ok) {
          setSession(roomCode, storedToken, res.role);
          setRoom(res.room);
          attachRoomListener();
          setPhase("ready");
        } else {
          setPhase("not-found");
        }
      });
    } else {
      setPhase("need-name");
    }

    return () => {
      socket.off("room_update");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  function handleJoinWithName() {
    const socket = getSocket();
    const name = nameInput.trim() || "Backbencher";
    setPlayerName(name);

    socket.emit("join_room", { roomCode, playerName: name }, (res: any) => {
      if (!res?.ok) {
        setError(res?.reason || "Room not found.");
        setPhase("not-found");
        return;
      }
      setSession(roomCode, res.playerToken, res.role);
      setRoom(res.room);
      socket.on("room_update", (r: RoomView) => setRoom(r));
      setPhase("ready");
    });
  }

  function handleReady() {
    getSocket().emit("player_ready", { roomCode });
  }

  function handlePlayAgain() {
    getSocket().emit("play_again", { roomCode });
  }

  function handleCellClick(index: number) {
    getSocket().emit("make_move", { roomCode, cellIndex: index }, (res: any) => {
      if (!res?.ok) setError(res?.reason || null);
    });
  }

  function handlePick(pick: string) {
    getSocket().emit("submit_pick", { roomCode, pick }, (res: any) => {
      if (!res?.ok) setError(res?.reason || null);
    });
  }

  if (phase === "connecting") {
    return <CenteredMessage text="Connecting..." />;
  }

  if (phase === "not-found") {
    return <CenteredMessage text="Room not found." isError />;
  }

  if (phase === "need-name") {
    return (
      <main className="bg-notebook flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-sm rounded-lg border border-paper-line bg-white/70 p-6">
          <p className="mb-1 font-mono text-xs uppercase tracking-widest text-wood">
            Joining {roomCode}
          </p>
          <h1 className="mb-4 text-xl font-semibold text-chalkboard-dark">
            What's your name?
          </h1>
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            maxLength={20}
            placeholder="Backbencher"
            className="mb-3 w-full rounded-md border border-paper-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-inkblue"
          />
          {error && <p className="mb-2 text-sm text-redpen">{error}</p>}
          <button
            onClick={handleJoinWithName}
            className="w-full rounded-md bg-inkblue px-4 py-2 text-sm font-semibold text-white"
          >
            Join Room
          </button>
        </div>
      </main>
    );
  }

  if (!room) return <CenteredMessage text="Loading room..." />;

  const me = room.players.find((p) => p.role === myRole);
  const iAmReady = !!me?.ready;

  return (
    <main className="bg-notebook min-h-screen px-6 py-16">
      {room.status === "waiting" && (
        <WaitingRoom room={room} isReady={iAmReady} onReady={handleReady} />
      )}

      {room.status === "active" && room.gameType === "tic-tac-toe" && (
        <div className="text-center">
          <TurnBanner
            label={room.state.turn === myRole ? "Your turn" : "Opponent's turn"}
            active={room.state.turn === myRole}
          />
          <TicTacToeBoard
            board={room.state.board}
            winLine={room.state.winLine}
            disabled={room.state.turn !== myRole}
            onCellClick={handleCellClick}
          />
        </div>
      )}

      {room.status === "active" && room.gameType === "rock-paper-scissors" && (
        <div>
          <ScoreBanner room={room} myRole={myRole} />
          <RPSGame
            hasPicked={!!room.state.picks?.[myRole ?? ""]}
            disabled={false}
            lastRoundResult={room.state.lastRoundResult}
            onPick={handlePick}
          />
        </div>
      )}

      {room.status === "finished" && (
        <WinnerScreen room={room} myRole={myRole} onPlayAgain={handlePlayAgain} />
      )}

      {error && <p className="mt-4 text-center text-sm text-redpen">{error}</p>}
    </main>
  );
}

function CenteredMessage({ text, isError }: { text: string; isError?: boolean }) {
  return (
    <main className="bg-notebook flex min-h-screen items-center justify-center px-6">
      <p className={isError ? "text-redpen" : "text-chalkboard-dark/60"}>{text}</p>
    </main>
  );
}

function TurnBanner({ label, active }: { label: string; active: boolean }) {
  return (
    <p
      className={`mb-6 font-mono text-sm uppercase tracking-widest ${
        active ? "text-inkblue" : "text-chalkboard-dark/40"
      }`}
    >
      {label}
    </p>
  );
}

function ScoreBanner({ room, myRole }: { room: RoomView; myRole: string | null }) {
  const scores = room.state.scores || {};
  const total = Object.values(scores as Record<string, number>).reduce(
    (a, b) => a + b,
    0
  );
  return (
    <p className="mb-6 text-center font-mono text-sm text-chalkboard-dark/60">
      Round {room.state.round} · Best of {room.state.bestOf} · {total} played
    </p>
  );
}

function WinnerScreen({
  room,
  myRole,
  onPlayAgain,
}: {
  room: RoomView;
  myRole: string | null;
  onPlayAgain: () => void;
}) {
  let didIWin = false;
  let message = "It's a draw.";

  if (room.gameType === "tic-tac-toe") {
    if (room.state.winner === "draw") message = "It's a draw.";
    else {
      didIWin = room.state.winner === myRole;
      message = didIWin ? "You won!" : "You lost.";
    }
  } else if (room.gameType === "rock-paper-scissors") {
    didIWin = room.state.winnerId === myRole;
    message = didIWin ? "You won the match!" : "You lost the match.";
  }

  return (
    <div className="mx-auto max-w-sm text-center">
      <p className="mb-2 text-5xl">{didIWin ? "🏆" : "📚"}</p>
      <h2 className="mb-6 text-2xl font-semibold text-chalkboard-dark">{message}</h2>
      <button
        onClick={onPlayAgain}
        className="rounded-md bg-pencil px-6 py-3 font-semibold text-chalkboard-dark hover:brightness-105"
      >
        Play Again
      </button>
    </div>
  );
}
