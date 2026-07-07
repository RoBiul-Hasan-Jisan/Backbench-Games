"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import { useRoomStore } from "@/store/useRoomStore";
import { Users, Bot, DoorOpen } from "lucide-react";

type Mode = "menu" | "create" | "join";

export default function GameLobbyClient({
  gameId,
  gameName,
}: {
  gameId: string;
  gameName: string;
}) {
  const router = useRouter();
  const { playerName, setPlayerName, setSession } = useRoomStore();
  const [mode, setMode] = useState<Mode>("menu");
  const [name, setName] = useState(playerName);
  const [joinCode, setJoinCode] = useState("");
  const [bestOf, setBestOf] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function persistName() {
    const trimmed = name.trim() || "Backbencher";
    setPlayerName(trimmed);
    return trimmed;
  }

  function handleCreate() {
    setBusy(true);
    setError(null);
    const playerName = persistName();
    const settings = gameId === "rock-paper-scissors" ? { bestOf } : {};

    getSocket().emit(
      "create_room",
      { gameType: gameId, settings, playerName },
      (res: any) => {
        setBusy(false);
        if (!res?.ok) return setError(res?.reason || "Could not create room.");
        setSession(res.roomCode, res.playerToken, res.role);
        router.push(`/play/${gameId}/${res.roomCode}`);
      }
    );
  }

  function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (!code) return setError("Enter a room code.");
    setBusy(true);
    setError(null);
    const playerName = persistName();

    getSocket().emit("join_room", { roomCode: code, playerName }, (res: any) => {
      setBusy(false);
      if (!res?.ok) return setError(res?.reason || "Room not found.");
      setSession(code, res.playerToken, res.role);
      router.push(`/play/${gameId}/${code}`);
    });
  }

  return (
    <main className="bg-notebook min-h-screen px-6 py-16">
      <div className="mx-auto max-w-md">
        <p className="mb-1 font-mono text-xs uppercase tracking-widest text-wood">
          {gameName}
        </p>
        <h1 className="mb-8 text-3xl font-semibold text-chalkboard-dark">
          Ready to play?
        </h1>

        {mode === "menu" && (
          <div className="space-y-3">
            <button
              onClick={() => router.push(`/play/${gameId}/practice`)}
              className="flex w-full items-center gap-3 rounded-lg border border-paper-line bg-white/70 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Bot className="text-inkblue" />
              <div>
                <p className="font-semibold text-chalkboard-dark">
                  Practice vs Computer
                </p>
                <p className="text-sm text-chalkboard-dark/60">No account, no waiting.</p>
              </div>
            </button>

            <button
              onClick={() => setMode("create")}
              className="flex w-full items-center gap-3 rounded-lg border border-paper-line bg-white/70 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Users className="text-inkblue" />
              <div>
                <p className="font-semibold text-chalkboard-dark">Create Room</p>
                <p className="text-sm text-chalkboard-dark/60">
                  Get a code, invite a friend.
                </p>
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
          </div>
        )}

        {(mode === "create" || mode === "join") && (
          <div className="space-y-4 rounded-lg border border-paper-line bg-white/70 p-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-chalkboard-dark">
                Your name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                placeholder="Backbencher"
                className="w-full rounded-md border border-paper-line bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-inkblue"
              />
            </div>

            {mode === "create" && gameId === "rock-paper-scissors" && (
              <div>
                <label className="mb-1 block text-sm font-medium text-chalkboard-dark">
                  Match length
                </label>
                <div className="flex gap-2">
                  {[3, 5, 7].map((n) => (
                    <button
                      key={n}
                      onClick={() => setBestOf(n)}
                      className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                        bestOf === n
                          ? "border-inkblue bg-inkblue text-white"
                          : "border-paper-line text-chalkboard-dark/70"
                      }`}
                    >
                      Best of {n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === "join" && (
              <div>
                <label className="mb-1 block text-sm font-medium text-chalkboard-dark">
                  Room code
                </label>
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  placeholder="A7KDQ9"
                  className="w-full rounded-md border border-paper-line bg-white px-3 py-2 font-mono text-sm tracking-widest outline-none focus:ring-2 focus:ring-inkblue"
                />
              </div>
            )}

            {error && <p className="text-sm text-redpen">{error}</p>}

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
    </main>
  );
}
